import type { CommunityGourmet } from '@mygourmetdiary/shared-types';
import { GourmetCard } from './gourmet-card';
import { Skeleton } from '@/components/ui/skeleton';

interface TopGourmetsListProps {
  gourmets: CommunityGourmet[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

function GourmetSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3 min-w-[180px] lg:min-w-0">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function TopGourmetsList({ gourmets, isLoading, isError }: TopGourmetsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-row gap-3 overflow-x-auto lg:flex-col lg:overflow-visible pb-2 lg:pb-0">
        {Array.from({ length: 3 }, (_, i) => (
          <GourmetSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground py-4">Failed to load gourmets.</p>
    );
  }

  if (!gourmets || gourmets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No gourmets have written about this yet.</p>
    );
  }

  return (
    <div className="flex flex-row gap-3 overflow-x-auto lg:flex-col lg:overflow-visible pb-2 lg:pb-0">
      {gourmets.map((g) => (
        <GourmetCard key={g.user.id} gourmet={g} />
      ))}
    </div>
  );
}
