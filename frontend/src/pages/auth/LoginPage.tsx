import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { BackNavLogo } from '../../components/BackNavLogo';
import { useAuth } from '../../context/AuthContext';
import { safeAppPath } from '../../lib/safeAppPath';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const u = await login({ email: email || 'demo@quicklodge.com', motDePasse });
      const fromState = safeAppPath((location.state as { from?: string } | null)?.from);
      const fromQuery = safeAppPath(new URLSearchParams(location.search).get('redirect'));
      const adminDefault = u.roles?.includes('ROLE_ADMIN') ? '/admin' : '/';
      const target = fromState ?? fromQuery ?? adminDefault;
      navigate(target, { replace: true });
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Connexion impossible');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <BackNavLogo to="/" label="Retour accueil" className="mb-4 self-start" />
      <BrandLogo className="mb-8" />
      <h1 className="text-2xl font-bold text-ink">Connexion</h1>
      <p className="mt-1 text-sm text-muted">Accédez à votre compte</p>

      <div className="mt-8 w-full max-w-md rounded-card border border-line bg-white p-8 shadow-card">
        <h2 className="text-lg font-bold text-ink">Se connecter</h2>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-3 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Mot de passe</label>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-control bg-[#f3f4f6] px-3 py-3 text-sm text-ink outline-none ring-brand focus:ring-2"
            />
          </div>
          {error && <p className="rounded-control bg-brand/10 px-3 py-2 text-sm text-brand">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-control bg-ink py-3 text-sm font-semibold text-white hover:bg-ink/90"
          >
            Se connecter
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <span className="text-brand">Mot de passe oublié ?</span>
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-medium text-brand">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
