'use client';

import { useState } from 'react';
import { NoteType } from '@mygourmetdiary/shared-types';
import { NOTE_TYPE_LABELS } from '@mygourmetdiary/shared-constants';
import { NoteFeed } from '@/components/note-feed';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const filterOptions = [
  { value: 'all', label: 'All' },
  ...Object.entries(NOTE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function FeedPage() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-foreground">My Notes</h1>
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

      <NoteFeed typeFilter={filter === 'all' ? undefined : (filter as NoteType)} />
    </div>
  );
}
