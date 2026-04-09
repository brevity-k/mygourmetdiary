import type { PublicUser, TasteSimilarity, SocialNote, Venue } from './index';

export type CommunitySubjectType = 'venue' | 'product';

export enum ProductCategory {
  WINE = 'WINE',
  SPIRIT = 'SPIRIT',
  SAKE = 'SAKE',
  BEER = 'BEER',
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subType: string | null;
  producer: string | null;
  vintage: number | null;
  region: string | null;
  abv: number | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface CommunityStats {
  subjectType: CommunitySubjectType;
  subjectId: string;
  totalNotes: number;
  totalGourmets: number;
  avgRating: number | null;
  ratingDistribution: Record<string, number>;
}

export interface CommunityGourmet {
  user: PublicUser;
  tier: 1 | 2 | 3;
  noteCount: number;
  tasteSimilarity: TasteSimilarity[] | null;
  isPinned: boolean;
}
