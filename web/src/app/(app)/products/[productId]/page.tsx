import { ProductCommunityPage } from './product-community-page';

export default function Page({ params }: { params: Promise<{ productId: string }> }) {
  return <ProductCommunityPage paramsPromise={params} />;
}
