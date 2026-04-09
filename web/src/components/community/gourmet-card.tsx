import Link from 'next/link';
import type { CommunityGourmet } from '@mygourmetdiary/shared-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteTierBadge } from './note-tier-badge';

interface GourmetCardProps {
  gourmet: CommunityGourmet;
}

export function GourmetCard({ gourmet }: GourmetCardProps) {
  const { user, tier, noteCount, tasteSimilarity } = gourmet;
  const bestScore = tasteSimilarity?.reduce<number | null>(
    (best, ts) => (ts.score != null && (best == null || ts.score > best) ? ts.score : best),
    null,
  );
  const matchPercent = bestScore != null ? Math.round(bestScore * 100) : undefined;

  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow min-w-[180px] lg:min-w-0"
    >
      <Avatar className="h-12 w-12 shrink-0">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
        <AvatarFallback className="text-sm">
          {user.displayName?.charAt(0)?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{user.displayName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <NoteTierBadge tier={tier} matchPercent={matchPercent} />
          <span className="text-xs text-muted-foreground">
            {noteCount} {noteCount === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </div>
    </Link>
  );
}
