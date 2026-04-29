import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bed, Calendar, DollarSign, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvisByEtablissement, type BackendAvis } from '../../lib/backendApi';

type HostEtablissement = {
  id: number;
  nom: string;
};

type RevenuePoint = { m: string; v: number };
type OccupancyPoint = { m: string; p: number };

type ActivityItem = {
  title: string;
  desc: string;
  time: string;
  bg: string;
};

type BackendReservationResponse = {
  id: number;
  dateDebut: string;
  dateFin: string;
  nombreVoyageurs: number;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  montantTotal: number;
  clientId: number;
  etablissementId: number;
  createdAt?: string;
};

function monthLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return months[d.getMonth()] ?? '';
}

function formatRelativeTime(instant: string | undefined) {
  if (!instant) return '—';
  const t = new Date(instant).getTime();
  if (!Number.isFinite(t)) return '—';
  const diffMs = Date.now() - t;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'À l’instant';
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
}

export function HostDashboardPage() {
  const { user, authedFetch } = useAuth();
  const name = user ? `${user.prenom} ${user.nom}`.trim() : 'Hôte';

  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyPoint[]>([]);
  const [avgNote, setAvgNote] = useState<number | null>(null);
  const [avisTotal, setAvisTotal] = useState<number>(0);

  const [reservationsCount, setReservationsCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [revenusTotal, setRevenusTotal] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const [resList, hostList] = await Promise.all([
          authedFetch<BackendReservationResponse[]>('/host/reservations').then((r) => r.data),
          authedFetch<HostEtablissement[]>('/host/etablissements/mes').then((r) => r.data),
        ]);

        if (!alive) return;

        setReservationsCount(resList.length);
        const confirmed = resList.filter((r) => r.statut === 'CONFIRMEE');
        setConfirmedCount(confirmed.length);
        setRevenusTotal(confirmed.reduce((s, r) => s + Number(r.montantTotal ?? 0), 0));

        // Par mois : revenus (confirmées) + taux "confirmées/total" (proxy)
        const byMonth = new Map<string, { total: number; confirmed: number; revenue: number }>();
        for (const r of resList) {
          const m = monthLabel(r.dateDebut);
          if (!m) continue;
          const cur = byMonth.get(m) ?? { total: 0, confirmed: 0, revenue: 0 };
          cur.total += 1;
          if (r.statut === 'CONFIRMEE') {
            cur.confirmed += 1;
            cur.revenue += Number(r.montantTotal ?? 0);
          }
          byMonth.set(m, cur);
        }

        const revenuePoints: RevenuePoint[] = [];
        const occupancyPoints: OccupancyPoint[] = [];
        Array.from(byMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([m, val]) => {
            revenuePoints.push({ m, v: val.revenue });
            const p = val.total === 0 ? 0 : Math.round((val.confirmed / val.total) * 100);
            occupancyPoints.push({ m, p });
          });

        setRevenueData(revenuePoints);
        setOccupancyData(occupancyPoints);

        // Note moyenne (avis)
        const allAvisLists = await Promise.all(
          hostList.map(async (e) => {
            try {
              return await getAvisByEtablissement(e.id);
            } catch {
              return [];
            }
          })
        );
        const allAvis = allAvisLists.flat() as BackendAvis[];
        setAvisTotal(allAvis.length);
        const avg = allAvis.length === 0 ? null : allAvis.reduce((s, a) => s + a.note, 0) / allAvis.length;
        setAvgNote(avg);

        // Activité récente (simple : derniers items dispo)
        const items: ActivityItem[] = [];
        const lastAvis = allAvis
          .slice()
          .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
          .slice(0, 1)[0];
        if (lastAvis) {
          items.push({
            title: 'Nouvel avis',
            desc: `Client #${lastAvis.auteurId} a laissé un avis ${lastAvis.note} étoiles`,
            time: formatRelativeTime(lastAvis.createdAt),
            bg: 'bg-blue-100',
          });
        }
        const lastReservation = resList
          .slice()
          .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
          .slice(0, 1)[0];
        if (lastReservation) {
          items.push({
            title: 'Nouvelle réservation',
            desc: `Réservation #${lastReservation.id} (${lastReservation.statut.replaceAll('_', ' ').toLowerCase()})`,
            time: formatRelativeTime(lastReservation.createdAt),
            bg: 'bg-emerald-100',
          });
        }
        setActivity(items);
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

  const kpiCards = useMemo(() => {
    const tauxConfirmation = reservationsCount === 0 ? 0 : Math.round((confirmedCount / reservationsCount) * 100);
    const avg = avgNote ?? 0;
    const noteValue = avisTotal === 0 ? '—' : avg.toFixed(1);
    const noteSub = avisTotal === 0 ? 'Aucun avis' : `${avisTotal} avis`;

    return [
      {
        label: 'Réservations',
        value: String(reservationsCount),
        sub: reservationsCount === 0 ? '—' : `Confirmées : ${confirmedCount}`,
        icon: Calendar,
        tone: 'text-brand',
        star: false,
      },
      {
        label: 'Taux de confirmation (%)',
        value: reservationsCount === 0 ? '—' : `${tauxConfirmation}%`,
        sub: reservationsCount === 0 ? '—' : 'Basé sur tes réservations',
        icon: Bed,
        tone: 'text-brand',
        star: false,
      },
      {
        label: 'Revenus (FCFA)',
        value: revenusTotal === 0 ? '0' : Math.round(revenusTotal / 1000) + 'K',
        sub: 'Confirmées uniquement',
        icon: DollarSign,
        tone: 'text-brand',
        star: false,
      },
      {
        label: 'Note moyenne',
        value: noteValue,
        sub: noteSub,
        tone: 'text-amber-500',
        star: true,
      },
    ];
  }, [avisTotal, avgNote, confirmedCount, reservationsCount, revenusTotal]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard Hôte</h1>
          <p className="mt-1 text-sm text-muted">Bienvenue, {name}</p>
        </div>
        <Link
          to="/host/hebergements"
          className="inline-flex items-center justify-center gap-2 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Ajouter un hébergement
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((c) => {
          const Icon = 'icon' in c ? c.icon : undefined;
          return (
            <div key={c.label} className="rounded-card border border-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-ink">{c.value}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-600">{c.sub}</p>
                  <p className="mt-3 text-sm font-medium text-muted">{c.label}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 ${c.tone}`}>
                  {c.star ? <span className="text-lg text-amber-400">★</span> : Icon && <Icon className="h-5 w-5" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink">Revenus confirmés par mois (FCFA)</h2>
          <div className="mt-4 h-64">
            {loading || revenueData.length === 0 ? (
              <p className="text-sm text-muted">Données indisponibles pour le moment.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 'dataMax']} />
                  <Tooltip />
                  <Bar dataKey="v" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink">Taux de confirmation par mois (%)</h2>
          <div className="mt-4 h-64">
            {loading || occupancyData.length === 0 ? (
              <p className="text-sm text-muted">Données indisponibles pour le moment.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="p" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-card border border-line bg-white p-6 shadow-card">
        <h2 className="font-bold text-ink">Activité récente</h2>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted">Aucune activité à afficher pour l&apos;instant.</p>
          ) : (
            activity.map((a) => (
              <div key={a.title} className="flex items-center gap-4 rounded-control border border-line p-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${a.bg}`}> </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="text-sm text-muted">{a.desc}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{a.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

