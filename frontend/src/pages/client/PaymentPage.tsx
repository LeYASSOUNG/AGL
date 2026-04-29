import { CreditCard, Lock, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { BackNavLogo } from '../../components/BackNavLogo';
import { HelpFab } from '../../components/HelpFab';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { formatFCFA } from '../../lib/format';
import { useNavigate } from 'react-router-dom';

function randomRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    ''
  );
}

export function PaymentPage() {
  const { draft, setDraft, total, guests } = useBooking();
  const { user, authedFetch } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'mobile' | 'card'>(draft.paymentMethod);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.hotelId) navigate('/');
  }, [draft.hotelId, navigate]);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (!draft.hotelId || !draft.roomId || !draft.dateArrivee || !draft.dateDepart) return;
    setSubmitting(true);
    setError(null);

    try {
      const reservation = await authedFetch<{ id: number }>(`/reservations`, {
        method: 'POST',
        body: JSON.stringify({
          etablissementId: Number(draft.hotelId),
          chambreIds: [Number(draft.roomId)],
          dateDebut: draft.dateArrivee,
          dateFin: draft.dateDepart,
          nombrePersonnes: draft.guests,
          serviceSelections: draft.services.map((s) => ({
            serviceId: Number(s.id),
            quantity: Math.max(1, Math.min(99, Math.floor(s.quantity) || 1)),
          })),
        }),
      }).then((r) => r.data);

      const paymentRef = randomRef();
      const modePaiement = method === 'card' ? 'CARTE' : 'VIREMENT';

      const paiement = await authedFetch<{ id: number }>(`/paiements`, {
        method: 'POST',
        body: JSON.stringify({
          reservationId: reservation.id,
          montant: total,
          modePaiement,
          referenceExterne: paymentRef,
        }),
      }).then((r) => r.data);

      // Validation + confirmation (pour que l’UI arrive sur "confirmée")
      await authedFetch(`/paiements/${paiement.id}/validate`, { method: 'PUT' });
      await authedFetch(`/reservations/${reservation.id}/confirm`, { method: 'PUT' });

      setDraft({ paymentMethod: method, reservationRef: String(reservation.id) });
      navigate('/reservation/confirmee');
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Paiement impossible');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <BackNavLogo to="/reservation/services" label="Retour services" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Paiement sécurisé</h1>
        <form onSubmit={confirm}>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="rounded-card border border-line bg-white p-6 shadow-card">
                <h2 className="font-bold text-ink">Méthode de paiement</h2>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setMethod('mobile')}
                    className={`flex w-full items-start gap-3 rounded-control border p-4 text-left transition ${
                      method === 'mobile' ? 'border-ink ring-1 ring-ink' : 'border-line'
                    }`}
                  >
                    <span
                      className={`mt-1 h-3 w-3 rounded-full border-2 ${
                        method === 'mobile' ? 'border-ink bg-ink' : 'border-muted'
                      }`}
                    />
                    <Smartphone className="h-6 w-6 text-muted" />
                    <div>
                      <p className="font-semibold text-ink">Mobile Money</p>
                      <p className="text-sm text-muted">
                        Orange Money, MTN Money, Moov Money
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`flex w-full items-start gap-3 rounded-control border p-4 text-left transition ${
                      method === 'card' ? 'border-ink ring-1 ring-ink' : 'border-line'
                    }`}
                  >
                    <span
                      className={`mt-1 h-3 w-3 rounded-full border-2 ${
                        method === 'card' ? 'border-ink bg-ink' : 'border-muted'
                      }`}
                    />
                    <CreditCard className="h-6 w-6 text-muted" />
                    <div>
                      <p className="font-semibold text-ink">Carte bancaire</p>
                      <p className="text-sm text-muted">Visa, Mastercard</p>
                    </div>
                  </button>
                </div>

                {method === 'mobile' ? (
                  <div className="mt-6">
                    <label className="text-sm font-semibold text-ink">Numéro de téléphone</label>
                    <input
                      placeholder="+225 XX XX XX XX XX"
                      className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-3 text-sm"
                    />
                    <p className="mt-2 text-xs text-muted">
                      Vous recevrez une notification pour valider le paiement.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-ink">Nom sur la carte</label>
                      <input
                        placeholder="JEAN DUPONT"
                        className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-ink">Numéro de carte</label>
                      <input
                        placeholder="1234 5678 9012 3456"
                        className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-3 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-ink">Date d&apos;expiration</label>
                        <input
                          placeholder="MM/AA"
                          className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-ink">CVV</label>
                        <input
                          placeholder="123"
                          className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-start gap-2 rounded-control bg-brand/10 p-3 text-sm text-brand">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  Vos informations de paiement sont sécurisées et cryptées
                </div>
              </div>
            </div>

            <div className="h-fit rounded-card border border-line bg-white p-6 shadow-card lg:sticky lg:top-24">
              <h2 className="font-bold text-ink">Résumé du paiement</h2>
              <div className="mt-4 space-y-2 border-b border-line pb-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Dates</span>
                  <span className="text-right text-ink">
                    {draft.dateArrivee || '—'} → {draft.dateDepart || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Personnes</span>
                  <span className="text-ink">{guests}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Services (lignes)</span>
                  <span className="text-ink">
                    {draft.services.reduce((acc, s) => acc + Math.max(1, Math.min(99, s.quantity || 1)), 0)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-between font-bold text-ink">
                <span>Montant total</span>
                <span className="text-xl text-brand">{formatFCFA(total)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-control bg-ink py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Traitement…' : 'Confirmer le paiement'}
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                En confirmant, vous acceptez nos conditions générales de vente.
              </p>
              {error && <p className="mt-3 rounded-control bg-brand/10 px-3 py-2 text-sm text-brand">{error}</p>}
            </div>
          </div>
        </form>
      </div>
      <HelpFab />
    </div>
  );
}
