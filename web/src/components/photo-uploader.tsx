'use client';

import { useRef, useCallback } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhotoFile {
  file: File;
  preview: string;
}

interface PhotoUploaderProps {
  photos: PhotoFile[];
  onChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ photos, onChange, maxPhotos = 10 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxPhotos - photos.length;
      const newPhotos = Array.from(files)
        .slice(0, remaining)
        .filter((f) => f.type.startsWith('image/'))
        .map((file) => ({ file, preview: URL.createObjectURL(file) }));
      onChange([...photos, ...newPhotos]);
    },
    [photos, onChange, maxPhotos],
  );

  const removePhoto = useCallback(
    (index: number) => {
      const removed = photos[index];
      URL.revokeObjectURL(removed.preview);
      onChange(photos.filter((_, i) => i !== index));
    },
    [photos, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <Image src={photo.preview} alt="" fill className="object-cover" sizes="128px" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <div
          className={cn(
            'border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-elevated transition-colors',
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Click or drag photos here ({photos.length}/{maxPhotos})
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}
