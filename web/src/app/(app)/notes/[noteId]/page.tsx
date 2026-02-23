'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  UtensilsCrossed,
  Wine,
  GlassWater,
  Warehouse,
} from 'lucide-react';
import { NoteType, Visibility } from '@mygourmetdiary/shared-types';
import { notesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingDisplay } from '@/components/rating-display';
import { PhotoGallery } from '@/components/photo-gallery';
import { StaticVenueMap } from '@/components/map/static-venue-map';
import { useToast } from '@/components/ui/toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const typeIcons = {
  [NoteType.RESTAURANT]: UtensilsCrossed,
  [NoteType.WINE]: Wine,
  [NoteType.SPIRIT]: GlassWater,
  [NoteType.WINERY_VISIT]: Warehouse,
};

export default function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: note, isLoading } = useQuery({
    queryKey: ['notes', noteId],
    queryFn: () => notesApi.get(noteId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => notesApi.remove(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showToast('Note deleted', 'success');
      router.push('/feed');
    },
    onError: () => showToast('Failed to delete note', 'error'),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[16/10] w-full rounded-lg" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Note not found.</p>
        <Link href="/feed" className="text-primary text-sm hover:underline mt-2 inline-block">
          Back to feed
        </Link>
      </div>
    );
  }

  const Icon = typeIcons[note.type];
  const ext = note.extension;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md hover:bg-surface-elevated">
            Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => router.push(`/notes/${noteId}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-error"
              onClick={() => {
                if (confirm('Delete this note? This cannot be undone.')) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PhotoGallery photos={note.photos} />

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="h-5 w-5 text-primary" />
          <Badge variant="secondary">{note.type.replace('_', ' ')}</Badge>
          {note.visibility === Visibility.PRIVATE ? (
            <Badge variant="outline"><EyeOff className="h-3 w-3 mr-1" /> Private</Badge>
          ) : (
            <Badge variant="outline"><Eye className="h-3 w-3 mr-1" /> Public</Badge>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            {format(new Date(note.experiencedAt), 'MMMM d, yyyy')}
          </span>
        </div>

        <h1 className="text-3xl font-heading font-bold">{note.title}</h1>

        {note.venue && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{note.venue.name}</span>
            {note.venue.address && (
              <span className="text-sm">· {note.venue.address}</span>
            )}
          </div>
        )}

        {note.venue?.lat != null && note.venue?.lng != null && (
          <StaticVenueMap
            lat={note.venue.lat}
            lng={note.venue.lng}
            venueName={note.venue.name}
            noteType={note.type}
          />
        )}

        <RatingDisplay rating={note.rating} />

        <Separator />

        {/* Type-specific details */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            {note.type === NoteType.RESTAURANT && (
              <>
                {ext.dishName && <DetailRow label="Dish" value={ext.dishName} />}
                {ext.dishCategory && <DetailRow label="Category" value={ext.dishCategory} />}
                <DetailRow label="Would Order Again" value={ext.wouldOrderAgain ? 'Yes' : 'No'} icon={ext.wouldOrderAgain ? <ThumbsUp className="h-4 w-4 text-success" /> : <ThumbsDown className="h-4 w-4 text-error" />} />
                {ext.portionSize && <DetailRow label="Portion" value={ext.portionSize} />}
                {ext.pricePaid && <DetailRow label="Price" value={`$${ext.pricePaid}`} />}
              </>
            )}

            {note.type === NoteType.WINE && (
              <>
                {ext.wineName && <DetailRow label="Wine" value={ext.wineName} />}
                {ext.wineType && <DetailRow label="Type" value={ext.wineType} />}
                {ext.vintage && <DetailRow label="Vintage" value={String(ext.vintage)} />}
                {ext.region && <DetailRow label="Region" value={ext.region} />}
                {ext.grapeVarietal?.length > 0 && <DetailRow label="Varietal" value={ext.grapeVarietal.join(', ')} />}
                {ext.finish && <DetailRow label="Finish" value={ext.finish} />}
                {ext.pricePaid && <DetailRow label="Price" value={`$${ext.pricePaid}`} />}
                {ext.pairingNotes && <DetailRow label="Pairing" value={ext.pairingNotes} />}
              </>
            )}

            {note.type === NoteType.SPIRIT && (
              <>
                {ext.spiritName && <DetailRow label="Spirit" value={ext.spiritName} />}
                {ext.spiritType && <DetailRow label="Type" value={ext.spiritType} />}
                {ext.subType && <DetailRow label="Sub-type" value={ext.subType} />}
                {ext.distillery && <DetailRow label="Distillery" value={ext.distillery} />}
                {ext.ageStatement && <DetailRow label="Age" value={ext.ageStatement} />}
                {ext.abv && <DetailRow label="ABV" value={`${ext.abv}%`} />}
                {ext.servingMethod && <DetailRow label="Serving" value={ext.servingMethod.replace('_', ' ')} />}
                {ext.pricePaid && <DetailRow label="Price" value={`$${ext.pricePaid}`} />}
              </>
            )}

            {note.type === NoteType.WINERY_VISIT && (
              <>
                {ext.ambianceRating && <DetailRow label="Ambiance" value={`${ext.ambianceRating}/10`} />}
                {ext.serviceRating && <DetailRow label="Service" value={`${ext.serviceRating}/10`} />}
                <DetailRow label="Would Revisit" value={ext.wouldRevisit ? 'Yes' : 'No'} icon={ext.wouldRevisit ? <ThumbsUp className="h-4 w-4 text-success" /> : <ThumbsDown className="h-4 w-4 text-error" />} />
                {ext.reservationRequired !== undefined && <DetailRow label="Reservation Required" value={ext.reservationRequired ? 'Yes' : 'No'} />}
              </>
            )}
          </CardContent>
        </Card>

        {note.freeText && (
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold">Notes</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{note.freeText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}
