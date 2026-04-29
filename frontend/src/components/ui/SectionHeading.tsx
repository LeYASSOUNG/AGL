import type { ReactNode } from 'react';

type SectionHeadingProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function SectionHeading({ title, subtitle, right, className }: SectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className ?? ''}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-ink md:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

