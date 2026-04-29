import { Outlet, NavLink, Link, Navigate } from 'react-router-dom';
import {
  Bed,
  Briefcase,
  Building2,
  Calendar,
  Home,
  LayoutDashboard,
  LogOut,
  Plus,
  Star,
} from 'lucide-react';
import { AppHeader } from '../../components/AppHeader';
import { HelpFab } from '../../components/HelpFab';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/host', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/host/hebergements', icon: Building2, label: 'Mes hébergements' },
  { to: '/host/chambres', icon: Bed, label: 'Chambres' },
  { to: '/host/services', icon: Briefcase, label: 'Services' },
  { to: '/host/reservations', icon: Calendar, label: 'Réservations' },
  { to: '/host/avis', icon: Star, label: 'Avis' },
];

export function HostShell() {
  const { user, logout } = useAuth();
  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto flex max-w-[1400px] gap-0">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white py-6 md:flex md:min-h-[calc(100vh-57px)]">
          <div className="px-4">
            <p className="text-sm font-bold text-ink">Espace Hôte / Gérez votre établissement</p>
            <Link
              to="/host/hebergements"
              className="mt-4 flex items-center justify-center gap-2 rounded-control bg-ink py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nouvel hébergement
            </Link>
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-0.5 px-2">
            {nav.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-ink text-white' : 'text-muted hover:bg-surface'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto border-t border-line px-2 pt-4">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface"
            >
              <Home className="h-4 w-4" />
              Retour au site
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <p className="mb-4 text-xs text-muted md:hidden">Connecté : {user?.email}</p>
          <Outlet />
        </main>
      </div>
      <HelpFab />
    </div>
  );
}
