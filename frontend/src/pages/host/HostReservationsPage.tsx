import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateFR, formatFCFA } from '../../lib/format';

type BackendStatutReservation = 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

type BackendReservationResponse = {
  id: number;
  dateDebut: string;
  dateFin: string;
  nombreVoyageurs: number;
  statut: BackendStatutReservation;
  montantTotal: number;
  clientId: number;
  etablissementId: number;
  commentaire?: string | null;
  createdAt?: string;
};

type BackendChambreResponse = {
  id: number;
  nom: string;
};

type BackendReservationDetail = {
  id: number;
  chambres: BackendChambreResponse[];
  serviceIds?: number[];
  serviceLines?: Array<{ serviceId: number; quantity?: number }>;
};

type ReservationRow = {
  id: number;
  statut: BackendStatutReservation;
  chambreNames: string[];
  dateDebut: string;
  dateFin: string;
  nombreVoyageurs: number;
  /** Somme des quantités (services payants réservés). */
  servicesExtraUnits: number;
  montantTotal: number;
};

type FilterTab = 'TOUTES' | 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

function statutLabel(s: BackendStatutReservation) {
  switch (s) {
    case 'EN_ATTENTE':
      return 'En attente';
    case 'CONFIRMEE':
      return 'Confirmée';
    case 'EN_COURS':
      return 'En cours';
    case 'TERMINEE':
      return 'Terminée';
    case 'ANNULEE':
      return 'Annulée';
    default:
      return s;
  }
}

function statutBadgeClass(s: BackendStatutReservation) {
  switch (s) {
    case 'EN_ATTENTE':
      return 'bg-brand/10 text-brand border border-brand/30';
    case 'CONFIRMEE':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'EN_COURS':
      return 'bg-sky-50 text-sky-800 border border-sky-200';
    case 'TERMINEE':
      return 'bg-slate-50 text-slate-700 border border-slate-200';
    case 'ANNULEE':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-surface text-ink border border-line';
  }
}

export function HostReservationsPage() {
  const { authedFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReservationRow[]>([]);

  const [activeTab, setActiveTab] = useState<FilterTab>('TOUTES');

  const stats = useMemo(() => {
    const initial: Record<BackendStatutReservation, number> = {
      EN_ATTENTE: 0,
      CONFIRMEE: 0,
      EN_COURS: 0,
      TERMINEE: 0,
      ANNULEE: 0,
    };
    return rows.reduce((acc, r) => {
      acc[r.statut] += 1;
      return acc;
    }, { ...initial });
  }, [rows]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const reservationList = await authedFetch<BackendReservationResponse[]>('/host/reservations').then(
          (r) => r.data
        );

        const enriched = await Promise.all(
          reservationList.map(async (res) => {
            const detail = await authedFetch<BackendReservationDetail>(`/reservations/${res.id}`).then(
              (r) => r.data
            );
            const lines = detail.serviceLines;
            const servicesExtraUnits =
              Array.isArray(lines) && lines.length > 0
                ? lines.reduce(
                    (acc, l) =>
                      acc + Math.max(1, Math.min(99, Math.floor(Number(l.quantity ?? 1)) || 1)),
                    0
                  )
                : (detail.serviceIds ?? []).length;
            return {
              id: res.id,
              statut: res.statut,
              chambreNames: detail.chambres.map((c) => c.nom),
              dateDebut: res.dateDebut,
              dateFin: res.dateFin,
              nombreVoyageurs: res.nombreVoyageurs,
              servicesExtraUnits,
              montantTotal: res.montantTotal,
            } satisfies ReservationRow;
          })
        );

        if (!alive) return;
        setRows(enriched);
      } catch (e2) {
        if (!alive) return;
        setError(e2 instanceof Error ? e2.message : 'Chargement impossible');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'TOUTES') return rows;
    return rows.filter((r) => r.statut === activeTab);
  }, [activeTab, rows]);

  async function updateReservationStatus(id: number, action: 'confirm' | 'cancel') {
    const endpoint = `/reservations/${id}/${action === 'confirm' ? 'confirm' : 'cancel'}`;
    const updated = await authedFetch<BackendReservationResponse>(endpoint, { method: 'PUT' }).then((r) => r.data);

    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              statut: updated.statut,
              montantTotal: updated.montantTotal,
            }
          : r
      )
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Gestion des réservations</h1>
          <p className="mt-1 text-sm text-muted">Suivez et gérez les réservations de vos établissements.</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Chargement…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">En attente</p>
                <Clock3 className="h-5 w-5 text-brand" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-brand">{stats.EN_ATTENTE}</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Confirmées</p>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-emerald-700">{stats.CONFIRMEE}</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">En cours</p>
                <CheckCircle2 className="h-5 w-5 text-sky-600" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-sky-800">{stats.EN_COURS}</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Terminées</p>
                <CheckCircle2 className="h-5 w-5 text-slate-500" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-700">{stats.TERMINEE}</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Annulées</p>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-red-700">{stats.ANNULEE}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex gap-2 overflow-x-auto">
              {(['TOUTES', 'EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] as FilterTab[]).map((tab) => {
                const active = tab === activeTab;
                const label =
                  tab === 'TOUTES'
                    ? 'Toutes'
                    : tab === 'EN_ATTENTE'
                      ? 'En attente'
                      : tab === 'CONFIRMEE'
                        ? 'Confirmées'
                        : tab === 'EN_COURS'
                          ? 'En cours'
                          : tab === 'TERMINEE'
                            ? 'Terminées'
                            : 'Annulées';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={[
                      'rounded-control border px-4 py-2 text-sm font-semibold',
                      active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-surface',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 text-sm text-muted">Aucune réservation pour ce filtre.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {filtered.map((r, idx) => {
                const servicesCount = r.servicesExtraUnits;
                return (
                  <div key={r.id} className="rounded-card border border-line bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-muted">#{idx + 1}</span>
                          <span className={`rounded-control px-3 py-1 text-xs font-bold ${statutBadgeClass(r.statut)}`}>
                            {statutLabel(r.statut)}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-muted">
                          <p>
                            <span className="font-semibold text-ink">Chambre(s) :</span>{' '}
                            {r.chambreNames.length > 0 ? r.chambreNames.join(', ') : '—'}
                          </p>
                          <p>
                            <span className="font-semibold text-ink">Dates :</span> {formatDateFR(r.dateDebut)} →{' '}
                            {formatDateFR(r.dateFin)}
                          </p>
                          <p>
                            <span className="font-semibold text-ink">Voyageurs :</span> {r.nombreVoyageurs}
                          </p>
                          <p>
                            <span className="font-semibold text-ink">Services :</span>{' '}
                            {servicesCount > 0 ? `${servicesCount} ajout(s)` : 'Aucun'}
                          </p>
                        </div>
                      </div>

                      <div className="sm:min-w-[210px]">
                        <p className="text-lg font-extrabold text-brand">{formatFCFA(r.montantTotal)}</p>
                        <p className="text-xs text-muted">Montant total (FCFA)</p>

                        {r.statut === 'EN_ATTENTE' ? (
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => void updateReservationStatus(r.id, 'confirm')}
                              className="flex-1 rounded-control bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => void updateReservationStatus(r.id, 'cancel')}
                              className="flex-1 rounded-control bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : r.statut === 'CONFIRMEE' || r.statut === 'EN_COURS' ? (
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => void updateReservationStatus(r.id, 'cancel')}
                              className="w-full rounded-control bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

