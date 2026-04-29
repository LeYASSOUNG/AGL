import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function isAdminUser(roles: string[] | undefined): boolean {
  return Boolean(roles?.includes('ROLE_ADMIN'));
}

/**
 * N’affiche les enfants que si l’utilisateur est connecté avec {@code ROLE_ADMIN}.
 * Sinon redirection vers la connexion (avec retour vers /admin) ou l’accueil.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="min-h-screen bg-surface" aria-busy="true" />;
  }

  if (!user) {
    return (
      <Navigate
        to={`/connexion?redirect=${encodeURIComponent(location.pathname)}`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!isAdminUser(user.roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
