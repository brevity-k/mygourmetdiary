'use client';

import dynamic from 'next/dynamic';

// Dynamically import the actual providers to avoid Firebase SSR initialization
const ProvidersInner = dynamic(() => import('./providers-inner'), { ssr: false });

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProvidersInner>{children}</ProvidersInner>;
}
