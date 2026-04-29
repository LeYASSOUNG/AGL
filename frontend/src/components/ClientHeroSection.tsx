import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

type ClientHeroSectionProps = {
  children: ReactNode;
  /** Calque décoratif (ex. bulles) entre le fond et le contenu — pointer-events: none recommandé. */
  decorations?: ReactNode;
};

/**
 * Bandeau client (accueil, services) : image pleine largeur (sans filtre).
 */
export function ClientHeroSection({ children, decorations }: ClientHeroSectionProps) {
  const HERO_IMAGES = useMemo(
    () => [
      // Rotation d'images locales (hôtels / plages)
      '/images/hero-rot-1.png',
      '/images/hero-rot-2.png',
      '/images/hero-rot-3.png',
      '/images/hero-rot-4.png',
      '/images/hero-rot-5.png',
      '/images/hero-rot-6.png',
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const activeUrl = HERO_IMAGES[idx % HERO_IMAGES.length]!;
  const nextUrl = HERO_IMAGES[(idx + 1) % HERO_IMAGES.length]!;
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const interval = window.setInterval(() => {
      setFade(true);
      window.setTimeout(() => {
        setIdx((v) => (v + 1) % HERO_IMAGES.length);
        setFade(false);
      }, 650);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [HERO_IMAGES.length]);

  const baseLayer: CSSProperties = {
    backgroundImage: `url('${activeUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const nextLayer: CSSProperties = {
    backgroundImage: `url('${nextUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: fade ? 1 : 0,
    transition: 'opacity 650ms ease',
  };

  return (
    <div className="relative min-h-[min(100vh,760px)] bg-neutral-900 pb-20 pt-0 text-white sm:min-h-[min(92vh,820px)]">
      <div className="pointer-events-none absolute inset-0" style={baseLayer} aria-hidden />
      <div className="pointer-events-none absolute inset-0" style={nextLayer} aria-hidden />
      {decorations ? (
        <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">{decorations}</div>
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
