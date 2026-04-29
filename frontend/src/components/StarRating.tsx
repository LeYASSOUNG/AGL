import { Star } from 'lucide-react';

export function StarRating({
  value,
  size = 'md',
}: {
  value: number;
  size?: 'sm' | 'md';
}) {
  const rounded = Math.min(5, Math.max(0, Math.round(value)));
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`${dim} ${i < rounded ? 'fill-current stroke-amber-400 stroke-[1]' : 'fill-none stroke-amber-400 stroke-[1.5] opacity-35'}`}
        />
      ))}
    </div>
  );
}
