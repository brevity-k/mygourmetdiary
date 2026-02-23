'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { venuesApi } from '@/lib/api';
import type { Venue } from '@mygourmetdiary/shared-types';

interface VenueSearchProps {
  value: Venue | null;
  onChange: (venue: Venue | null) => void;
}

export function VenueSearch({ value, onChange }: VenueSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Venue[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const venues = await venuesApi.search(query);
        setResults(venues);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{value.name}</p>
          {value.address && <p className="text-xs text-muted-foreground truncate">{value.address}</p>}
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Search for a restaurant or venue..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
      />
      {searching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          Searching...
        </div>
      )}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-md max-h-64 overflow-y-auto">
          {results.map((venue) => (
            <button
              key={venue.placeId}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-surface-elevated flex items-start gap-2"
              onClick={() => {
                onChange(venue);
                setShowResults(false);
                setQuery('');
              }}
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{venue.name}</p>
                {venue.address && <p className="text-xs text-muted-foreground">{venue.address}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
