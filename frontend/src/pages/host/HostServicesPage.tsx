import { Image as ImageIcon, Plus, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HostModal } from '../../components/host/HostModal';
import { useAuth } from '../../context/AuthContext';
import { formatFCFA } from '../../lib/format';
import { getEtablissementDetail, type BackendEtablissementDetail, type BackendService } from '../../lib/backendApi';
import { toUserFacingErrorMessage } from '../../lib/userFacingError';
import { serviceImageUrl } from '../../lib/serviceImage';

type HostEtablissement = {
  id: number;
  nom: string;
  ville: string;
};

type Draft = {
  nom: string;
  description: string;
  conditionsUtilisation: string;
  pricingType: 'INCLUDED' | 'PAID';
  disponibilite: 'PERMANENT' | 'ON_REQUEST' | 'SEASONAL';
  categorie: string;
  unite: string;
  prix: number;
  actif: boolean;
};

type ServiceRow = {
  id: number;
  nom: string;
  categorie?: string;
  description?: string | null;
  conditionsUtilisation?: string | null;
  pricingType?: 'INCLUDED' | 'PAID';
  disponibilite?: 'PERMANENT' | 'ON_REQUEST' | 'SEASONAL';
  prix: number;
  actif: boolean;
  unite?: string | null;
  imageUrl?: string | null;
};

const CATEGORY_FALLBACK = 'AUTRE';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });
}

/** Évite requêtes énormes (rejet 413) et lenteur : recompress en JPEG. */
function fileToCompressedJpegDataUrl(
  file: File,
  maxLongEdge = 1920,
  maxBase64Length = 2_200_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const raw = r.result as string;
      const img = new window.Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (!w || !h) {
            reject(new Error('Image invalide'));
            return;
          }
          const m = Math.max(w, h);
          if (m > maxLongEdge) {
            const s = maxLongEdge / m;
            w = Math.round(w * s);
            h = Math.round(h * s);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas indisponible'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          let q = 0.88;
          let out = canvas.toDataURL('image/jpeg', q);
          while (out.length > maxBase64Length && q > 0.45) {
            q -= 0.06;
            out = canvas.toDataURL('image/jpeg', q);
          }
          if (out.length > 4_200_000) {
            reject(new Error("L'image est encore trop lourde. Utilisez une photo plus petite."));
            return;
          }
          resolve(out);
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Traitement de l'image impossible"));
        }
      };
      img.onerror = () => reject(new Error('Fichier non lisible en tant qu’image'));
      img.src = raw;
    };
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });
}

function serviceToRow(s: BackendService): ServiceRow {
  const cat = s.categorie ? String(s.categorie) : undefined;
  return {
    id: s.id,
    nom: s.libelle,
    categorie: cat,
    description: s.description ?? null,
    conditionsUtilisation: s.conditionsUtilisation ?? null,
    pricingType: s.pricingType,
    disponibilite: s.disponibilite,
    prix: s.prix,
    actif: s.actif,
    unite: s.unite ?? undefined,
    imageUrl: s.imageUrl ?? null,
  };
}

