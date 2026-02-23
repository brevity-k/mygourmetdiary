'use client';

import { AreaExplorerMap } from '@/components/map/area-explorer-map';

export default function ExplorePage() {
  return (
    <div className="h-[calc(100vh-80px)] lg:h-screen w-full">
      <AreaExplorerMap />
    </div>
  );
}
