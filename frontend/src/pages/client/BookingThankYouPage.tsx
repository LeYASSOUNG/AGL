import { Download, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { HelpFab } from '../../components/HelpFab';
import { useBooking } from '../../context/BookingContext';
import { formatFCFA } from '../../lib/format';

export function BookingThankYouPage() {
  const { draft, total, guests, reset } = useBooking();

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-8">
        <div className="rounded-card border border-line bg-white p-6 shadow-card">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-xs text-muted">Nombre de personnes</p>
              <p className="mt-1 text-2xl font-bold text-ink">{guests}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Montant payé</p>
              <p className="mt-1 text-2xl font-bold text-brand">{formatFCFA(total)}</p>
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs text-muted">Mode de paiement</p>
            <p className="font-semibold text-ink">
              {draft.paymentMethod === 'mobile' ? 'Mobile Money' : 'Carte bancaire'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-line bg-white p-6 text-center shadow-card">
          <Mail className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-3 font-bold text-ink">Confirmation envoyée</h2>
          <p className="mt-2 text-sm text-muted">
            Un email de confirmation avec tous les détails de votre réservation a été envoyé à votre
            adresse email. Vous recevrez également des rappels avant votre date d&apos;arrivée.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-control border border-line bg-white px-4 py-2.5 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Télécharger le reçu
          </button>
          <Link
            to="/profil"
            className="rounded-control border border-line bg-white px-4 py-2.5 text-center text-sm font-medium"
          >
            Voir mes réservations
          </Link>
          <Link
            to="/"
            onClick={() => reset()}
            className="rounded-control bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <div className="mt-8 rounded-card border border-line bg-white p-5 shadow-card">
          <h3 className="font-bold text-ink">Informations importantes</h3>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted">
            <li>Check-in : à partir de 14h00</li>
            <li>Check-out : avant 12h00</li>
            <li>Annulation gratuite jusqu&apos;à 24h avant l&apos;arrivée</li>
            <li>Pour toute question, contactez l&apos;établissement ou notre service client</li>
          </ul>
        </div>
      </div>
      <HelpFab />
    </div>
  );
}