export function HostServicesPage() {
  const { authedFetch } = useAuth();
  const [search] = useSearchParams();

  const [etablissements, setEtablissements] = useState<HostEtablissement[]>([]);
  const [selectedEtablissementId, setSelectedEtablissementId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);

  const [services, setServices] = useState<ServiceRow[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Aperçu (URL /api ou data URL). */
  const [imageDisplay, setImageDisplay] = useState<string | null>(null);
  const [initialServiceImage, setInitialServiceImage] = useState<string | null>(null);
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState<string | null>(null);
  /** true si l’hôte a retiré une image déjà enregistrée côté serveur. */
  const [serverImageRemoved, setServerImageRemoved] = useState(false);

  const [draft, setDraft] = useState<Draft>({
    nom: '',
    description: '',
    conditionsUtilisation: '',
    pricingType: 'PAID',
    disponibilite: 'PERMANENT',
    categorie: CATEGORY_FALLBACK,
    unite: '',
    prix: 0,
    actif: true,
  });

  const modalTitle = mode === 'add' ? 'Ajouter un nouveau service' : 'Modifier le service';

  const canSubmit = (() => {
    if (draft.nom.trim().length === 0) return false;
    if (!Number.isFinite(draft.prix) || draft.prix < 0) return false;
    if (draft.pricingType === 'PAID') return draft.prix > 0;
    return true; // INCLUDED can be 0
  })();

  function openAdd() {
    setFormError(null);
    setMode('add');
    setEditingId(null);
    setDraft({
      nom: '',
      description: '',
      conditionsUtilisation: '',
      pricingType: 'PAID',
      disponibilite: 'PERMANENT',
      categorie: CATEGORY_FALLBACK,
      unite: '',
      prix: 0,
      actif: true,
    });
    setImageDisplay(null);
    setInitialServiceImage(null);
    setPendingImageDataUrl(null);
    setServerImageRemoved(false);
    setModalOpen(true);
  }

  function openEdit(s: ServiceRow) {
    setFormError(null);
    setMode('edit');
    setEditingId(s.id);
    setDraft({
      nom: s.nom,
      description: s.description ?? '',
      conditionsUtilisation: s.conditionsUtilisation ?? '',
      pricingType: s.pricingType ?? 'PAID',
      disponibilite: s.disponibilite ?? 'PERMANENT',
      categorie: s.categorie ?? CATEGORY_FALLBACK,
      unite: s.unite ?? '',
      prix: s.prix ?? 0,
      actif: s.actif,
    });
    setInitialServiceImage(s.imageUrl ?? null);
    setPendingImageDataUrl(null);
    setServerImageRemoved(false);
    setImageDisplay(s.imageUrl ?? null);
    setModalOpen(true);
  }

  function closeModal() {
    setFormError(null);
    setModalOpen(false);
  }

  async function loadEtablissements() {
    const list = await authedFetch<HostEtablissement[]>('/host/etablissements/mes').then((r) => r.data);
    setEtablissements(list);
    setSelectedEtablissementId((prev) => prev ?? (list[0]?.id ?? null));
  }

  async function loadServicesFor(etabId: number) {
    const detail = await getEtablissementDetail(etabId);
    const list = (detail as BackendEtablissementDetail).services ?? [];
    setServices(list.map(serviceToRow));
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    loadEtablissements()
      .catch((e2) => {
        if (!alive) return;
        setError(e2 instanceof Error ? e2.message : 'Chargement impossible');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const etabIdFromUrl = Number(search.get('etablissementId') ?? '');
    if (Number.isFinite(etabIdFromUrl) && etabIdFromUrl > 0) {
      setSelectedEtablissementId(etabIdFromUrl);
    }
  }, [search]);

  useEffect(() => {
    if (!selectedEtablissementId) return;
    loadServicesFor(selectedEtablissementId).catch(() => setServices([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEtablissementId]);

  useEffect(() => {
    const editId = Number(search.get('editId') ?? '');
    if (!Number.isFinite(editId) || editId <= 0) return;
    const row = services.find((s) => s.id === editId);
    if (row) openEdit(row);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, services]);

  async function refresh() {
    if (!selectedEtablissementId) return;
    await loadServicesFor(selectedEtablissementId);
  }

  async function submit() {
    if (!selectedEtablissementId) return;
    if (!canSubmit) return;
    if (imageProcessing) return;
    if (submitting) return;
    setFormError(null);
    setSubmitting(true);
    try {
      if (mode === 'add') {
        const payload: Record<string, unknown> = {
          etablissementId: selectedEtablissementId,
          libelle: draft.nom.trim(),
          description: draft.description.trim() ? draft.description.trim() : null,
          categorie: draft.categorie || CATEGORY_FALLBACK,
          pricingType: draft.pricingType,
          disponibilite: draft.disponibilite,
          prix: draft.pricingType === 'INCLUDED' ? 0 : draft.prix,
          unite: draft.unite.trim() ? draft.unite.trim() : null,
          conditionsUtilisation: draft.conditionsUtilisation.trim()
            ? draft.conditionsUtilisation.trim()
            : null,
          actif: draft.actif,
        };
        if (pendingImageDataUrl) {
          payload.imageDataUrl = pendingImageDataUrl;
        }
        await authedFetch('/host/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else if (mode === 'edit' && editingId != null) {
        const payload: Record<string, unknown> = {
          libelle: draft.nom.trim(),
          description: draft.description.trim() ? draft.description.trim() : null,
          categorie: draft.categorie || CATEGORY_FALLBACK,
          pricingType: draft.pricingType,
          disponibilite: draft.disponibilite,
          prix: draft.pricingType === 'INCLUDED' ? 0 : draft.prix,
          unite: draft.unite.trim() ? draft.unite.trim() : null,
          conditionsUtilisation: draft.conditionsUtilisation.trim()
            ? draft.conditionsUtilisation.trim()
            : null,
          actif: draft.actif,
        };
        if (pendingImageDataUrl) {
          payload.imageDataUrl = pendingImageDataUrl;
        } else if (serverImageRemoved) {
          payload.clearImage = true;
        }
        await authedFetch(`/host/services/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      await refresh();
      setModalOpen(false);
      setFormError(null);
    } catch (e) {
      setFormError(toUserFacingErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(serviceId: number, next: boolean) {
    if (submitting) return;
    const row = services.find((s) => s.id === serviceId);
    if (!row) return;
    setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, actif: next } : s)));
    try {
      await authedFetch(`/host/services/${serviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          actif: next,
          libelle: row.nom,
          description: row.description ?? null,
          conditionsUtilisation: row.conditionsUtilisation ?? null,
          pricingType: row.pricingType ?? 'PAID',
          disponibilite: row.disponibilite ?? 'PERMANENT',
          categorie: row.categorie ?? CATEGORY_FALLBACK,
          prix: row.pricingType === 'INCLUDED' ? 0 : row.prix,
          unite: row.unite ?? null,
        }),
      });
      await refresh();
    } catch {
      await refresh();
    }
  }

  async function deleteService(serviceId: number) {
    try {
      await authedFetch(`/host/services/${serviceId}`, { method: 'DELETE' });
      await refresh();
    } catch {
      await refresh();
    }
  }

  async function onServiceImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    setImageProcessing(true);
    try {
      const d = await fileToCompressedJpegDataUrl(file);
      setPendingImageDataUrl(d);
      setImageDisplay(d);
      setServerImageRemoved(false);
    } catch (err) {
      setFormError(toUserFacingErrorMessage(err));
    } finally {
      setImageProcessing(false);
    }
  }

  function removeServiceImage() {
    if (pendingImageDataUrl) {
      setPendingImageDataUrl(null);
      setImageDisplay(initialServiceImage);
      setServerImageRemoved(false);
    } else if (initialServiceImage) {
      setImageDisplay(null);
      setServerImageRemoved(true);
    }
  }

  const categoryLabel = useMemo(() => {
    const map: Record<string, string> = {
      PETIT_DEJEUNER: 'Petit-déjeuner',
      MENAGE: 'Ménage',
      PARKING: 'Parking',
      WIFI: 'WiFi',
      ANIMAUX: 'Animaux',
      CLIMATISATION: 'Climatisation',
      AUTRE: 'Autre',
    };
    return map;
  }, []);

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Gestion des services</h1>
          <p className="mt-1 text-sm text-muted">Gérez vos services additionnels.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Ajouter un service
        </button>
      </div>

      {etablissements.length > 0 ? (
        <div className="mt-4">
          <label className="text-sm font-semibold text-ink">
            Établissement
            <select
              value={selectedEtablissementId ?? ''}
              onChange={(e) => setSelectedEtablissementId(Number(e.target.value))}
              className="ml-3 rounded-control bg-surface px-3 py-2 text-sm text-ink outline-none ring-brand focus:ring-2"
            >
              {etablissements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} ({e.ville})
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-muted">Chargement…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : services.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aucun service pour le moment.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => openEdit(s)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openEdit(s);
                }
              }}
              className="cursor-pointer overflow-hidden rounded-card border border-line bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md"
            >
              <div className="relative h-40 w-full bg-surface">
                <img
                  src={serviceImageUrl({ libelle: s.nom, categorie: s.categorie ?? null, imageUrl: s.imageUrl })}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-ink">{s.nom}</h2>
                    <p className="mt-1 text-sm text-muted line-clamp-2">
                      {s.description?.trim()
                        ? s.description
                        : s.pricingType === 'INCLUDED'
                          ? 'Service inclus dans le prix.'
                          : 'Service additionnel.'}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.pricingType === 'INCLUDED' ? (
                      <>
                        <p className="text-lg font-bold text-ink">Inclus</p>
                        <p className="text-xs text-muted">—</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-brand">{formatFCFA(s.prix)}</p>
                        <p className="text-xs text-muted">FCFA</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted">
                    {s.categorie ? `Catégorie : ${categoryLabel[s.categorie] ?? s.categorie}` : 'Catégorie : —'}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {s.pricingType === 'INCLUDED' ? '✓ Inclus' : '€ Payant'}
                    {s.disponibilite ? ` · ${s.disponibilite.replaceAll('_', ' ')}` : ''}
                    {s.unite ? ` · ${s.unite}` : ''}
                  </p>
                </div>

                <p className="mt-2 text-xs text-brand">Cliquer pour modifier</p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                  <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
                    <span className="text-muted">Disponible</span>
                    <input
                      type="checkbox"
                      checked={s.actif}
                      onChange={(e) => void toggleActive(s.id, e.target.checked)}
                      className="h-4 w-4 accent-ink"
                      aria-label="Toggle disponible"
                    />
                    <span className="text-ink font-semibold">{s.actif ? 'On' : 'Off'}</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-ink hover:underline"
                      aria-label="Modifier le service"
                      onClick={() => openEdit(s)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      aria-label="Supprimer le service"
                      onClick={() => void deleteService(s.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <HostModal
        open={modalOpen}
        title={modalTitle}
        onClose={closeModal}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
              onClick={closeModal}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!canSubmit || submitting || imageProcessing}
              onClick={() => void submit()}
            >
              {submitting
                ? 'Enregistrement…'
                : imageProcessing
                  ? 'Image…'
                  : mode === 'add'
                    ? 'Ajouter'
                    : 'Enregistrer'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {formError ? (
            <p className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {formError}
            </p>
          ) : null}
          <label className="block text-sm font-semibold text-ink">
            Nom du service
            <input
              value={draft.nom}
              onChange={(e) => setDraft((p) => ({ ...p, nom: e.target.value }))}
              className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Description
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className="mt-2 min-h-[90px] w-full resize-none rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Tarification
              <select
                value={draft.pricingType}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    pricingType: e.target.value as Draft['pricingType'],
                    prix: e.target.value === 'INCLUDED' ? 0 : p.prix,
                  }))
                }
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              >
                <option value="PAID">Payant</option>
                <option value="INCLUDED">Inclus</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Disponibilité
              <select
                value={draft.disponibilite}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, disponibilite: e.target.value as Draft['disponibilite'] }))
                }
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              >
                <option value="PERMANENT">Permanent</option>
                <option value="ON_REQUEST">Sur demande</option>
                <option value="SEASONAL">Saisonnier</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Catégorie
              <select
                value={draft.categorie}
                onChange={(e) => setDraft((p) => ({ ...p, categorie: e.target.value }))}
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              >
                {Object.keys(categoryLabel).map((k) => (
                  <option key={k} value={k}>
                    {categoryLabel[k] ?? k}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Unité (optionnel)
              <input
                value={draft.unite}
                onChange={(e) => setDraft((p) => ({ ...p, unite: e.target.value }))}
                placeholder="ex. nuit, séjour, personne"
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-ink">
            Prix (FCFA)
            <input
              type="number"
              min={0}
              step="1"
              value={Number.isFinite(draft.prix) ? String(draft.prix) : ''}
              disabled={draft.pricingType === 'INCLUDED'}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setDraft((p) => ({ ...p, prix: 0 }));
                  return;
                }
                const n = parseFloat(raw);
                setDraft((p) => ({ ...p, prix: Number.isFinite(n) && n >= 0 ? n : p.prix }));
              }}
              className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Conditions d&apos;utilisation (optionnel)
            <textarea
              value={draft.conditionsUtilisation}
              onChange={(e) => setDraft((p) => ({ ...p, conditionsUtilisation: e.target.value }))}
              placeholder="ex. sur réservation 24h avant, horaires, âge minimum, etc."
              className="mt-2 min-h-[90px] w-full resize-none rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-control bg-surface px-4 py-3 text-sm">
            <span className="text-muted font-semibold text-ink">Disponible</span>
            <input
              type="checkbox"
              checked={draft.actif}
              onChange={(e) => setDraft((p) => ({ ...p, actif: e.target.checked }))}
              className="h-4 w-4 accent-ink"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-ink">Image du service</p>
            <p className="mb-2 text-xs text-muted">Visuel montré aux voyageurs (JPEG, PNG ou WebP, max. 5 Mo)</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-40 w-full overflow-hidden rounded-control border border-line bg-surface sm:max-w-[200px]">
                {imageDisplay ? (
                  <img src={imageDisplay} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <ImageIcon className="h-10 w-10" aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-control border border-dashed border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink transition hover:border-brand/50 ${imageProcessing ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  <span>{imageProcessing ? 'Préparation de l’image…' : 'Choisir un fichier'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="sr-only"
                    disabled={imageProcessing}
                    onChange={(e) => void onServiceImageFileChange(e)}
                  />
                </label>
                {imageDisplay || pendingImageDataUrl ? (
                  <button
                    type="button"
                    onClick={removeServiceImage}
                    className="text-left text-sm text-red-600 hover:underline"
                  >
                    Retirer l&apos;image
                  </button>
                ) : null}
                {mode === 'edit' && serverImageRemoved ? (
                  <p className="text-xs text-muted">L&apos;image enregistrée sera supprimée à l&apos;enregistrement.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </HostModal>
    </div>
  );
}

