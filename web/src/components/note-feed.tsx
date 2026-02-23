'use client';

import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NoteType } from '@mygourmetdiary/shared-types';
import { notesApi } from '@/lib/api';
import { NoteCard } from './note-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

interface NoteFeedProps {
  typeFilter?: NoteType;
  binderId?: string;
}

export function NoteFeed({ typeFilter, binderId }: NoteFeedProps) {
  const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: '200px' });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['notes', 'feed', { type: typeFilter, binderId }],
    queryFn: ({ pageParam }) =>
      notesApi.feed({
        cursor: pageParam ?? undefined,
        limit: 20,
        type: typeFilter,
        binderId,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: null as string | null,
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[16/10] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load notes. Please try again.</p>
      </div>
    );
  }

  const notes = data?.pages.flatMap((p) => p.items) ?? [];

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-heading text-muted-foreground mb-2">No notes yet</p>
        <p className="text-sm text-muted-foreground">
          Start your gourmet diary by creating your first note.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      <div ref={ref} className="py-4 flex justify-center">
        {isFetchingNextPage && (
          <div className="flex gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        )}
      </div>
    </>
  );
}
