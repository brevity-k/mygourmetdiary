'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Photo } from '@mygourmetdiary/shared-types';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: Photo[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className={cn(
        'grid gap-2',
        photos.length === 1 && 'grid-cols-1',
        photos.length === 2 && 'grid-cols-2',
        photos.length >= 3 && 'grid-cols-2 md:grid-cols-3',
      )}>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(i)}
            className={cn(
              'relative overflow-hidden rounded-lg',
              photos.length === 1 ? 'aspect-[16/10]' : 'aspect-square',
              i === 0 && photos.length >= 3 && 'col-span-2 md:col-span-1 aspect-[16/10] md:aspect-square',
            )}
          >
            <Image
              src={photo.publicUrl}
              alt=""
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-50"
          >
            <X className="h-8 w-8" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={() => setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)}
                className="absolute left-4 text-white/80 hover:text-white z-50"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                onClick={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
                className="absolute right-4 text-white/80 hover:text-white z-50"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <div className="relative w-full max-w-4xl aspect-[4/3] mx-4">
            <Image
              src={photos[lightboxIndex].publicUrl}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
