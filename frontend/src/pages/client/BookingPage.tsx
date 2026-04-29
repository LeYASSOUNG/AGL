import { CalendarDays, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { BackNavLogo } from '../../components/BackNavLogo';
import { HelpFab } from '../../components/HelpFab';
import { useBooking } from '../../context/BookingContext';
import { formatFCFA } from '../../lib/format';

export function BookingPage() {
  const { draft, setDraft, nights, roomSubtotal } = useBooking();
  const navigate = useNavigate();

  useEffect(() => {
    if (!draft.hotelId || !draft.roomId) navigate('/');
  }, [draft.hotelId, draft.roomId, navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate('/reservation/services');
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <form onSubmit={onSubmit}>
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
          <BackNavLogo to={`/etablissement/${draft.hotelId ?? ''}`} label="Retour établissement" />
          <h1 className="text-2xl font-bold text-ink">Réservation</h1>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="rounded-card border border-line bg-white p-6 shadow-card">
                <h2 className="font-bold text-ink">Votre sélection</h2>
                <div className="mt-4 flex gap-4">
                  <div className="h-28 w-36 shrink-0 overflow-hidden rounded-lg bg-surface">
                    {draft.coverUrl ? (
                      <img src={draft.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-bold text-ink">{draft.hotelName}</p>
                    <p className="font-semibold text-ink">{draft.roomName}</p>
                    <p className="text-sm text-muted">{draft.roomDescription}</p>
                    <p className="mt-2 text-sm text-muted">
                      Capacité : {draft.capacity} personne(s)
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-card border border-line bg-white p-6 shadow-card">
                <h2 className="font-bold text-ink">Détails du séjour</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-ink">
                    Date d&apos;arrivée
                    <div className="relative mt-1">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        type="date"
                        required
                        value={draft.dateArrivee}
                        onChange={(e) => setDraft({ dateArrivee: e.target.value })}
                        className="w-full rounded-control border border-line bg-[#f3f4f6] py-2.5 pl-10 pr-3 text-sm"
                      />
                    </div>
                  </label>
                  <label className="text-sm font-semibold text-ink">
                    Date de départ
                    <div className="relative mt-1">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        type="date"
                        required
                        value={draft.dateDepart}
                        onChange={(e) => setDraft({ dateDepart: e.target.value })}
                        className="w-full rounded-control border border-line bg-[#f3f4f6] py-2.5 pl-10 pr-3 text-sm"
                      />
                    </div>
                  </label>
                </div>
                <label className="mt-4 block text-sm font-semibold text-ink">
                  Nombre de personnes
                  <div className="relative mt-1">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="number"
                      min={1}
                      max={draft.capacity || 20}
                      value={draft.guests}
                      onChange={(e) =>
                        setDraft({ guests: Number.parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-full rounded-control border border-line bg-[#f3f4f6] py-2.5 pl-10 pr-3 text-sm"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="h-fit rounded-card border border-line bg-white p-6 shadow-card lg:sticky lg:top-24">
              <h2 className="font-bold text-ink">Récapitulatif</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Chambre</span>
                  <span>{formatFCFA(draft.pricePerNight)}/nuit</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Nuitées</span>
                  <span>{nights}</span>
                </div>
                <div className="flex justify-between font-medium text-ink">
                  <span>Sous-total chambre</span>
                  <span>{formatFCFA(roomSubtotal)}</span>
                </div>
              </div>
              <hr className="my-4 border-line" />
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-ink">Total</span>
                <span className="text-xl font-bold text-brand">{formatFCFA(roomSubtotal)}</span>
              </div>
              <button
                type="submit"
                className="mt-6 w-full rounded-control bg-ink py-3 text-sm font-semibold text-white"
              >
                Continuer
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                Vous ne serez débité qu&apos;après confirmation
              </p>
            </div>
          </div>
        </div>
      </form>
      <HelpFab />
    </div>
  );
}
