import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type BackNavLogoProps = {
  to?: string;
  label?: string;
  className?: string;
};

export function BackNavLogo({ to = '/', label = 'Retour', className = '' }: BackNavLogoProps) {
  return (
    <Link
      to={to}
      className={[
        'group inline-flex max-w-full items-center gap-2.5 rounded-full border border-line/80 bg-white/80 py-1.5 pl-1.5 pr-4',
        'text-sm font-semibold text-ink shadow-[0_10px_25px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]',
        'backdrop-blur-md transition duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-brand/25 hover:bg-white hover:text-brand hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] hover:ring-brand/10',
        'active:translate-y-0 active:shadow-[0_10px_25px_rgba(15,23,42,0.08)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/14 to-brand/6 text-brand transition duration-200 group-hover:from-brand/22 group-hover:to-brand/10 group-hover:shadow-inner"
        aria-hidden
      >
        <ArrowLeft
          className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-0.5"
          strokeWidth={2.25}
        />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
