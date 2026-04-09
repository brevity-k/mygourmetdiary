'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X, MapPin, Star, FileText, Users, PenLine, Loader2 } from 'lucide-react';
import type { MapPin as MapPinType, SocialNote } from '@mygourmetdiary/shared-types';
import { NoteType } from '@mygourmetdiary/shared-types';
import { NOTE_TYPE_CONFIG } from '@/lib/note-type-config';
import { areaExplorerApi } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingDisplay } from '@/components/rating-display';
import { cn } from '@/lib/utils';

interface VenuePreviewPanelProps {
  pin: MapPinType;
  onClose: () => void;
}

function VenueNoteItem({ note }: { note: SocialNote }) {
  const config = NOTE_TYPE_CONFIG[note.type] ?? NOTE_TYPE_CONFIG[NoteType.RESTAURANT];
  const Icon = config.icon;
  const coverPhoto = note.photos?.[0];

  return (
    <Link
      href={`/notes/${note.id}`}
      className="flex gap-3 p-2 rounded-lg hover:bg-surface-elevated transition-colors group"
    >
      {coverPhoto ? (
        <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
          <Image
            src={coverPhoto.publicUrl}
            alt={note.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="64px"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-md bg-surface-elevated flex items-center justify-center shrink-0">
          <Icon className={cn('h-6 w-6', config.color)} />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium leading-tight line-clamp-1">{note.title}</p>
        {note.author && (
          <p className="text-xs text-muted-foreground">by {note.author.displayName}</p>
        )}
        <div className="flex items-center gap-2">
          <RatingDisplay rating={note.rating} size="sm" />
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(note.experiencedAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </Link>
  );
}

function VenueNotesList({ venueId }: { venueId: string }) {
  const { data: notes, isLoading } = useQuery({
    queryKey: ['venueNotes', venueId],
    queryFn: () => areaExplorerApi.getVenueNotes(venueId),
    enabled: !!venueId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No notes for this venue yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
        Notes ({notes.length})
      </h4>
      {notes.map((note) => (
        <VenueNoteItem key={note.id} note={note as SocialNote} />
      ))}
    </div>
  );
}

export function VenuePreviewPanel({ pin, onClose }: VenuePreviewPanelProps) {
  const { venue } = pin;

  return (
    <div
      className={cn(
        'bg-surface border border-border shadow-lg z-20',
        'hidden lg:flex lg:flex-col lg:w-[360px] lg:absolute lg:right-4 lg:top-4 lg:bottom-4 lg:rounded-xl',
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border-light">
        <h3 className="font-heading font-semibold text-lg truncate pr-2">{venue.name}</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {venue.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{venue.address}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          {pin.avgRating != null && (
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="font-medium">{pin.avgRating.toFixed(1)}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-4 w-4" />
            {pin.noteCount} note{pin.noteCount !== 1 ? 's' : ''}
          </span>
        </div>

        {pin.friendNoteCount > 0 && (
          <div className="rounded-lg bg-primary/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Users className="h-4 w-4" />
              {pin.friendNoteCount} friend note{pin.friendNoteCount !== 1 ? 's' : ''}
            </div>
            {pin.avgFriendRating != null && (
              <p className="text-xs text-muted-foreground">
                Avg friend rating: {pin.avgFriendRating.toFixed(1)}/10
              </p>
            )}
            {pin.topFriendNames.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {pin.topFriendNames.join(', ')}
              </p>
            )}
          </div>
        )}

        {pin.myNoteCount > 0 && (
          <p className="text-sm text-muted-foreground">
            You have {pin.myNoteCount} note{pin.myNoteCount !== 1 ? 's' : ''} here.
          </p>
        )}

        <VenueNotesList venueId={venue.id} />
      </div>

      <div className="p-4 border-t border-border-light flex gap-2">
        <Link
          href={`/venues/${venue.placeId}`}
          className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Notes
        </Link>
        <Link
          href={`/notes/new/restaurant?venueId=${venue.placeId}&venueName=${encodeURIComponent(venue.name)}`}
          className={cn(buttonVariants({ variant: 'default' }), 'flex-1')}
        >
          <PenLine className="h-4 w-4 mr-2" />
          Write Note
        </Link>
      </div>
    </div>
  );
}

/** Mobile bottom panel variant */
export function VenuePreviewBottomPanel({ pin, onClose }: VenuePreviewPanelProps) {
  const { venue } = pin;

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-16 z-30 bg-surface border-t border-border shadow-lg rounded-t-xl animate-in slide-in-from-bottom duration-200 max-h-[70vh] flex flex-col">
      <div className="p-4 space-y-3 shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <h3 className="font-heading font-semibold truncate">{venue.name}</h3>
            {venue.address && (
              <p className="text-xs text-muted-foreground truncate">{venue.address}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {pin.avgRating != null && (
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="font-medium">{pin.avgRating.toFixed(1)}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-4 w-4" />
            {pin.noteCount} note{pin.noteCount !== 1 ? 's' : ''}
          </span>
          {pin.friendNoteCount > 0 && (
            <span className="flex items-center gap-1.5 text-primary">
              <Users className="h-4 w-4" />
              {pin.friendNoteCount} friend{pin.friendNoteCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 px-4 pb-2">
        <VenueNotesList venueId={venue.id} />
      </div>

      <div className="p-4 border-t border-border-light shrink-0 flex gap-2">
        <Link
          href={`/venues/${venue.placeId}`}
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'flex-1')}
        >
          View Notes
        </Link>
        <Link
          href={`/notes/new/restaurant?venueId=${venue.placeId}&venueName=${encodeURIComponent(venue.name)}`}
          className={cn(buttonVariants({ size: 'sm', variant: 'default' }), 'flex-1')}
        >
          Write Note
        </Link>
      </div>
    </div>
  );
}
