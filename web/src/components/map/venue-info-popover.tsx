'use client';

import Link from 'next/link';
import { MapPin, Star, FileText } from 'lucide-react';
import type { Venue } from '@mygourmetdiary/shared-types';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VenueInfoPopoverProps {
  venue: Venue;
  noteCount?: number;
  avgRating?: number | null;
  onClose?: () => void;
}

export function VenueInfoPopover({ venue, noteCount, avgRating, onClose }: VenueInfoPopoverProps) {
  return (
    <div className="min-w-[220px] max-w-[300px] p-3 space-y-2">
      <h3 className="font-heading font-semibold text-sm leading-tight">{venue.name}</h3>

      {venue.address && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{venue.address}</span>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {avgRating != null && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            {avgRating.toFixed(1)}
          </span>
        )}
        {noteCount != null && noteCount > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {noteCount} note{noteCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Link
          href={`/notes/new/restaurant?venueId=${venue.placeId}&venueName=${encodeURIComponent(venue.name)}`}
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'h-7 text-xs')}
        >
          Write Note
        </Link>
        {noteCount != null && noteCount > 0 && (
          <Link
            href={`/search?q=${encodeURIComponent(venue.name)}`}
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'h-7 text-xs')}
          >
            View Notes
          </Link>
        )}
      </div>
    </div>
  );
}
