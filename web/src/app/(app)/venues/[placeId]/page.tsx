import { VenueCommunityPage } from './venue-community-page';

export default function Page({ params }: { params: Promise<{ placeId: string }> }) {
  return <VenueCommunityPage paramsPromise={params} />;
}
