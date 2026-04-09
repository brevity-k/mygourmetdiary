import { MapPin, FileText, Users, Star } from 'lucide-react';
import type { Venue, CommunityStats } from '@mygourmetdiary/shared-types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface VenueHeroProps {
  venue: Venue | undefined;
  stats: CommunityStats | undefined;
  isLoading: boolean;
}

export function VenueHero({ venue, stats, isLoading }: VenueHeroProps) {
  if (isLoading || !venue) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{venue.name}</h1>

      {venue.address && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{venue.address}</span>
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {stats.totalNotes} {stats.totalNotes === 1 ? 'note' : 'notes'}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {stats.totalGourmets} {stats.totalGourmets === 1 ? 'gourmet' : 'gourmets'}
          </Badge>
          {stats.avgRating != null && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              {stats.avgRating.toFixed(1)} avg
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
