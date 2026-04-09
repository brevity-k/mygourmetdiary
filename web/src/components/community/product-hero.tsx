import { FileText, Users, Star } from 'lucide-react';
import type { Product, CommunityStats } from '@mygourmetdiary/shared-types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductHeroProps {
  product: Product | undefined;
  stats: CommunityStats | undefined;
  isLoading: boolean;
}

export function ProductHero({ product, stats, isLoading }: ProductHeroProps) {
  if (isLoading || !product) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  const details = [product.subType, product.vintage, product.region]
    .filter(Boolean)
    .join(' \u00b7 ');

  return (
    <div className="space-y-3">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{product.name}</h1>

      {product.producer && (
        <p className="text-sm text-muted-foreground">{product.producer}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{product.category}</Badge>
        {details && <span className="text-sm text-muted-foreground">{details}</span>}
      </div>

      {stats && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {stats.totalNotes} {stats.totalNotes === 1 ? 'note' : 'notes'}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {stats.totalGourmets} {stats.totalGourmets === 1 ? 'gourmet' : 'gourmets'}
          </Badge>
          {stats.avgRating != null && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              {stats.avgRating.toFixed(1)} avg
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
