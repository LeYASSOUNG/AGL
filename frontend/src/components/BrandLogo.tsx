import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BrandLogo({
  className = '',
  light = false,
  /** Logo + icône blancs sans pastille (navbar sur photo). */
  minimal = false,
}: {
  className?: string;
  light?: boolean;
  minimal?: boolean;
}) {
  if (minimal && light) {
    return (
      <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
        <Building2 className="h-7 w-7 shrink-0 text-white" strokeWidth={2} aria-hidden />
        <span className="text-lg font-bold tracking-tight text-white">QuickLodge</span>
      </Link>
    );
  }

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${
          light ? 'bg-white/20' : 'bg-brand'
        }`}
      >
        <Building2 className="h-5 w-5" strokeWidth={2} />
      </span>
      <span
        className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}
      >
        QuickLodge
      </span>
    </Link>
  );
}
