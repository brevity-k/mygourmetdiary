'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product, CommunityStats } from '@mygourmetdiary/shared-types';
import { ProductCategory } from '@mygourmetdiary/shared-types';
import { productsApi, communityApi } from '@/lib/api';
import { CommunityView } from '@/components/community/community-view';
import { ProductHero } from '@/components/community/product-hero';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductCommunityPageProps {
  paramsPromise: Promise<{ productId: string }>;
}

function noteTypeFromCategory(category: ProductCategory): string {
  switch (category) {
    case ProductCategory.WINE:
      return 'wine';
    case ProductCategory.SPIRIT:
    case ProductCategory.SAKE:
    case ProductCategory.BEER:
      return 'spirit';
    default:
      return 'wine';
  }
}

export function ProductCommunityPage({ paramsPromise }: ProductCommunityPageProps) {
  const { productId } = use(paramsPromise);

  const productQuery = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId),
  });

  const product = productQuery.data;

  const statsQuery = useQuery<CommunityStats>({
    queryKey: ['community', 'stats', 'product', productId],
    queryFn: () => communityApi.getStats('product', productId),
    enabled: !!product,
  });

  if (productQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  const noteType = noteTypeFromCategory(product.category);
  const productName = product.name || '';
  const writeNoteHref = `/notes/new/${noteType}?productId=${encodeURIComponent(productId)}&productName=${encodeURIComponent(productName)}`;

  return (
    <CommunityView
      subjectType="product"
      subjectId={productId}
      hero={
        <ProductHero
          product={product}
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
        />
      }
      writeNoteHref={writeNoteHref}
    />
  );
}
