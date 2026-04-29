import { Plus, Upload, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HostModal } from '../../components/host/HostModal';
import { useAuth } from '../../context/AuthContext';
import {
  getTypesChambreActifs,
  type BackendCatalogTypeChambre,
} from '../../lib/backendApi';
import { formatFCFA } from '../../lib/format';
import { toUserFacingErrorMessage } from '../../lib/userFacingError';

type BackendStatutChambre = 'DISPONIBLE' | 'OCCUPEE' | 'MAINTENANCE' | 'INDISPONIBLE';

/** Aligné sur {@code ChambreResponse} (type = référentiel admin, pas un enum JSON). */
type BackendChambre = {
  id: number;
  nom: string;
  nomPersonnalise?: string | null;
  typeChambreId: number;
  typeChambreLibelle?: string | null;
  statut: BackendStatutChambre;
  prixNuit: number;
  capacitePersonnes: number | null;
  etablissementId: number;
  photoUrls?: string[] | null;
};

function displayRoomName(r: BackendChambre): string {
  const p = r.nomPersonnalise?.trim();
  if (p) return p;
  return r.nom?.trim() || 'Sans nom';
}

type HostEtablissement = {
  id: number;
  nom: string;
  ville: string;
};

type ImagePreview = {
  id: string;
  src: string;
  fileName?: string;
  objectUrl: boolean;
  file?: File;
  /** Photo déjà sur le serveur (édition). */
  remoteUrl?: string;
};

const MAX_ROOM_PHOTOS = 12;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Lecture de la photo impossible'));
    r.readAsDataURL(blob);
  });
}

async function buildPhotosPayload(images: ImagePreview[]): Promise<string[]> {
  const out: string[] = [];
  for (const img of images) {
    if (img.file) {
      out.push(await fileToDataUrl(img.file));
    } else if (img.remoteUrl) {
      const res = await fetch(img.remoteUrl);
      if (!res.ok) {
        throw new Error(`Photo existante inaccessible (${res.status})`);
      }
      out.push(await blobToDataUrl(await res.blob()));
    }
  }
  return out;
}

type Draft = {
  /** Nom affiché aux voyageurs (style Booking.com). */
  nomPersonnalise: string;
  description: string; // UI-only (backend Chambre ne stocke pas de description)
  typeChambreId: number | null;
  prixNuit: number;
  capacitePersonnes: number;
  statut: BackendStatutChambre;
  images: ImagePreview[];
};

function placeholderRoomImage(id: number) {
  const images = [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80',
  ];
  return images[Math.abs(id) % images.length]!;
}

function createImagePreviews(files: FileList | null): ImagePreview[] {
  if (!files || files.length === 0) return [];
  return Array.from(files).map((f, i) => ({
    id: `${Date.now()}-${i}`,
    src: URL.createObjectURL(f),
    fileName: f.name,
    objectUrl: true,
    file: f,
  }));
}

