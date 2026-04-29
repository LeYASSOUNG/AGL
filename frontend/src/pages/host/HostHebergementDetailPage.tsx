import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { HostModal } from '../../components/host/HostModal';
import { BackNavLogo } from '../../components/BackNavLogo';
import { useAuth } from '../../context/AuthContext';
import {
  getEtablissementDetail,
  getTypesEtablissementActifs,
  type BackendEtablissementDetail,
  type BackendService,
  type BackendTypeEtablissement,
} from '../../lib/backendApi';
import { formatFCFA } from '../../lib/format';

type EditDraft = {
  nom: string;
  typeEtablissementId: number | null;
  description: string;
  ville: string;
  adresse: string;
  codePostal: string;
  pays: string;
  actif: boolean;
};

export function HostHebergementDetailPage() {
  const { id } = useParams();
  const etabId = Number(id);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { authedFetch } = useAuth();

  const [types, setTypes] = useState<BackendTypeEtablissement[]>([]);
  const [detail, setDetail] = useState<BackendEtablissementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [draft, setDraft] = useState<EditDraft>({
    nom: '',
    typeEtablissementId: null,
    description: '',
    ville: '',
    adresse: '',
    codePostal: '',
    pays: '',
    actif: true,
  });

  const hasValidId = Number.isFinite(etabId) && etabId > 0;

  const chambres = useMemo(() => detail?.chambres ?? [], [detail]);
  const services = useMemo(() => detail?.services ?? [], [detail]);

  async function load() {
    if (!hasValidId) return;
    setLoading(true);
    setError(null);
    try {
      const [d] = await Promise.all([
        getEtablissementDetail(etabId),
        (async () => {
          try {
            setTypes(await getTypesEtablissementActifs());
          } catch {
            // ignore
          }
        })(),
      ]);
      setDetail(d);
      setDraft({
        nom: d.nom ?? '',
        typeEtablissementId: (d as any).typeEtablissementId ?? null,
        description: d.description ?? '',
        ville: d.ville ?? '',
        adresse: d.adresse ?? '',
        codePostal: d.codePostal ?? '',
        pays: d.pays ?? '',
        actif: (d as any).actif ?? true,
      });
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etabId]);

  useEffect(() => {
    const mode = search.get('action');
    if (mode === 'edit') setEditOpen(true);
    if (mode === 'delete') setDeleteOpen(true);
  }, [search]);

  async function save() {
    if (!hasValidId) return;
    if (submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await authedFetch(`/host/etablissements/${etabId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nom: draft.nom,
          description: draft.description || undefined,
          adresse: draft.adresse,
          ville: draft.ville,
          codePostal: draft.codePostal || undefined,
          pays: draft.pays || undefined,
          typeEtablissementId: draft.typeEtablissementId ?? undefined,
          actif: draft.actif,
        }),
      });
      setEditOpen(false);
      await load();
    } catch (e2) {
      setActionError(e2 instanceof Error ? e2.message : 'Modification impossible');
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!hasValidId) return;
    if (submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await authedFetch(`/host/etablissements/${etabId}`, { method: 'DELETE' });
      setDeleteOpen(false);
      navigate('/host/hebergements', { replace: true });
    } catch (e2) {
      setActionError(e2 instanceof Error ? e2.message : 'Suppression impossible');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteService(serviceId: number) {
    setActionError(null);
    try {
      await authedFetch(`/host/services/${serviceId}`, { method: 'DELETE' });
      await load();
    } catch (e2) {
      setActionError(e2 instanceof Error ? e2.message : 'Suppression du service impossible');
    }
  }

  async function deleteChambre(chambreId: number) {
    setActionError(null);
    try {
      await authedFetch(`/host/chambres/${chambreId}`, { method: 'DELETE' });
      await load();
    } catch (e2) {
      setActionError(e2 instanceof Error ? e2.message : 'Suppression de la chambre impossible');
    }
  }

  function serviceLabel(s: BackendService) {
    const price = Number(s.prix ?? 0);
    return `${s.libelle}${s.actif ? '' : ' (inactif)'} — ${formatFCFA(price)}`;
  }

  if (!hasValidId) {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-card">
        <BackNavLogo to="/host/hebergements" label="Retour hébergements" />
        <p className="mt-4 text-sm text-red-600">Identifiant d’hébergement invalide.</p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{detail?.nom ?? 'Hébergement'}</h1>
          <p className="mt-1 text-sm text-muted">Détails, chambres et services.</p>
        </div>
        <BackNavLogo to="/host/hebergements" label="Retour hébergements" />
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Chargement…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : !detail ? (
        <p className="mt-6 text-sm text-muted">Introuvable.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted">
              <p>
                <span className="font-semibold text-ink">Ville</span> : {detail.ville || '—'}
              </p>
              <p>
                <span className="font-semibold text-ink">Adresse</span> : {detail.adresse || '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
                onClick={() => setEditOpen(true)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="rounded-control bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setDeleteOpen(true)}
              >
                Supprimer
              </button>
            </div>
          </div>

          {actionError ? <p className="mt-4 text-sm text-red-600">{actionError}</p> : null}

          {detail.photoUrls && detail.photoUrls.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink">Photos</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {detail.photoUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-control border border-line bg-surface"
                  >
                    <img src={url} alt="" className="h-32 w-full object-cover hover:opacity-90" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-ink">Chambres</h2>
                <Link
                  to={`/host/chambres?etablissementId=${detail.id}`}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Gérer
                </Link>
              </div>
              {chambres.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Aucune chambre.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {chambres.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-control bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{c.nom}</p>
                        <p className="text-xs text-muted">{formatFCFA(Number((c as any).prixNuit ?? 0))}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/host/chambres?etablissementId=${detail.id}&editId=${c.id}`}
                          className="text-sm font-semibold text-ink hover:underline"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          className="text-sm font-semibold text-red-600 hover:underline"
                          onClick={() => void deleteChambre(c.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-ink">Services</h2>
                <Link
                  to={`/host/services?etablissementId=${detail.id}`}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Gérer
                </Link>
              </div>
              {services.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Aucun service.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 rounded-control bg-white px-3 py-2">
                      <p className="min-w-0 truncate text-sm text-ink">{serviceLabel(s)}</p>
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/host/services?etablissementId=${detail.id}&editId=${s.id}`}
                          className="text-sm font-semibold text-ink hover:underline"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          className="text-sm font-semibold text-red-600 hover:underline"
                          onClick={() => void deleteService(s.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <HostModal
        open={editOpen}
        title="Modifier l'hébergement"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
              onClick={() => setEditOpen(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting || !draft.nom.trim()}
              onClick={() => void save()}
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-ink">
              Nom
              <input
                value={draft.nom}
                onChange={(e) => setDraft((p) => ({ ...p, nom: e.target.value }))}
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              />
            </label>
            <label className="text-sm font-semibold text-ink" htmlFor="host-detail-edit-type-etablissement">
              Type
              <select
                id="host-detail-edit-type-etablissement"
                value={draft.typeEtablissementId ?? ''}
                onChange={(e) => setDraft((p) => ({ ...p, typeEtablissementId: Number(e.target.value) }))}
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

          <label className="block text-sm font-semibold text-ink">
            Description
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className="mt-2 min-h-[90px] w-full resize-none rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-ink">
              Ville
              <input
                value={draft.ville}
                onChange={(e) => setDraft((p) => ({ ...p, ville: e.target.value }))}
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Pays
              <input
                value={draft.pays}
                onChange={(e) => setDraft((p) => ({ ...p, pays: e.target.value }))}
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-ink">
            Adresse
            <input
              value={draft.adresse}
              onChange={(e) => setDraft((p) => ({ ...p, adresse: e.target.value }))}
              className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-ink">
              Code postal
              <input
                value={draft.codePostal}
                onChange={(e) => setDraft((p) => ({ ...p, codePostal: e.target.value }))}
                className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-control bg-surface px-4 py-3 text-sm">
              <span className="text-muted font-semibold text-ink">Actif</span>
              <input
                type="checkbox"
                checked={draft.actif}
                onChange={(e) => setDraft((p) => ({ ...p, actif: e.target.checked }))}
                className="h-4 w-4 accent-ink"
              />
            </label>
          </div>
        </div>
      </HostModal>

      <HostModal
        open={deleteOpen}
        title="Supprimer l'hébergement"
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
              onClick={() => setDeleteOpen(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-control bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
              onClick={() => void remove()}
            >
              {submitting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          Confirmer la suppression de <span className="font-semibold text-ink">{detail?.nom ?? 'cet hébergement'}</span> ?
        </p>
        <p className="mt-2 text-xs text-muted">
          Si des réservations existent, le backend peut refuser la suppression (dans ce cas, on passera en désactivation).
        </p>
      </HostModal>
    </div>
  );
}

