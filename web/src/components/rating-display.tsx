import { cn } from '@/lib/utils';

interface RatingDisplayProps {
  rating: number;
  size?: 'sm' | 'md';
}

export function RatingDisplay({ rating, size = 'md' }: RatingDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full',
            i < rating ? 'bg-rating-active' : 'bg-rating-inactive',
            size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
          )}
        />
      ))}
      <span className={cn('ml-1 font-medium text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {rating}/10
      </span>
    </div>
  );
}
