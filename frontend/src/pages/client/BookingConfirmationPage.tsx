import { CheckCircle2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { HelpFab } from '../../components/HelpFab';
import { useBooking } from '../../context/BookingContext';
import { formatDateFR, formatFCFA } from '../../lib/format';

export function BookingConfirmationPage() {
  const { draft, total } = useBooking();

  if (!draft.reservationRef) {
    return <Navigate to="/paiement" replace />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
        <div className="rounded-card border border-line bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-emerald-600">Réservation confirmée !</h1>
          <p className="mt-2 text-sm text-muted">
            Votre réservation a été enregistrée avec succès
          </p>
        </div>

        <div className="mt-6 rounded-card border border-line bg-white p-6 shadow-card">
          <h2 className="font-bold text-ink">Détails de la réservation</h2>
          <div className="mt-4 rounded-control bg-brand/10 py-4 text-center">
            <p className="text-xs text-muted">Numéro de réservation</p>
            <p className="mt-1 text-2xl font-bold tracking-wider text-brand">
              {draft.reservationRef}
            </p>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Établissement</p>
              <p className="font-semibold text-ink">{draft.hotelName}</p>
              <p className="mt-3 text-xs text-muted">Date d&apos;arrivée</p>
              <p className="font-semibold text-ink">{formatDateFR(draft.dateArrivee)}</p>
              <p className="mt-3 text-xs text-muted">Nombre de personnes</p>
              <p className="font-semibold text-ink">{draft.guests}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Localisation</p>
              <p className="font-semibold text-ink">{draft.ville || '—'}</p>
              <p className="mt-3 text-xs text-muted">Date de départ</p>
              <p className="font-semibold text-ink">{formatDateFR(draft.dateDepart)}</p>
              <p className="mt-3 text-xs text-muted">Montant payé</p>
              <p className="font-semibold text-brand">{formatFCFA(total)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-brand/30 bg-brand/5 p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-ink">Modifier ou annuler cette réservation</p>
          <p className="mt-1 text-xs text-muted">
            Dates, voyageurs, services ou annulation : tout se fait depuis votre profil.
          </p>
          <Link
            to="/profil?tab=reservations"
            className="mt-4 inline-flex rounded-control bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Ouvrir mes réservations
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/reservation/fin"
            className="rounded-control bg-ink px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Continuer
          </Link>
          <Link
            to="/profil?tab=reservations"
            className="rounded-control border border-line bg-white px-5 py-2.5 text-center text-sm font-medium text-ink shadow-sm"
          >
            Voir mes réservations
          </Link>
          <Link
            to="/"
            className="rounded-control border border-line bg-white px-5 py-2.5 text-center text-sm font-medium text-ink shadow-sm"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
      <HelpFab />
    </div>
  );
}
