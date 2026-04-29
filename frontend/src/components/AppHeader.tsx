import { Bell, ChevronDown, Home, Shield, UserRound } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from './RequireAdmin';
import { BrandLogo } from './BrandLogo';
import { Container } from './ui/Container';

type AppHeaderProps = {
  /** Ancien bandeau bleu uni (pages qui l’utilisent encore). */
  blueBg?: boolean;
  /** Barre transparente sur fond coloré / dégradé (page d’accueil). */
  variant?: 'default' | 'hero';
};

export function AppHeader({ blueBg = false }: AppHeaderProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const label =
    user ? `${user.prenom} ${user.nom}`.trim() || user.email : 'Se connecter';

  const lightLogo = blueBg;
  const isHome = pathname === '/';
  const logementsActive = pathname === '/' || pathname.startsWith('/etablissement');
  const servicesActive = pathname === '/services' || pathname.startsWith('/services/');

  const tabUnderline = (active: boolean) =>
    [
      'mt-1 h-[3px] w-12 shrink-0 rounded-full transition-colors',
      active ? (lightLogo ? 'bg-white' : 'bg-brand') : 'bg-transparent',
    ].join(' ');

  const headerClasses = blueBg
    ? 'border-white/15 bg-brand text-white shadow-md'
    : isHome
      ? `border-line bg-card text-ink ${scrolled ? 'shadow-[0_18px_60px_rgba(15,23,42,0.16)]' : 'shadow-[0_12px_40px_rgba(15,23,42,0.12)]'}`
      : `border-line bg-card text-ink ${scrolled ? 'shadow-[0_16px_54px_rgba(15,23,42,0.14)]' : 'shadow-[0_10px_34px_rgba(15,23,42,0.10)]'}`;

  const navItemTone = (active: boolean) => {
    if (lightLogo) {
      return active ? 'text-white' : 'text-white/80 hover:text-white';
    }
    return active ? 'text-ink' : 'text-ink/75 hover:text-ink';
  };

  const navItemPill = (active: boolean) => {
    // On the homepage hero, add a subtle pill background so the navbar stays readable.
    if (!isHome || lightLogo) return '';
    return active ? 'bg-soft/80' : 'hover:bg-soft/70';
  };

  return (
    <header
      className={`sticky top-0 z-[80] border-b ${headerClasses}`}
    >
      <Container className="relative z-10 grid grid-cols-1 items-center gap-y-2.5 py-2.5 md:grid-cols-[1fr_auto_1fr] md:gap-x-4 md:py-3">
        <div className="flex justify-center md:justify-start">
          <BrandLogo light={lightLogo} />
        </div>
        <nav
          className="flex items-end justify-center gap-6 rounded-2xl border border-line bg-soft/70 px-2 py-1 md:gap-10"
          aria-label="Navigation principale"
        >
            <Link
              to="/"
              className={`group flex flex-col items-center pb-0.5 text-center transition-colors ${
                navItemTone(logementsActive)
              }`}
            >
              <Home
                className={`h-5 w-5 ${logementsActive ? '' : 'opacity-85'} group-hover:opacity-100`}
                strokeWidth={logementsActive ? 2.25 : 2}
              />
              <span
                className={`mt-1 rounded-xl px-3 py-1 text-sm transition-colors ${
                  logementsActive ? 'font-bold' : 'font-semibold'
                } ${navItemPill(logementsActive)}`}
              >
                Logements
              </span>
              <span className={tabUnderline(logementsActive)} aria-hidden />
            </Link>
            <Link
              to="/services"
              className={`group flex flex-col items-center pb-0.5 text-center transition-colors ${
                navItemTone(servicesActive)
              }`}
            >
              <Bell
                className={`h-5 w-5 ${servicesActive ? '' : 'opacity-85'} group-hover:opacity-100`}
                strokeWidth={servicesActive ? 2.25 : 2}
              />
              <span
                className={`mt-1 rounded-xl px-3 py-1 text-sm transition-colors ${
                  servicesActive ? 'font-bold' : 'font-semibold'
                } ${navItemPill(servicesActive)}`}
              >
                Services
              </span>
              <span className={tabUnderline(servicesActive)} aria-hidden />
            </Link>
        </nav>
        <div className="relative flex justify-center md:justify-end" ref={ref}>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-2 rounded-control px-2 py-1.5 text-sm font-medium ${
                  lightLogo ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-soft'
                }`}
              >
                <UserRound className="h-5 w-5 opacity-80" />
                {label}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </button>
              {open && (
                <div
                  className="absolute right-0 top-full z-[90] mt-2 w-56 overflow-hidden rounded-card border border-line bg-card/95 py-1 text-ink shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-md"
                  role="menu"
                >
                  <Link
                    to="/profil?tab=reservations"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-soft"
                    onClick={() => setOpen(false)}
                  >
                    Mes réservations
                  </Link>
                  <Link
                    to="/host"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-soft"
                    onClick={() => setOpen(false)}
                  >
                    Gérer mes hébergements
                  </Link>
                  {isAdminUser(user.roles) && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-soft"
                      onClick={() => setOpen(false)}
                    >
                      <Shield className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      Administration
                    </Link>
                  )}
                  <hr className="my-1 border-line" />
                  <Link
                    to="/profil?tab=parametres"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-soft"
                    onClick={() => setOpen(false)}
                  >
                    Paramètres
                  </Link>
                  <hr className="my-1 border-line" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/connexion"
              className={`flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium ${
                lightLogo
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-brand text-white shadow-sm transition hover:bg-brand/90'
              }`}
            >
              <UserRound className="h-4 w-4" />
              Connexion
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
