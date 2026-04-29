import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Check, MessageSquareText, Shield, X } from 'lucide-react';
import { AppHeader } from '../../components/AppHeader';
import { BackNavLogo } from '../../components/BackNavLogo';
import { useAuth } from '../../context/AuthContext';
import type { AdminAvisRow, AdminEtablissement, AdminStats } from '../../lib/adminTypes';
import { toUserFacingErrorMessage } from '../../lib/userFacingError';

type AdminTab = 'stats' | 'validation' | 'avis';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout, user, authedFetch } = useAuth();
  const [tab, setTab] = useState<AdminTab>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [pending, setPending] = useState<AdminEtablissement[]>([]);
  const [allEtablissements, setAllEtablissements] = useState<AdminEtablissement[]>([]);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [avis, setAvis] = useState<AdminAvisRow[]>([]);
  const [avisLoading, setAvisLoading] = useState(false);
  const [avisError, setAvisError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    setStatsError(null);
    try {
      const { data } = await authedFetch<AdminStats>('/admin/stats');
      setStats(data);
    } catch (e) {
      setStats(null);
      setStatsError(toUserFacingErrorMessage(e));
    }
  }, [authedFetch]);

  const loadValidationData = useCallback(async () => {
    setValidationLoading(true);
    setValidationError(null);
    try {
      const [enAttente, tous] = await Promise.all([
        authedFetch<AdminEtablissement[]>('/admin/etablissements/en-attente'),
        authedFetch<AdminEtablissement[]>('/admin/etablissements'),
      ]);
      setPending(Array.isArray(enAttente.data) ? enAttente.data : []);
      setAllEtablissements(Array.isArray(tous.data) ? tous.data : []);
    } catch (e) {
      setPending([]);
      setAllEtablissements([]);
      setValidationError(toUserFacingErrorMessage(e));
    } finally {
      setValidationLoading(false);
    }
  }, [authedFetch]);

  const valides = allEtablissements
    .filter((e) => e.valideAdmin === true)
    .slice()
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

  const loadAvis = useCallback(async () => {
    setAvisLoading(true);
    setAvisError(null);
    try {
      const { data } = await authedFetch<AdminAvisRow[]>('/admin/avis');
      setAvis(Array.isArray(data) ? data : []);
    } catch (e) {
      setAvis([]);
      setAvisError(toUserFacingErrorMessage(e));
    } finally {
      setAvisLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === 'validation') {
      void loadValidationData();
      void loadStats();
    }
  }, [tab, loadValidationData, loadStats]);

  useEffect(() => {
    if (tab === 'avis') void loadAvis();
  }, [tab, loadAvis]);

  async function valider(id: number) {
    setActionId(id);
    try {
      await authedFetch<{ message: string }>(`/admin/etablissements/${id}/valider`, { method: 'PUT', body: '{}' });
      await loadValidationData();
      await loadStats();
    } finally {
      setActionId(null);
    }
  }

  async function refuser(id: number) {
    if (!window.confirm('Refuser cet hébergement ? Il sera désactivé et retiré de la recherche.')) return;
    setActionId(id);
    try {
      await authedFetch<{ message: string }>(`/admin/etablissements/${id}/refuser`, { method: 'PUT', body: '{}' });
      await loadValidationData();
      await loadStats();
    } finally {
      setActionId(null);
    }
  }

  const tabBtn = (id: AdminTab, label: string, icon: ReactNode) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        tab === id ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-surface'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
        <BackNavLogo to="/" label="Retour accueil" />
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
              <Shield className="h-7 w-7 text-brand" aria-hidden />
              Administration
            </h1>
            <p className="mt-1 text-sm text-muted">
              Connecté : <span className="font-medium text-ink">{user?.email}</span>
            </p>
          </div>
          <button
            type="button"
            className="self-start rounded-control border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface sm:self-auto"
            onClick={async () => {
              await logout();
              navigate('/', { replace: true });
            }}
          >
            Déconnexion
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {tabBtn('stats', 'Statistiques', <BarChart3 className="h-4 w-4" aria-hidden />)}
          {tabBtn('validation', 'Hébergements', <Building2 className="h-4 w-4" aria-hidden />)}
          {tabBtn('avis', 'Avis', <MessageSquareText className="h-4 w-4" aria-hidden />)}
        </div>

        {tab === 'stats' && (
          <section className="mt-8">
            {statsError && (
              <p className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{statsError}</p>
            )}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ['Utilisateurs', stats.totalUsers],
                    ['Hébergements (total)', stats.totalEtablissements],
                    ['Publiés accueil (validés)', stats.etablissementsPublies ?? 0],
                    ['En attente validation', stats.etablissementsEnAttenteValidation],
                    ['Réservations', stats.totalReservations],
                    ['Avis', stats.totalAvis],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-card border border-line bg-white p-5 shadow-card"
                  >
                    <p className="text-2xl font-bold tabular-nums text-brand">{value}</p>
                    <p className="mt-1 text-sm text-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}
            {!stats && !statsError && <p className="text-sm text-muted">Chargement…</p>}
            <button
              type="button"
              className="mt-6 text-sm font-medium text-brand hover:underline"
              onClick={() => void loadStats()}
            >
              Rafraîchir
            </button>
          </section>
        )}

        {tab === 'validation' && (
          <section className="mt-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                File d&apos;attente et catalogue des hébergements déjà validés par l&apos;administration.
              </p>
              <button
                type="button"
                className="text-sm font-medium text-brand hover:underline"
                onClick={() => {
                  void loadValidationData();
                  void loadStats();
                }}
              >
                Rafraîchir les listes
              </button>
            </div>
            {validationError && (
              <p className="mb-4 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {validationError}
              </p>
            )}
            {validationLoading ? (
              <p className="text-sm text-muted">Chargement des listes…</p>
            ) : (
              <div className="space-y-12">
                <div>
                  <h2 className="text-lg font-bold text-ink">En attente de validation</h2>
                  <p className="mt-1 text-sm text-muted">
                    Actifs mais non encore validés — invisibles sur la recherche publique.
                  </p>
                  <div className="mt-4">
                    {pending.length === 0 ? (
                      <p className="rounded-card border border-line bg-white px-6 py-8 text-center text-sm text-muted">
                        Aucun hébergement en attente de validation.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-card border border-line bg-white shadow-card">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-line bg-surface/80 text-xs font-semibold uppercase tracking-wide text-muted">
                            <tr>
                              <th className="px-4 py-3">Établissement</th>
                              <th className="px-4 py-3">Ville</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">Hôte (id)</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {pending.map((e) => (
                              <tr key={e.id} className="hover:bg-surface/50">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-ink">{e.nom}</div>
                                  <Link
                                    to={`/etablissement/${e.id}`}
                                    className="text-xs text-brand hover:underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Voir la fiche publique
                                  </Link>
                                </td>
                                <td className="px-4 py-3 text-muted">{e.ville || '—'}</td>
                                <td className="px-4 py-3 text-muted">{e.typeEtablissementLibelle || '—'}</td>
                                <td className="px-4 py-3 text-muted">{e.proprietaireId}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <button
                                      type="button"
                                      disabled={actionId === e.id}
                                      onClick={() => void valider(e.id)}
                                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      <Check className="h-3.5 w-3.5" aria-hidden />
                                      Valider
                                    </button>
                                    <button
                                      type="button"
                                      disabled={actionId === e.id}
                                      onClick={() => void refuser(e.id)}
                                      className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <X className="h-3.5 w-3.5" aria-hidden />
                                      Refuser
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-ink">Hébergements validés</h2>
                  <p className="mt-1 text-sm text-muted">
                    Liste complète ({valides.length}) — visibles sur l&apos;accueil si la colonne <strong>Actif</strong>{' '}
                    est oui (dates / voyageurs en sus).
                  </p>
                  <div className="mt-4">
                    {valides.length === 0 ? (
                      <p className="rounded-card border border-line bg-white px-6 py-8 text-center text-sm text-muted">
                        Aucun hébergement marqué validé en base.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-card border border-line bg-white shadow-card">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-line bg-surface/80 text-xs font-semibold uppercase tracking-wide text-muted">
                            <tr>
                              <th className="px-4 py-3">Établissement</th>
                              <th className="px-4 py-3">Ville</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">Hôte (id)</th>
                              <th className="px-4 py-3">Actif</th>
                              <th className="px-4 py-3">Création</th>
                              <th className="px-4 py-3">Fiche</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {valides.map((e) => (
                              <tr key={e.id} className="hover:bg-surface/50">
                                <td className="px-4 py-3 font-medium text-ink">{e.nom}</td>
                                <td className="px-4 py-3 text-muted">{e.ville || '—'}</td>
                                <td className="px-4 py-3 text-muted">{e.typeEtablissementLibelle || '—'}</td>
                                <td className="px-4 py-3 text-muted">{e.proprietaireId}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      e.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                                    }`}
                                  >
                                    {e.actif ? 'Oui' : 'Non'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(e.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <Link
                                    to={`/etablissement/${e.id}`}
                                    className="text-xs font-medium text-brand hover:underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Ouvrir
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'avis' && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Tous les avis clients, du plus récent au plus ancien.</p>
              <button
                type="button"
                className="text-sm font-medium text-brand hover:underline"
                onClick={() => void loadAvis()}
              >
                Rafraîchir
              </button>
            </div>
            {avisError && (
              <p className="mb-4 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{avisError}</p>
            )}
            {avisLoading ? (
              <p className="text-sm text-muted">Chargement…</p>
            ) : avis.length === 0 ? (
              <p className="rounded-card border border-line bg-white px-6 py-10 text-center text-sm text-muted">
                Aucun avis en base.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-card border border-line bg-white shadow-card">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-line bg-surface/80 text-xs font-semibold uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3">Établissement</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Commentaire</th>
                      <th className="px-4 py-3">Réponse hôte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {avis.map((a) => (
                      <tr key={a.id} className="align-top hover:bg-surface/50">
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(a.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{a.note}/5</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[200px] font-medium text-ink">{a.etablissementNom || '—'}</div>
                          <Link
                            to={`/etablissement/${a.etablissementId}`}
                            className="text-xs text-brand hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Fiche #{a.etablissementId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          <div className="max-w-[180px] break-words">
                            {(a.auteurPrenom || '') + ' ' + (a.auteurNom || '')}
                          </div>
                          <div className="break-all text-xs">{a.auteurEmail}</div>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-muted">{a.commentaire || '—'}</td>
                        <td className="max-w-xs px-4 py-3 text-muted">{a.reponseHote || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
