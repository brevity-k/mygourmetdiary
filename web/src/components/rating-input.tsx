'use client';

import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 10 }, (_, i) => {
        const rating = i + 1;
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              'h-8 w-8 rounded-full text-xs font-medium transition-all',
              rating <= value
                ? 'bg-rating-active text-white shadow-sm'
                : 'bg-rating-inactive text-muted-foreground hover:bg-rating-active/50',
            )}
          >
            {rating}
          </button>
        );
      })}
    </div>
  );
}
