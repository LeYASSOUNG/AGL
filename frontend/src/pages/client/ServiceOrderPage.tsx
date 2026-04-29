import { CalendarDays, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { BackNavLogo } from '../../components/BackNavLogo';
import { HelpFab } from '../../components/HelpFab';
import { useAuth } from '../../context/AuthContext';
import { getPublicServiceById, type BackendPublicService } from '../../lib/backendApi';
import { formatFCFA } from '../../lib/format';
import { serviceCategoryLabel } from '../../lib/serviceCategories';
import { toUserFacingErrorMessage } from '../../lib/userFacingError';

function clampQty(n: number) {
  return Math.max(1, Math.min(99, Math.floor(Number.isFinite(n) ? n : 1) || 1));
}

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function randomRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function ServiceOrderPage() {
  const { user, authedFetch } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const serviceId = Number(params.get('serviceId') ?? '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<BackendPublicService | null>(null);

  const [qty, setQty] = useState(1);
  const [serviceDate, setServiceDate] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [method, setMethod] = useState<'mobile' | 'card'>('mobile');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      setLoading(false);
      setError('Service introuvable.');
      setService(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    getPublicServiceById(serviceId)
      .then((s) => {
        if (!alive) return;
        setService(s);
      })
      .catch((e) => {
        if (!alive) return;
        setService(null);
        setError(toUserFacingErrorMessage(e));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [serviceId]);

  const isPaid = (service?.pricingType ?? 'PAID') === 'PAID';
  const unitPrice = Number(service?.prix ?? 0);
  const total = useMemo(() => unitPrice * clampQty(qty), [unitPrice, qty]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !isPaid) return;
    if (!user) {
      navigate(`/connexion`);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await authedFetch<{ id: number; montantTotal: number }>(`/service-orders`, {
        method: 'POST',
        body: JSON.stringify({
          serviceDate: serviceDate || null,
          commentaire: commentaire.trim() || null,
          serviceSelections: [{ serviceId: service.id, quantity: clampQty(qty) }],
        }),
      }).then((r) => r.data);

      const paymentRef = randomRef();
      const modePaiement = method === 'card' ? 'CARTE' : 'VIREMENT';

      const paiement = await authedFetch<{ id: number }>(`/paiements`, {
        method: 'POST',
        body: JSON.stringify({
          serviceOrderId: order.id,
          montant: order.montantTotal ?? total,
          modePaiement,
          referenceExterne: paymentRef,
        }),
      }).then((r) => r.data);

      await authedFetch(`/paiements/${paiement.id}/validate`, { method: 'PUT' });
      await authedFetch(`/service-orders/${order.id}/paid`, { method: 'PUT' });
      navigate(`/services/commande/confirmee?orderId=${order.id}`);
    } catch (e2) {
      setError(toUserFacingErrorMessage(e2));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <BackNavLogo to="/services" label="Retour services" />

        {loading ? (
          <p className="mt-6 text-sm text-muted">Chargement…</p>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {error}
          </div>
        ) : !service ? null : !isPaid ? (
          <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-sm text-muted shadow-sm">
            Ce service est inclus et ne peut pas être commandé séparément.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="rounded-card border border-line bg-card p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {service.categorie ? serviceCategoryLabel(service.categorie) : 'Service'}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-ink">{service.libelle}</h1>
              {service.description ? <p className="mt-3 text-sm text-muted">{service.description}</p> : null}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-ink">
                  Date (optionnel)
                  <div className="relative mt-2">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="date"
                      min={todayIsoDate()}
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="w-full rounded-control border border-line bg-white py-2.5 pl-10 pr-3 text-sm"
                    />
                  </div>
                </label>

                <div>
                  <p className="text-sm font-semibold text-ink">Quantité</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-control border border-line bg-white px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setQty((q2) => clampQty(q2 - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line"
                      aria-label="Diminuer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold text-ink tabular-nums">
                      {clampQty(qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q2) => clampQty(q2 + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line"
                      aria-label="Augmenter"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <label className="mt-4 block text-sm font-semibold text-ink">
                Commentaire (optionnel)
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="mt-2 min-h-[90px] w-full resize-none rounded-control border border-line bg-white px-3 py-2.5 text-sm"
                />
              </label>

              {error ? (
                <p className="mt-4 rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="h-fit rounded-card border border-line bg-card p-6 shadow-card lg:sticky lg:top-24">
              <h2 className="font-bold text-ink">Résumé</h2>
              <div className="mt-4 space-y-2 text-sm text-muted">
                <div className="flex justify-between">
                  <span>Prix unitaire</span>
                  <span className="text-ink">{formatFCFA(unitPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantité</span>
                  <span className="text-ink">{clampQty(qty)}</span>
                </div>
              </div>
              <hr className="my-4 border-line" />
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-ink">Total</span>
                <span className="text-xl font-bold text-brand">{formatFCFA(total)}</span>
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold text-ink">Paiement</p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('mobile')}
                    className={`rounded-control border px-3 py-2 text-left text-sm font-semibold ${
                      method === 'mobile' ? 'border-ink ring-1 ring-ink' : 'border-line'
                    }`}
                  >
                    Mobile Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`rounded-control border px-3 py-2 text-left text-sm font-semibold ${
                      method === 'card' ? 'border-ink ring-1 ring-ink' : 'border-line'
                    }`}
                  >
                    Carte bancaire
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-control bg-ink py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {submitting ? 'Traitement…' : 'Payer et réserver'}
              </button>
              <p className="mt-2 text-center text-xs text-muted">Vous recevrez une confirmation après paiement.</p>
            </div>
          </form>
        )}
      </div>
      <HelpFab />
    </div>
  );
}

