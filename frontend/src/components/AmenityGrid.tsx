import { Car, Utensils, Waves, Wifi, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const map: Record<string, LucideIcon> = {
  wifi: Wifi,
  utensils: Utensils,
  waves: Waves,
  car: Car,
  sparkles: Sparkles,
};

export function AmenityGrid({
  items,
}: {
  items: { icon: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
      {items.map((a) => {
        const Icon = map[a.icon] ?? Sparkles;
        return (
          <div
            key={a.label}
            className="flex flex-col items-center gap-2 text-center text-sm text-muted"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink">
              <Icon className="h-5 w-5" />
            </span>
            {a.label}
          </div>
        );
      })}
    </div>
  );
}
