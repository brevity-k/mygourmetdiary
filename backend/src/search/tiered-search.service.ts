import { Injectable } from '@nestjs/common';
import { NotesSearchService } from '../notes/notes.search.service';
import { TssCacheService } from '../taste-matching/tss-cache.service';

export interface PublicSearchFilters {
  minRating?: number;
  maxPrice?: number;
  cuisineTags?: string[];
  wineType?: string;
  spiritType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TieredSearchResult {
  tier1: Array<Record<string, unknown> & { tier: number }>;
  tier2: Array<Record<string, unknown> & { tier: number }>;
  tier3: Array<Record<string, unknown> & { tier: number }>;
  tier4: Array<Record<string, unknown> & { tier: number }>;
}

const EMPTY_SEARCH_RESULT = { hits: [], total: 0, limit: 0, offset: 0 } as const;

@Injectable()
export class TieredSearchService {
  constructor(
    private readonly searchService: NotesSearchService,
    private readonly tssCache: TssCacheService,
  ) {}

  /**
   * Search public notes with friend-tiered results.
   *
   * Tier 1: Pinned gourmet friends
   * Tier 2: High TSS users (>= 0.7)
   * Tier 3: Moderate TSS users (0.5 - 0.7)
   * Tier 4: General public
   */
  async searchPublicTiered(
    userId: string,
    query: string,
    type?: string,
    perTier = 10,
    filters?: PublicSearchFilters,
  ): Promise<TieredSearchResult> {
    // Load tier user sets in parallel
    const [friendIds, highTssIds, moderateTssIds] = await Promise.all([
      this.tssCache.getPinnedFriendIds(userId),
      this.tssCache.getHighTssUserIds(userId),
      this.tssCache.getModerateTssUserIds(userId),
    ]);

    // Exclude already-included IDs from lower tiers
    const highOnly = highTssIds.filter((id) => !friendIds.includes(id));
    const moderateOnly = moderateTssIds.filter(
      (id) => !friendIds.includes(id) && !highTssIds.includes(id),
    );

    const [tier1, tier2, tier3, tier4] = await Promise.all([
      friendIds.length > 0
        ? this.searchService.searchPublic(query, friendIds, type, perTier, 0, filters)
        : Promise.resolve({ ...EMPTY_SEARCH_RESULT, limit: perTier }),
      highOnly.length > 0
        ? this.searchService.searchPublic(query, highOnly, type, perTier, 0, filters)
        : Promise.resolve({ ...EMPTY_SEARCH_RESULT, limit: perTier }),
      moderateOnly.length > 0
        ? this.searchService.searchPublic(query, moderateOnly, type, perTier, 0, filters)
        : Promise.resolve({ ...EMPTY_SEARCH_RESULT, limit: perTier }),
      this.searchService.searchPublic(query, undefined, type, perTier, 0, filters),
    ]);

    // Deduplicate across tiers — higher tiers take priority
    const seenIds = new Set<string>();
    const addTier = (hits: Array<Record<string, unknown>>, tier: number) => {
      const results: Array<Record<string, unknown> & { tier: number }> = [];
      for (const hit of hits) {
        const id = hit.id as string;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          results.push({ ...hit, tier });
        }
      }
      return results;
    };

    return {
      tier1: addTier(tier1.hits as Array<Record<string, unknown>>, 1),
      tier2: addTier(tier2.hits as Array<Record<string, unknown>>, 2),
      tier3: addTier(tier3.hits as Array<Record<string, unknown>>, 3),
      tier4: addTier(tier4.hits as Array<Record<string, unknown>>, 4),
    };
  }
}
