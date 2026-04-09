'use client';

import { Visibility } from '@mygourmetdiary/shared-types';
import { cn } from '@/lib/utils';

const OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: Visibility.PRIVATE, label: 'Private', hint: 'Only you can see this note' },
  { value: Visibility.FRIENDS, label: 'Friends', hint: 'Your pinned Gourmet Friends can see this note' },
  { value: Visibility.PUBLIC, label: 'Public', hint: 'Anyone can discover this note' },
];

interface Props {
  value: Visibility;
  onChange: (v: Visibility) => void;
}

export function VisibilitySelector({ value, onChange }: Props) {
  const selectedOption = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Visibility</label>
      <div className="flex rounded-lg border border-border overflow-hidden" role="radiogroup">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              value === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-muted',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{selectedOption.hint}</p>
    </div>
  );
}
