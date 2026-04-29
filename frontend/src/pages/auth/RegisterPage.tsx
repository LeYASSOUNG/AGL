import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BackNavLogo } from '../../components/BackNavLogo';
import { BrandLogo } from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { safeAppPath } from '../../lib/safeAppPath';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register({
        prenom,
        nom,
        email,
        telephone: telephone || undefined,
        motDePasse,
      });
      const fromState = safeAppPath((location.state as { from?: string } | null)?.from);
      const fromQuery = safeAppPath(new URLSearchParams(location.search).get('redirect'));
      const target = fromState ?? fromQuery ?? '/';
      navigate(target, { replace: true });
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Inscription impossible');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <BackNavLogo to="/" label="Retour accueil" className="mb-4 self-start" />
      <BrandLogo className="mb-8" />
      <h1 className="text-2xl font-bold text-ink">Inscription</h1>
      <p className="mt-1 text-sm text-muted">Créez votre compte QuickLodge</p>

      <div className="mt-8 w-full max-w-md rounded-card border border-line bg-white p-8 shadow-card">
        <h2 className="text-lg font-bold text-ink">Créer un compte</h2>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-ink">Prénom</label>
              <input
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Nom</label>
              <input
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Téléphone</label>
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
            />
            <p className="mt-1 text-xs text-muted">Au moins 8 caractères</p>
          </div>
          {error && (
            <p className="rounded-control bg-brand/10 px-3 py-2 text-sm text-brand">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-control bg-ink py-3 text-sm font-semibold text-white hover:bg-ink/90"
          >
            S&apos;inscrire
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="font-medium text-brand">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
