import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface RatingDistributionProps {
  distribution: Record<string, number> | undefined;
  isLoading: boolean;
}

export function RatingDistribution({ distribution, isLoading }: RatingDistributionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 flex-1 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!distribution) return null;

  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-1.5">
      {Array.from({ length: 10 }, (_, i) => {
        const rating = 10 - i;
        const count = distribution[String(rating)] ?? 0;
        const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2">
            <span className="w-5 text-right text-xs text-muted-foreground tabular-nums">{rating}</span>
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  count > 0 ? 'bg-primary' : '',
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs text-muted-foreground tabular-nums">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
