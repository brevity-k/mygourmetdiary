import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NoteTierBadgeProps {
  tier: number;
  matchPercent?: number;
}

export function NoteTierBadge({ tier, matchPercent }: NoteTierBadgeProps) {
  if (tier > 2) return null;

  if (tier === 1) {
    return (
      <Badge className={cn('text-[10px] border-transparent bg-primary text-primary-foreground')}>
        Friend
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        'text-[10px] border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      )}
    >
      {matchPercent != null ? `${matchPercent}% match` : 'Match'}
    </Badge>
  );
}
