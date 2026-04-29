import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { HelpFab } from '../../components/HelpFab';
import { useAuth } from '../../context/AuthContext';

export function ServiceOrderConfirmationPage() {
  const { authedFetch } = useAuth();
  const [params] = useSearchParams();
  const orderId = Number(params.get('orderId') ?? '');
  const [status, setStatus] = useState<string>('—');

  useEffect(() => {
    if (!Number.isFinite(orderId) || orderId <= 0) return;
    authedFetch<{ statut?: string }>(`/service-orders/${orderId}`)
      .then((r) => setStatus(String(r.data?.statut ?? '—')))
      .catch(() => setStatus('—'));
  }, [orderId, authedFetch]);

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="rounded-2xl border border-line bg-card p-8 shadow-card">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-ink">Service réservé</h1>
              <p className="mt-1 text-sm text-muted">
                Votre commande a été enregistrée. Statut : <span className="font-semibold text-ink">{status}</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/services" className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-white">
                  Retour services
                </Link>
                <Link to="/profil?tab=reservations" className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink">
                  Mon profil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HelpFab />
    </div>
  );
}