export function HostChambresPage() {
  const { authedFetch } = useAuth();
  const [search] = useSearchParams();

  const [etablissements, setEtablissements] = useState<HostEtablissement[]>([]);
  const [selectedEtablissementId, setSelectedEtablissementId] = useState<number | null>(null);
  const [roomTypes, setRoomTypes] = useState<BackendCatalogTypeChambre[]>([]);
  const [roomTypesError, setRoomTypesError] = useState<string | null>(null);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);
  const [rooms, setRooms] = useState<BackendChambre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft>(() => ({
    nomPersonnalise: '',
    description: '',
    typeChambreId: null,
    prixNuit: 0,
    capacitePersonnes: 2,
    statut: 'DISPONIBLE',
    images: [],
  }));

  const modalTitle = mode === 'add' ? 'Ajouter une nouvelle chambre' : 'Modifier la chambre';

  const imagePreviewsToRevoke = useMemo(() => draft.images.filter((x) => x.objectUrl), [draft.images]);

  function revokeObjectUrls() {
    imagePreviewsToRevoke.forEach((p) => {
      try {
        URL.revokeObjectURL(p.src);
      } catch {
        // ignore
      }
    });
  }

  function closeModal() {
    revokeObjectUrls();
    setModalOpen(false);
  }

  async function loadEtablissements() {
    const list = await authedFetch<HostEtablissement[]>('/host/etablissements/mes').then((r) => r.data);
    setEtablissements(list);
    setSelectedEtablissementId((prev) => prev ?? (list[0]?.id ?? null));
  }

  async function loadRooms(etabId: number) {
    const list = await authedFetch<BackendChambre[]>(`/etablissements/${etabId}/chambres`).then(
      (r) => r.data
    );
    setRooms(list);
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      setRoomTypesError(null);
      try {
        const types = await getTypesChambreActifs();
        if (!alive) return;
        setRoomTypes(types);
        setRoomTypesError(
          types.length === 0
            ? 'Aucun type de chambre disponible pour le moment.'
            : null
        );
      } catch (e) {
        if (!alive) return;
        setRoomTypes([]);
        setRoomTypesError(toUserFacingErrorMessage(e));
      }
    })();

    loadEtablissements()
      .catch((e2) => {
        if (!alive) return;
        setError(toUserFacingErrorMessage(e2));
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
    loadRooms(selectedEtablissementId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEtablissementId]);

  /** À l’ouverture du modal « ajout » : recharge les types (souvent vides au 1er chargement page). */
  useEffect(() => {
    if (!modalOpen || mode !== 'add') return;
    let alive = true;
    setRoomTypesLoading(true);
    void (async () => {
      try {
        const types = await getTypesChambreActifs();
        if (!alive) return;
        setRoomTypes(types);
        setRoomTypesError(
          types.length === 0
            ? 'Aucun type de chambre disponible pour le moment.'
            : null
        );
      } catch (e) {
        if (!alive) return;
        setRoomTypes([]);
        setRoomTypesError(toUserFacingErrorMessage(e));
      } finally {
        if (alive) setRoomTypesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [modalOpen, mode]);

  /** Complète typeChambreId par défaut quand la liste est disponible. */
  useEffect(() => {
    if (!modalOpen || mode !== 'add') return;
    if (roomTypes.length === 0) return;
    setDraft((p) => (p.typeChambreId == null ? { ...p, typeChambreId: roomTypes[0]!.id } : p));
  }, [modalOpen, mode, roomTypes]);

  useEffect(() => {
    const editId = Number(search.get('editId') ?? '');
    if (!selectedEtablissementId) return;
    if (!Number.isFinite(editId) || editId <= 0) return;
    const room = rooms.find((x) => x.id === editId);
    if (room) openEdit(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rooms, selectedEtablissementId]);

  function openAdd() {
    setMode('add');
    setEditingId(null);
    setModalError(null);
    setDraft({
      nomPersonnalise: '',
      description: '',
      typeChambreId: roomTypes[0]?.id ?? null,
      prixNuit: 0,
      capacitePersonnes: 2,
      statut: 'DISPONIBLE',
      images: [],
    });
    setModalOpen(true);
  }

  function openEdit(r: BackendChambre) {
    setMode('edit');
    setEditingId(r.id);
    setModalError(null);
    setDraft({
      nomPersonnalise: (r.nomPersonnalise ?? r.nom ?? '').trim(),
      description: '',
      typeChambreId: r.typeChambreId,
      prixNuit: Number(r.prixNuit),
      capacitePersonnes: r.capacitePersonnes ?? 0,
      statut: r.statut,
      images: (r.photoUrls ?? []).map((url, i) => ({
        id: `ex-${r.id}-${i}`,
        src: url,
        remoteUrl: url,
        objectUrl: false,
      })),
    });
    setModalOpen(true);
  }

  const prixOk = Number.isFinite(draft.prixNuit) && draft.prixNuit > 0;
  const capOk = Number.isFinite(draft.capacitePersonnes) && draft.capacitePersonnes > 0;

  const canSubmit =
    draft.nomPersonnalise.trim().length > 0 && prixOk && capOk && draft.typeChambreId != null;

  async function submit() {
    if (!selectedEtablissementId) return;
    if (!canSubmit) return;
    if (draft.typeChambreId == null) return;
    if (submitting) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const prixNuit = Number(draft.prixNuit);
      const capacitePersonnes = Math.trunc(Number(draft.capacitePersonnes));
      if (!Number.isFinite(prixNuit) || prixNuit <= 0) {
        setModalError('Indiquez un prix par nuit valide (nombre > 0).');
        return;
      }
      if (!Number.isFinite(capacitePersonnes) || capacitePersonnes <= 0) {
        setModalError('Indiquez une capacité valide (au moins 1 personne).');
        return;
      }

      if (mode === 'add') {
        const newFiles = draft.images.filter((i) => i.file).map((i) => i.file!);
        let photos: string[] | undefined;
        if (newFiles.length > 0) {
          photos = [];
          for (const f of newFiles) {
            photos.push(await fileToDataUrl(f));
          }
        }
        await authedFetch(`/host/chambres`, {
          method: 'POST',
          body: JSON.stringify({
            etablissementId: selectedEtablissementId,
            nomPersonnalise: draft.nomPersonnalise.trim(),
            typeChambreId: draft.typeChambreId,
            prixNuit,
            capacitePersonnes,
            surfaceM2: null,
            ...(photos && photos.length > 0 ? { photos } : {}),
          }),
        });
      } else if (mode === 'edit' && editingId != null) {
        const photos = await buildPhotosPayload(draft.images);
        await authedFetch(`/host/chambres/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nomPersonnalise: draft.nomPersonnalise.trim(),
            typeChambreId: draft.typeChambreId,
            statut: draft.statut,
            prixNuit,
            capacitePersonnes,
            surfaceM2: null,
            photos,
          }),
        });
      }

      if (selectedEtablissementId) {
        await loadRooms(selectedEtablissementId);
      }
      closeModal();
    } catch (e2) {
      setModalError(e2 instanceof Error ? e2.message : 'Enregistrement impossible');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAvailability(roomId: number, next: boolean) {
    if (!selectedEtablissementId) return;
    const nextStatut: BackendStatutChambre = next ? 'DISPONIBLE' : 'INDISPONIBLE';
    try {
      const room = rooms.find((x) => x.id === roomId);
      if (!room) return;
      await authedFetch(`/host/chambres/${roomId}`, {
        method: 'PUT',
        body: JSON.stringify({
          statut: nextStatut,
          prixNuit: room.prixNuit,
          capacitePersonnes: room.capacitePersonnes ?? 0,
          nom: room.nom,
          nomPersonnalise: room.nomPersonnalise ?? room.nom,
          typeChambreId: room.typeChambreId,
          surfaceM2: null,
        }),
      });
      if (selectedEtablissementId) await loadRooms(selectedEtablissementId);
    } catch {
      // ignore (UI)
    }
  }

  async function deleteRoom(roomId: number) {
    try {
      await authedFetch(`/host/chambres/${roomId}`, { method: 'DELETE' });
      if (selectedEtablissementId) await loadRooms(selectedEtablissementId);
    } catch {
      // ignore (UI)
    }
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Gestion des chambres</h1>
          <p className="mt-1 text-sm text-muted">
            Choisissez un type de chambre, puis un nom personnalisé pour les voyageurs.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={loading || etablissements.length === 0 || selectedEtablissementId == null}
          title={
            etablissements.length === 0
              ? 'Créez d’abord un établissement'
              : selectedEtablissementId == null
                ? 'Sélectionnez un établissement'
                : undefined
          }
          className="inline-flex items-center justify-center gap-2 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter une chambre
        </button>
      </div>

      {!loading && roomTypesError ? (
        <p className="mt-3 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {roomTypesError}
        </p>
      ) : null}

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
      ) : rooms.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aucune chambre pour le moment.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {rooms.map((r) => {
            const available = r.statut === 'DISPONIBLE';
            return (
              <div key={r.id} className="rounded-card border border-line bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-28 w-full overflow-hidden rounded-card border border-line bg-surface sm:h-28 sm:w-40">
                    <img
                      src={r.photoUrls?.[0] ?? placeholderRoomImage(r.id)}
                      alt={displayRoomName(r)}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-ink">{displayRoomName(r)}</h2>
                        <p className="mt-1 text-sm text-muted line-clamp-2">
                          Type : {r.typeChambreLibelle ?? '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-brand">
                          {formatFCFA(Number(r.prixNuit ?? 0))}
                        </p>
                        <p className="text-xs text-muted">/ nuit</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand" />
                        {r.capacitePersonnes ?? 0} personne(s)
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
                        <span className="text-muted">Disponibilité</span>
                        <input
                          type="checkbox"
                          checked={available}
                          onChange={(e) => toggleAvailability(r.id, e.target.checked)}
                          className="h-4 w-4 accent-ink"
                          aria-label="Toggle disponibilité"
                        />
                        <span className="text-ink font-semibold">{available ? 'On' : 'Off'}</span>
                      </label>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-ink hover:underline"
                          aria-label="Modifier la chambre"
                          onClick={() => openEdit(r)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="text-red-600 hover:underline"
                          aria-label="Supprimer la chambre"
                          onClick={() => deleteRoom(r.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HostModal
        open={modalOpen}
        title={modalTitle}
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-3">
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
              disabled={!canSubmit || submitting}
              onClick={() => void submit()}
            >
              {mode === 'add' ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {modalError ? (
            <p className="rounded-control bg-brand/10 px-3 py-2 text-sm text-brand">{modalError}</p>
          ) : null}
          {mode === 'add' && roomTypesLoading ? (
            <p className="text-sm text-muted">Chargement des types de chambre…</p>
          ) : roomTypes.length === 0 && mode === 'add' ? (
            <p className="text-sm text-red-600">
              Aucun type de chambre disponible pour le moment.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-ink md:col-span-2">
              Nom personnalisé (affiché aux voyageurs)
              <input
                value={draft.nomPersonnalise}
                onChange={(e) => setDraft((p) => ({ ...p, nomPersonnalise: e.target.value }))}
                placeholder="ex. Chambre vue jardin, Suite parentale…"
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              />
            </label>
            <label className="text-sm font-semibold text-ink md:col-span-2">
              Type de base
              <select
                value={draft.typeChambreId ?? ''}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    typeChambreId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              >
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.libelle}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                Catégorie standard (Simple, Double, Suite…). Le nom ci-dessus est libre.
              </p>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-ink md:col-span-2">
              Prix/nuit (FCFA)
              <input
                type="number"
                min={0}
                value={draft.prixNuit}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setDraft((p) => ({ ...p, prixNuit: Number.isFinite(n) && n >= 0 ? n : p.prixNuit }));
                }}
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-ink">
            Description (UI seulement)
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className="mt-2 min-h-[90px] w-full resize-none rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Capacité (personnes)
            <input
              type="number"
              min={1}
              value={draft.capacitePersonnes}
              onChange={(e) => {
                const n = Number(e.target.value);
                setDraft((p) => ({
                  ...p,
                  capacitePersonnes: Number.isFinite(n) && n >= 1 ? Math.trunc(n) : p.capacitePersonnes,
                }));
              }}
              className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          {mode === 'edit' ? (
            <label className="flex items-center justify-between gap-3 rounded-control bg-surface px-4 py-3 text-sm">
              <span className="text-muted font-semibold text-ink">Disponibilité</span>
              <input
                type="checkbox"
                checked={draft.statut === 'DISPONIBLE'}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    statut: e.target.checked ? 'DISPONIBLE' : 'INDISPONIBLE',
                  }))
                }
                className="h-4 w-4 accent-ink"
              />
            </label>
          ) : (
            <p className="text-xs text-muted">Nouvelle chambre : statut « Disponible » appliqué par le serveur.</p>
          )}

          <div
            className="rounded-card border border-line bg-surface p-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const add = createImagePreviews(e.dataTransfer.files);
              setDraft((p) => ({
                ...p,
                images: [...p.images, ...add].slice(0, MAX_ROOM_PHOTOS),
              }));
            }}
          >
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">Upload d&apos;images</p>
                <p className="text-xs text-muted">
                  Jusqu&apos;à {MAX_ROOM_PHOTOS} photos (JPEG, PNG, WebP), enregistrées sur le serveur avec la chambre.
                </p>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="room-image-input"
              onChange={(e) => {
                const add = createImagePreviews(e.currentTarget.files);
                setDraft((p) => ({
                  ...p,
                  images: [...p.images, ...add].slice(0, MAX_ROOM_PHOTOS),
                }));
                e.currentTarget.value = '';
              }}
            />

            <label
              htmlFor="room-image-input"
              className="mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-card border border-line bg-white px-4 py-6 text-center"
            >
              <span className="text-sm font-semibold text-ink">Ajouter des images</span>
              <span className="text-xs text-muted">JPG/PNG</span>
            </label>

            {draft.images.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {draft.images.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-card border border-line bg-white">
                    <img src={img.src} alt={img.fileName ?? 'Image'} className="h-28 w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 p-2">
                      <p className="line-clamp-1 text-[11px] text-muted">{img.fileName ?? 'Image'}</p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline"
                        onClick={() => {
                          if (img.objectUrl) {
                            try {
                              URL.revokeObjectURL(img.src);
                            } catch {
                              // ignore
                            }
                          }
                          setDraft((p) => ({ ...p, images: p.images.filter((x) => x.id !== img.id) }));
                        }}
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </HostModal>
    </div>
  );
}

