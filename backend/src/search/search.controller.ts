import { Controller, Get, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { NotesSearchService } from '../notes/notes.search.service';
import { TssCacheService } from '../taste-matching/tss-cache.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: NotesSearchService,
    private readonly tssCache: TssCacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search own notes via full-text search' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async search(
    @CurrentUser() user: User,
    @Query('q') q: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
    const safeOffset = Math.max(offset || 0, 0);
    return this.searchService.search(
      user.id,
      q?.slice(0, 500) || '',
      type,
      safeLimit,
      safeOffset,
    );
  }

  @Get('public')
  @ApiOperation({ summary: 'Search public notes with friend-tiered results' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'minRating', required: false, description: 'Premium filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Premium filter' })
  @ApiQuery({ name: 'cuisineTags', required: false, description: 'Premium filter (comma-separated)' })
  @ApiQuery({ name: 'wineType', required: false, description: 'Premium filter' })
  @ApiQuery({ name: 'spiritType', required: false, description: 'Premium filter' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Premium filter (ISO date)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Premium filter (ISO date)' })
  async searchPublic(
    @CurrentUser() user: User,
    @Query('q') q: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('minRating') minRating?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('cuisineTags') cuisineTags?: string,
    @Query('wineType') wineType?: string,
    @Query('spiritType') spiritType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Check if any premium filters are used
    const hasPremiumFilters = minRating || maxPrice || cuisineTags || wineType || spiritType || dateFrom || dateTo;
    if (hasPremiumFilters && user.subscriptionTier !== 'CONNOISSEUR') {
      throw new ForbiddenException('Advanced filters require a Connoisseur subscription');
    }

    const filters = hasPremiumFilters
      ? {
          minRating: minRating ? parseInt(minRating) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          cuisineTags: cuisineTags ? cuisineTags.split(',').map((t) => t.trim()) : undefined,
          wineType: wineType || undefined,
          spiritType: spiritType || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }
      : undefined;
    const query = q?.slice(0, 500) || '';
    const perTier = Math.min(Math.max(limit || 10, 1), 50);

    // Load tier sets in parallel
    const [friendIds, highTssIds, moderateTssIds] = await Promise.all([
      this.tssCache.getPinnedFriendIds(user.id),
      this.tssCache.getHighTssUserIds(user.id),
      this.tssCache.getModerateTssUserIds(user.id),
    ]);

    // Exclude already-included IDs from lower tiers
    const highOnly = highTssIds.filter((id) => !friendIds.includes(id));
    const moderateOnly = moderateTssIds.filter(
      (id) => !friendIds.includes(id) && !highTssIds.includes(id),
    );

    const [tier1, tier2, tier3, tier4] = await Promise.all([
      friendIds.length > 0
        ? this.searchService.searchPublic(query, friendIds, type, perTier, 0, filters)
        : Promise.resolve({ hits: [], total: 0, limit: perTier, offset: 0 }),
      highOnly.length > 0
        ? this.searchService.searchPublic(query, highOnly, type, perTier, 0, filters)
        : Promise.resolve({ hits: [], total: 0, limit: perTier, offset: 0 }),
      moderateOnly.length > 0
        ? this.searchService.searchPublic(query, moderateOnly, type, perTier, 0, filters)
        : Promise.resolve({ hits: [], total: 0, limit: perTier, offset: 0 }),
      this.searchService.searchPublic(query, undefined, type, perTier, 0, filters),
    ]);

    // Deduplicate across tiers
    const seenIds = new Set<string>();
    const addTier = (hits: any[], tier: number) => {
      const results: any[] = [];
      for (const hit of hits) {
        if (!seenIds.has(hit.id)) {
          seenIds.add(hit.id);
          results.push({ ...hit, tier });
        }
      }
      return results;
    };

    return {
      tier1: addTier(tier1.hits, 1),
      tier2: addTier(tier2.hits, 2),
      tier3: addTier(tier3.hits, 3),
      tier4: addTier(tier4.hits, 4),
    };
  }
}
