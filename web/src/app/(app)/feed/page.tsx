'use client';

import { useState } from 'react';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { NoteType } from '@mygourmetdiary/shared-types';
import { NOTE_TYPE_LABELS } from '@mygourmetdiary/shared-constants';
import { NoteFeed } from '@/components/note-feed';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';

const FeedMapView = dynamic(
  () => import('@/components/map/feed-map-view').then((m) => m.FeedMapView),
  { ssr: false },
);
import { Button } from '@/components/ui/button';

const filterOptions = [
  { value: 'all', label: 'All' },
  ...Object.entries(NOTE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function FeedPage() {
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const typeFilter = filter === 'all' ? undefined : (filter as NoteType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-foreground">My Notes</h1>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'map' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap">
          {filterOptions.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {viewMode === 'grid' ? (
        <NoteFeed typeFilter={typeFilter} />
      ) : (
        <FeedMapView typeFilter={typeFilter} />
      )}
    </div>
  );
}
