'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { MapPin, UtensilsCrossed, Wine, GlassWater, Warehouse } from 'lucide-react';
import type { Note } from '@mygourmetdiary/shared-types';
import { NoteType } from '@mygourmetdiary/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingDisplay } from '@/components/rating-display';
import { cn } from '@/lib/utils';

const typeConfig = {
  [NoteType.RESTAURANT]: { icon: UtensilsCrossed, label: 'Restaurant', color: 'text-amber-800' },
  [NoteType.WINE]: { icon: Wine, label: 'Wine', color: 'text-red-700' },
  [NoteType.SPIRIT]: { icon: GlassWater, label: 'Spirit', color: 'text-amber-600' },
  [NoteType.WINERY_VISIT]: { icon: Warehouse, label: 'Winery', color: 'text-green-700' },
};

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const config = typeConfig[note.type];
  const Icon = config.icon;
  const coverPhoto = note.photos?.[0];

  const subtitle = getSubtitle(note);

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        {coverPhoto && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={coverPhoto.publicUrl}
              alt={note.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          </div>
        )}
        <CardContent className={cn('space-y-2', coverPhoto ? 'pt-3' : 'pt-4')}>
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', config.color)} />
            <Badge variant="secondary" className="text-[10px]">
              {config.label}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground">
              {format(new Date(note.experiencedAt), 'MMM d, yyyy')}
            </span>
          </div>

          <h3 className="font-heading text-lg font-semibold leading-tight line-clamp-2">
            {note.title}
          </h3>

          {subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
          )}

          {note.venue && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{note.venue.name}</span>
            </div>
          )}

          <RatingDisplay rating={note.rating} size="sm" />

          {note.freeText && (
            <p className="text-sm text-muted-foreground line-clamp-2">{note.freeText}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function getSubtitle(note: Note): string | null {
  const ext = note.extension;
  switch (note.type) {
    case NoteType.RESTAURANT:
      return ext.dishName || null;
    case NoteType.WINE:
      return [ext.wineType, ext.region, ext.vintage].filter(Boolean).join(' · ') || null;
    case NoteType.SPIRIT:
      return [ext.spiritType, ext.distillery].filter(Boolean).join(' · ') || null;
    case NoteType.WINERY_VISIT:
      return ext.wouldRevisit ? 'Would revisit' : null;
    default:
      return null;
  }
}
