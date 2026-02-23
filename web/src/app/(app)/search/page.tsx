'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { NoteType } from '@mygourmetdiary/shared-types';
import { searchApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { NoteCard } from '@/components/note-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/use-debounce';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, typeFilter],
    queryFn: () =>
      searchApi.search(
        debouncedQuery,
        typeFilter === 'all' ? undefined : typeFilter,
        20,
      ),
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold">Search</h1>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, dishes, wines, spirits..."
          className="pl-10"
          autoFocus
        />
      </div>

      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={NoteType.RESTAURANT}>Restaurant</TabsTrigger>
          <TabsTrigger value={NoteType.WINE}>Wine</TabsTrigger>
          <TabsTrigger value={NoteType.SPIRIT}>Spirit</TabsTrigger>
        </TabsList>
      </Tabs>

      {debouncedQuery.length < 2 ? (
        <div className="text-center py-16">
          <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Type at least 2 characters to search</p>
        </div>
      ) : isLoading || isFetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : data && data.hits.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{data.total} result{data.total !== 1 && 's'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.hits.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No results found for &quot;{debouncedQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}
