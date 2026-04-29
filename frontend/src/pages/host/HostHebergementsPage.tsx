import { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Upload } from 'lucide-react';
import { HostModal } from '../../components/host/HostModal';
import { HostStepper } from '../../components/host/HostStepper';
import { formatFCFA } from '../../lib/format';
import { HelpFab } from '../../components/HelpFab';
import { BackNavLogo } from '../../components/BackNavLogo';
import { useAuth } from '../../context/AuthContext';
import {
  getTypesEtablissementActifs,
  type BackendEtablissement,
  type BackendTypeEtablissement,
} from '../../lib/backendApi';
import { useNavigate } from 'react-router-dom';

const MAX_PHOTOS = 12;

type PhotoPreview = {
  id: string;
  src: string;
  fileName: string;
  file: File;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });
}

type HebergementFormState = {
  nom: string;
  typeEtablissementId: number | null;
  description: string;
  ville: string;
  adresse: string;
  codePostal: string;
  pays: string;
  photos: PhotoPreview[];
  prixDepart: number;
};

const initialForm: HebergementFormState = {
  nom: '',
  typeEtablissementId: null,
  description: '',
  ville: '',
  adresse: '',
  codePostal: '',
  pays: 'Côte d’Ivoire',
  photos: [],
  prixDepart: 0,
};

function createPhotoPreviews(files: FileList | null): PhotoPreview[] {
  if (!files || files.length === 0) return [];
  const list = Array.from(files);
  return list.map((f, i) => ({
    id: `${Date.now()}-${i}`,
    src: URL.createObjectURL(f),
    fileName: f.name,
    file: f,
  }));
}

