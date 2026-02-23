'use client';

import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  category: string;
  group?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export function TagSelector({ category, group, value, onChange }: TagSelectorProps) {
  const { data: tags } = useQuery({
    queryKey: ['tags', category, group],
    queryFn: () => tagsApi.list(category, group),
  });

  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              if (selected) {
                onChange(value.filter((v) => v !== tag.id));
              } else {
                onChange([...value, tag.id]);
              }
            }}
          >
            <Badge
              variant={selected ? 'default' : 'outline'}
              className={cn('cursor-pointer transition-colors', selected && 'bg-primary')}
            >
              {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
              {tag.name}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
