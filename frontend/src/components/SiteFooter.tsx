import { Link } from 'react-router-dom';

type ColLink = { label: string; to?: string; href?: string; external?: boolean };

function FooterLink({ label, to, href, external }: ColLink) {
  const className =
    'block py-1.5 text-sm text-[#222222]/80 transition hover:text-ink hover:underline';
  if (to) {
    return (
      <Link to={to} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a
      href={href ?? '#'}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
    </a>
  );
}

const assistance: ColLink[] = [
  { label: "Centre d'aide", to: '/infos#aide' },
  { label: 'Nous contacter', to: '/infos#contact' },
  { label: "Options d'annulation", to: '/profil?tab=reservations' },
];

const accueil: ColLink[] = [
  { label: 'Mettez votre logement sur Quicklodge', to: '/host/hebergements' },
  { label: 'Ressources pour les hôtes', to: '/infos#ressources-hotes' },
  { label: 'Forum de la communauté', to: '/infos#forum' },
];

const entreprise: ColLink[] = [
  { label: 'À propos', to: '/infos#a-propos' },
  { label: 'Carrières', to: '/infos#carrieres' },
  { label: "Conditions d'utilisation", to: '/infos#cgu' },
  { label: 'Politique de confidentialité', to: '/infos#confidentialite' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-[#f7f7f7] text-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">
          <div>
            <h2 className="text-sm font-semibold text-ink">Assistance</h2>
            <nav className="mt-4 flex flex-col" aria-label="Assistance">
              {assistance.map((item) => (
                <FooterLink key={item.label} {...item} />
              ))}
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">Accueil de voyageurs</h2>
            <nav className="mt-4 flex flex-col" aria-label="Accueil de voyageurs">
              {accueil.map((item) => (
                <FooterLink key={item.label} {...item} />
              ))}
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">Quicklodge</h2>
            <nav className="mt-4 flex flex-col" aria-label="Quicklodge">
              {entreprise.map((item) => (
                <FooterLink key={item.label} {...item} />
              ))}
            </nav>
          </div>
        </div>
        <div className="mt-12 border-t border-black/[0.08] pt-8 text-center text-xs text-muted md:text-left">
          <p>© {new Date().getFullYear()} Quicklodge</p>
        </div>
      </div>
    </footer>
  );
}