export function HostHebergementsPage() {
  const { authedFetch, syncSessionFromServer } = useAuth();
  const navigate = useNavigate();
  const [types, setTypes] = useState<BackendTypeEtablissement[]>([]);
  const [myHebergements, setMyHebergements] = useState<BackendEtablissement[]>([]);
  const [loadingHebergements, setLoadingHebergements] = useState(true);
  const [loadHebergementsError, setLoadHebergementsError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<HebergementFormState>(() => ({ ...initialForm }));
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<BackendEtablissement | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPhotoMode, setEditPhotoMode] = useState<'keep' | 'replace' | 'delete'>('keep');
  const [editPhotos, setEditPhotos] = useState<PhotoPreview[]>([]);

  const maxDescription = 500;
  const descriptionCount = form.description.length;

  const canNext = useMemo(() => {
    if (step === 1) return form.nom.trim().length > 0 && form.description.trim().length > 0 && !!form.typeEtablissementId;
    if (step === 2) return form.ville.trim().length > 0 && form.adresse.trim().length > 0;
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  }, [form, step]);

  async function loadMyHebergements() {
    setLoadingHebergements(true);
    setLoadHebergementsError(null);
    try {
      const { data } = await authedFetch<BackendEtablissement[]>('/host/etablissements/mes');
      setMyHebergements(data);
    } catch (e2) {
      setLoadHebergementsError(e2 instanceof Error ? e2.message : 'Chargement impossible');
    } finally {
      setLoadingHebergements(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const list = await getTypesEtablissementActifs();
        setTypes(list);
        setForm((prev) => ({
          ...prev,
          typeEtablissementId: prev.typeEtablissementId ?? list[0]?.id ?? null,
        }));
      } catch {
        // ignore
      }
    })();

    void loadMyHebergements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function revokePreviews(photos: PhotoPreview[]) {
    photos.forEach((p) => {
      try {
        URL.revokeObjectURL(p.src);
      } catch {
        // ignore
      }
    });
  }

  function reset() {
    setStep(1);
    setForm({ ...initialForm });
  }

  function onAddPhotos(files: FileList | null) {
    const previews = createPhotoPreviews(files);
    setForm((prev) => {
      const room = MAX_PHOTOS - prev.photos.length;
      const capped = room <= 0 ? [] : previews.slice(0, room);
      return { ...prev, photos: [...prev.photos, ...capped] };
    });
  }

  function onEditReplacePhotos(files: FileList | null) {
    revokePreviews(editPhotos);
    const previews = createPhotoPreviews(files);
    setEditPhotos(previews.slice(0, MAX_PHOTOS));
    setEditPhotoMode(previews.length > 0 ? 'replace' : 'keep');
  }

  function resetEditPhotos() {
    revokePreviews(editPhotos);
    setEditPhotos([]);
    setEditPhotoMode('keep');
  }

  function goPrev() {
    setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)));
  }

  function goNext() {
    setStep((s) => (s === 4 ? 4 : ((s + 1) as 2 | 3 | 4)));
  }

  return (
    <div className="bg-surface px-0 py-0">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Ajouter un hébergement</h1>
            <p className="mt-1 text-sm text-muted">
              Créez votre établissement en 4 étapes. Les photos sont optionnelles (jusqu&apos;à {MAX_PHOTOS} fichiers,
              JPEG/PNG/WebP).
            </p>
          </div>
          <BackNavLogo to="/host" label="Retour Dashboard" />
        </div>

        <div className="mt-6">
          <HostStepper steps={4} current={step} />
        </div>

        <section className="mt-6 rounded-card border border-line bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Mes hébergements</h2>
            <button
              type="button"
              className="rounded-control border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
              onClick={() => {
                void loadMyHebergements();
              }}
            >
              Rafraîchir
            </button>
          </div>

          {loadingHebergements ? (
            <p className="mt-4 text-sm text-muted">Chargement...</p>
          ) : loadHebergementsError ? (
            <p className="mt-4 text-sm text-red-600">{loadHebergementsError}</p>
          ) : myHebergements.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucun hébergement pour le moment.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {myHebergements.map((h) => (
                <article
                  key={h.id}
                  className="cursor-pointer overflow-hidden rounded-card border border-line bg-surface hover:bg-white"
                  onClick={() => navigate(`/host/hebergements/${h.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/host/hebergements/${h.id}`);
                  }}
                >
                  {h.photoUrls && h.photoUrls[0] ? (
                    <img
                      src={h.photoUrls[0]}
                      alt=""
                      className="h-36 w-full object-cover"
                    />
                  ) : null}
                  <div className="flex items-start justify-between gap-3 p-4">
                    <p className="font-bold text-ink">{h.nom}</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-ink hover:underline"
                        aria-label="Modifier l'hébergement"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(h);
                          setEditError(null);
                          setEditOpen(true);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        aria-label="Supprimer l'hébergement"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(h);
                          setDeleteOpen(true);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 px-4 text-xs text-muted">
                    {h.typeEtablissementLibelle ?? h.typeEtablissement ?? 'Type'} • {h.ville || 'Ville non renseignée'}
                  </p>
                  <p className="mt-2 line-clamp-2 px-4 text-sm text-muted">{h.description || 'Sans description.'}</p>
                  <p className="mt-2 px-4 pb-4 text-xs text-muted">{h.adresse || 'Adresse non renseignée'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <form
          className="mt-6 rounded-card border border-line bg-white p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (step !== 4) return;
            setModalOpen(true);
          }}
        >
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-ink">
                  Nom de l&apos;établissement
                </label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                  placeholder="Hôtel Le Palmier"
                  className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                />
              </div>

              <div>
                <label
                  htmlFor="host-create-type-etablissement"
                  className="text-sm font-semibold text-ink"
                >
                  Type d&apos;établissement
                </label>
                <select
                  id="host-create-type-etablissement"
                  value={form.typeEtablissementId ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      typeEtablissementId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                >
                  <option value="" disabled>
                    {types.length === 0 ? 'Chargement des types…' : 'Sélectionner…'}
                  </option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-ink">Description</label>
                  <span className="text-xs text-muted">
                    {descriptionCount}/{maxDescription}
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      description: e.target.value.slice(0, maxDescription),
                    }))
                  }
                  placeholder="Décrivez votre établissement (services, ambiance, points forts...)"
                  className="mt-2 min-h-[120px] w-full resize-none rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                />
                <p className="mt-2 text-xs text-muted">
                  Astuce : 2-3 phrases suffisent. Cela sera affiché sur la page de l&apos;établissement.
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Ville
                  <input
                    value={form.ville}
                    onChange={(e) => setForm((p) => ({ ...p, ville: e.target.value }))}
                    placeholder="Abidjan"
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  />
                </label>
                <label className="text-sm font-semibold text-ink">
                  Pays
                  <input
                    value={form.pays}
                    onChange={(e) => setForm((p) => ({ ...p, pays: e.target.value }))}
                    placeholder="Côte d’Ivoire"
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  />
                </label>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Adresse</label>
                <input
                  value={form.adresse}
                  onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))}
                  placeholder="Quartier / Rue / Repère"
                  className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Code postal</label>
                <input
                  value={form.codePostal}
                  onChange={(e) => setForm((p) => ({ ...p, codePostal: e.target.value }))}
                  placeholder="00000"
                  className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                />
              </div>

              <div className="rounded-card border border-line bg-surface p-4 text-sm text-muted">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-brand" />
                  <p>Adresse et localisation de votre établissement.</p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6 text-brand" />
                <div>
                  <h2 className="text-lg font-bold text-ink">Photos</h2>
                  <p className="mt-1 text-sm text-muted">
                    Glissez-déposez vos images (ou utilisez le bouton de sélection). Jusqu&apos;à {MAX_PHOTOS}{' '}
                    fichiers, enregistrés sur le serveur à la validation.
                  </p>
                </div>
              </div>

              <div
                className="rounded-card border border-line bg-surface p-6"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onAddPhotos(e.dataTransfer.files);
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="host-photo-input"
                  onChange={(e) => onAddPhotos(e.currentTarget.files)}
                />
                <label
                  htmlFor="host-photo-input"
                  className="flex cursor-pointer flex-col items-center gap-2 text-center"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-card">
                    +
                  </span>
                  <span className="text-sm font-semibold text-ink">Déposez des photos ici</span>
                  <span className="text-xs text-muted">PNG/JPG, plusieurs fichiers autorisés</span>
                </label>
              </div>

              {form.photos.length === 0 ? (
                <p className="text-sm text-muted">Aucune photo ajoutée.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {form.photos.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-card border border-line bg-white">
                      <img src={p.src} alt={p.fileName} className="h-36 w-full object-cover" />
                      <div className="p-3">
                        <p className="line-clamp-1 text-xs text-muted">{p.fileName}</p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                          onClick={() => {
                            setForm((prev) => {
                              revokePreviews([p]);
                              return { ...prev, photos: prev.photos.filter((x) => x.id !== p.id) };
                            });
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Prix de départ (FCFA)
                  <input
                    type="number"
                    min={0}
                    value={Number.isFinite(form.prixDepart) ? form.prixDepart : 0}
                    onChange={(e) => setForm((p) => ({ ...p, prixDepart: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  />
                </label>
                <div className="rounded-card border border-line bg-surface p-4">
                  <p className="text-xs text-muted">Aperçu</p>
                  <p className="mt-2 text-2xl font-bold text-brand">{formatFCFA(form.prixDepart)}</p>
                  <p className="mt-1 text-xs text-muted">par nuit (UI)</p>
                </div>
              </div>

              <div className="rounded-card border border-line bg-surface p-4 text-sm text-muted">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-brand" />
                  <p>
                    Cette étape prépare la création. Dans une version connectée à l&apos;API, les tarifs seront rattachés aux chambres et au catalogue.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={goPrev}
              className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>

            {step === 4 ? (
              <button
                type="submit"
                disabled={!canNext}
                className="rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                Ajouter
              </button>
            ) : (
              <button
                type="button"
                disabled={!canNext}
                onClick={goNext}
                className="rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                Suivant
              </button>
            )}
          </div>
        </form>

        <HostModal
          open={modalOpen}
          title="Confirmer l'ajout"
          onClose={() => {
            setModalOpen(false);
          }}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-white"
                onClick={() => {
                  (async () => {
                    if (submitting) return;
                    setSubmitting(true);
                    setError(null);
                    try {
                      // Active le rôle hôte si nécessaire avant création d'établissement.
                      try {
                        await authedFetch('/users/me/become-host', { method: 'POST' });
                      } catch {
                        // Si le rôle est déjà présent ou endpoint indisponible, on tente quand même la création.
                      }

                      const photoPayload =
                        form.photos.length > 0
                          ? await Promise.all(form.photos.map((p) => fileToDataUrl(p.file)))
                          : undefined;

                      await authedFetch<BackendEtablissement>('/host/etablissements', {
                        method: 'POST',
                        body: JSON.stringify({
                          typeEtablissementId: form.typeEtablissementId,
                          nom: form.nom,
                          description: form.description || undefined,
                          adresse: form.adresse,
                          ville: form.ville,
                          codePostal: form.codePostal || undefined,
                          pays: form.pays || undefined,
                          latitude: undefined,
                          longitude: undefined,
                          ...(photoPayload && photoPayload.length > 0 ? { photos: photoPayload } : {}),
                        }),
                      });

                      try {
                        await syncSessionFromServer();
                      } catch {
                        // JWT peut déjà être valide ; les routes chambres acceptent tout utilisateur authentifié propriétaire
                      }

                      setModalOpen(false);
                      revokePreviews(form.photos);
                      reset();
                      await loadMyHebergements();
                    } catch (e2) {
                      const message = e2 instanceof Error ? e2.message : 'Ajout impossible';
                      if (
                        message.toLowerCase().includes('unauthorized') ||
                        message.toLowerCase().includes('full authentication')
                      ) {
                        setError(
                          'Session expirée ou invalide. Reconnectez-vous puis réessayez, vos données du formulaire sont conservées.'
                        );
                      } else {
                        setError(message);
                      }
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                {submitting ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-sm text-muted">
            <p>
              Vous allez créer <span className="font-semibold text-ink">{form.nom || '—'}</span>.
            </p>
            <p>
              Prix de départ : <span className="font-semibold text-brand">{formatFCFA(form.prixDepart)}</span>
            </p>
            <p>
              Photos : <span className="font-semibold text-ink">{form.photos.length}</span>
              {form.photos.length > 0 ? (
                <span className="block text-xs text-muted">
                  Elles seront envoyées au serveur et stockées avec l&apos;établissement.
                </span>
              ) : null}
            </p>
            {error ? (
              <p className="rounded-control bg-brand/10 px-3 py-2 text-sm text-brand">{error}</p>
            ) : null}
          </div>
        </HostModal>

        <HostModal
          open={editOpen}
          title="Modifier l'hébergement"
          onClose={() => {
            setEditOpen(false);
            setSelected(null);
            resetEditPhotos();
          }}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
                onClick={() => {
                  setEditOpen(false);
                  setSelected(null);
                  resetEditPhotos();
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!selected || editSubmitting}
                onClick={() => {
                  (async () => {
                    if (!selected) return;
                    if (editSubmitting) return;
                    setEditSubmitting(true);
                    setEditError(null);
                    try {
                      const photoPayload =
                        editPhotoMode === 'replace'
                          ? await Promise.all(editPhotos.map((p) => fileToDataUrl(p.file)))
                          : undefined;

                      await authedFetch(`/host/etablissements/${selected.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          nom: selected.nom,
                          description: selected.description || undefined,
                          adresse: selected.adresse,
                          ville: selected.ville,
                          codePostal: selected.codePostal || undefined,
                          pays: selected.pays || undefined,
                          typeEtablissementId: selected.typeEtablissementId ?? undefined,
                          actif: selected.actif,
                          ...(editPhotoMode === 'delete'
                            ? { photos: [] }
                            : photoPayload && photoPayload.length > 0
                              ? { photos: photoPayload }
                              : {}),
                        }),
                      });
                      await loadMyHebergements();
                      setEditOpen(false);
                      setSelected(null);
                      resetEditPhotos();
                    } catch (e2) {
                      setEditError(e2 instanceof Error ? e2.message : 'Modification impossible');
                    } finally {
                      setEditSubmitting(false);
                    }
                  })();
                }}
              >
                {editSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          }
        >
          {!selected ? (
            <p className="text-sm text-muted">—</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Nom
                  <input
                    value={selected.nom ?? ''}
                    onChange={(e) => setSelected((p) => (p ? { ...p, nom: e.target.value } : p))}
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  />
                </label>
                <label className="text-sm font-semibold text-ink" htmlFor="host-edit-list-type-etablissement">
                  Type
                  <select
                    id="host-edit-list-type-etablissement"
                    value={selected.typeEtablissementId ?? ''}
                    onChange={(e) =>
                      setSelected((p) => (p ? { ...p, typeEtablissementId: Number(e.target.value) } : p))
                    }
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.libelle}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-control border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Photos</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {editPhotoMode === 'keep'
                        ? 'Aucun changement (photos actuelles conservées).'
                        : editPhotoMode === 'delete'
                          ? 'Toutes les photos seront supprimées.'
                          : `Remplacement : ${editPhotos.length} photo(s)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-control border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-surface">
                      <Upload className="h-4 w-4" />
                      Remplacer
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onEditReplacePhotos(e.target.files)}
                      />
                    </label>
                    <button
                      type="button"
                      className="rounded-control border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-surface"
                      onClick={() => {
                        resetEditPhotos();
                        setEditPhotoMode('delete');
                      }}
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      className="rounded-control border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-surface"
                      onClick={() => resetEditPhotos()}
                    >
                      Garder
                    </button>
                  </div>
                </div>

                {editPhotoMode === 'keep' && (selected.photoUrls?.length ?? 0) > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {(selected.photoUrls ?? []).slice(0, 8).map((u) => (
                      <img key={u} src={u} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    ))}
                  </div>
                ) : null}

                {editPhotoMode === 'replace' && editPhotos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {editPhotos.map((p) => (
                      <img key={p.id} src={p.src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    ))}
                  </div>
                ) : null}

                {editPhotoMode !== 'replace' && (selected.photoUrls?.length ?? 0) === 0 ? (
                  <p className="mt-3 text-xs text-muted">Aucune photo pour cet hébergement.</p>
                ) : null}
              </div>

              <label className="block text-sm font-semibold text-ink">
                Description
                <textarea
                  value={selected.description ?? ''}
                  onChange={(e) => setSelected((p) => (p ? { ...p, description: e.target.value } : p))}
                  className="mt-2 min-h-[90px] w-full resize-none rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Ville
                  <input
                    value={selected.ville ?? ''}
                    onChange={(e) => setSelected((p) => (p ? { ...p, ville: e.target.value } : p))}
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  />
                </label>
                <label className="text-sm font-semibold text-ink">
                  Pays
                  <input
                    value={selected.pays ?? ''}
                    onChange={(e) => setSelected((p) => (p ? { ...p, pays: e.target.value } : p))}
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-ink">
                Adresse
                <input
                  value={selected.adresse ?? ''}
                  onChange={(e) => setSelected((p) => (p ? { ...p, adresse: e.target.value } : p))}
                  className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Code postal
                  <input
                    value={selected.codePostal ?? ''}
                    onChange={(e) => setSelected((p) => (p ? { ...p, codePostal: e.target.value } : p))}
                    className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-control bg-surface px-4 py-3 text-sm">
                  <span className="text-muted font-semibold text-ink">Actif</span>
                  <input
                    type="checkbox"
                    checked={!!selected.actif}
                    onChange={(e) => setSelected((p) => (p ? { ...p, actif: e.target.checked } : p))}
                    className="h-4 w-4 accent-ink"
                  />
                </label>
              </div>

              {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
            </div>
          )}
        </HostModal>

        <HostModal
          open={deleteOpen}
          title="Supprimer l'hébergement"
          onClose={() => {
            setDeleteOpen(false);
            setSelected(null);
          }}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
                onClick={() => {
                  setDeleteOpen(false);
                  setSelected(null);
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-control bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!selected || deleteSubmitting}
                onClick={() => {
                  (async () => {
                    if (!selected) return;
                    if (deleteSubmitting) return;
                    setDeleteSubmitting(true);
                    try {
                      await authedFetch(`/host/etablissements/${selected.id}`, { method: 'DELETE' });
                      await loadMyHebergements();
                      setDeleteOpen(false);
                      setSelected(null);
                    } finally {
                      setDeleteSubmitting(false);
                    }
                  })();
                }}
              >
                {deleteSubmitting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          }
        >
          <p className="text-sm text-muted">
            Confirmer la suppression de{' '}
            <span className="font-semibold text-ink">{selected?.nom ?? 'cet hébergement'}</span> ?
          </p>
        </HostModal>
      </div>
      <HelpFab />
    </div>
  );
}
