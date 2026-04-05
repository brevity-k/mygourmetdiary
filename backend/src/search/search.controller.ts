import { Controller, Get, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { NotesSearchService } from '../notes/notes.search.service';
import { TieredSearchService } from './tiered-search.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { clampLimit } from '../common/utils/pagination';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: NotesSearchService,
    private readonly tieredSearchService: TieredSearchService,
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
    const safeLimit = clampLimit(limit);
    const safeOffset = Math.max(offset || 0, 0);
    return this.searchService.search(
      user.id,
      q?.slice(0, 500) || '',
      type,
      safeLimit,
      safeOffset,
    );
  }

  @Get('all')
  @ApiOperation({ summary: 'Search own notes + all public notes' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async searchAll(
    @CurrentUser() user: User,
    @Query('q') q: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const safeLimit = clampLimit(limit);
    const safeOffset = Math.max(offset || 0, 0);
    return this.searchService.searchAll(
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
    const perTier = clampLimit(limit, 10, 50);

    return this.tieredSearchService.searchPublicTiered(
      user.id,
      query,
      type,
      perTier,
      filters,
    );
  }
}
