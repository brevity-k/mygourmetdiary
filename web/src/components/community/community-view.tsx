'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { CommunityStats, CommunityGourmet, SocialNote } from '@mygourmetdiary/shared-types';
import { communityApi } from '@/lib/api';
import { NoteCard } from '@/components/note-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TopGourmetsList } from './top-gourmets-list';
import { RatingDistribution } from './rating-distribution';
import { WriteNoteFab } from './write-note-fab';

interface CommunityViewProps {
  subjectType: 'venue' | 'product';
  subjectId: string;
  hero: React.ReactNode;
  writeNoteHref: string;
}

export function CommunityView({ subjectType, subjectId, hero, writeNoteHref }: CommunityViewProps) {
  const statsQuery = useQuery<CommunityStats>({
    queryKey: ['community', 'stats', subjectType, subjectId],
    queryFn: () => communityApi.getStats(subjectType, subjectId),
  });

  const gourmetsQuery = useQuery<CommunityGourmet[]>({
    queryKey: ['community', 'gourmets', subjectType, subjectId],
    queryFn: () => communityApi.getGourmets(subjectType, subjectId, 10),
  });

  type NotesPage = { items: SocialNote[]; nextCursor: string | null; hasMore: boolean };

  const notesQuery = useInfiniteQuery({
    queryKey: ['community', 'notes', subjectType, subjectId],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      communityApi.getNotes(subjectType, subjectId, pageParam ?? undefined, 20) as Promise<NotesPage>,
    getNextPageParam: (lastPage: NotesPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: null as string | null,
  });

  const notes = notesQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      {hero}

      {/* Mobile: gourmets horizontal row */}
      <div className="lg:hidden space-y-4">
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3">Top Gourmets</h2>
          <TopGourmetsList
            gourmets={gourmetsQuery.data}
            isLoading={gourmetsQuery.isLoading}
            isError={gourmetsQuery.isError}
          />
        </div>

        {/* Mobile: rating distribution */}
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3">Ratings</h2>
          <RatingDistribution
            distribution={statsQuery.data?.ratingDistribution}
            isLoading={statsQuery.isLoading}
          />
        </div>
      </div>

      {/* Desktop: two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Notes column */}
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold">Notes</h2>

          {notesQuery.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {notesQuery.isError && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Failed to load notes. Please try again.
            </p>
          )}

          {!notesQuery.isLoading && !notesQuery.isError && notes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No notes yet. Be the first to write one!</p>
            </div>
          )}

          {notes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}

          {notesQuery.hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => notesQuery.fetchNextPage()}
                disabled={notesQuery.isFetchingNextPage}
              >
                {notesQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div>
            <h2 className="text-lg font-heading font-semibold mb-3">Top Gourmets</h2>
            <TopGourmetsList
              gourmets={gourmetsQuery.data}
              isLoading={gourmetsQuery.isLoading}
              isError={gourmetsQuery.isError}
            />
          </div>

          <div>
            <h2 className="text-lg font-heading font-semibold mb-3">Ratings</h2>
            <RatingDistribution
              distribution={statsQuery.data?.ratingDistribution}
              isLoading={statsQuery.isLoading}
            />
          </div>
        </aside>
      </div>

      <WriteNoteFab href={writeNoteHref} />
    </div>
  );
}
