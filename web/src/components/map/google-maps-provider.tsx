'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const APIProviderInner = dynamic(
  () => import('@vis.gl/react-google-maps').then((mod) => mod.APIProvider),
  { ssr: false },
);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  if (!apiKey) {
    return <>{children}</>;
  }

  return <APIProviderInner apiKey={apiKey}>{children}</APIProviderInner>;
}
