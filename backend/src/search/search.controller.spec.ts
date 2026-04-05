import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SearchController } from './search.controller';
import { NotesSearchService } from '../notes/notes.search.service';
import { TieredSearchService } from './tiered-search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: any;
  let tieredSearchService: any;

  const freeUser: any = { id: 'u1', subscriptionTier: 'FREE' };
  const premiumUser: any = { id: 'u1', subscriptionTier: 'CONNOISSEUR' };

  const emptyTieredResult = {
    tier1: [],
    tier2: [],
    tier3: [],
    tier4: [],
  };

  beforeEach(async () => {
    searchService = {
      search: jest.fn().mockResolvedValue({ hits: [], total: 0, limit: 20, offset: 0 }),
      searchAll: jest.fn().mockResolvedValue({ hits: [], total: 0, limit: 20, offset: 0 }),
    };

    tieredSearchService = {
      searchPublicTiered: jest.fn().mockResolvedValue(emptyTieredResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: NotesSearchService, useValue: searchService },
        { provide: TieredSearchService, useValue: tieredSearchService },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── own search ────────────────────────────────────────

  it('clamps limit between 1 and 100', async () => {
    await controller.search(freeUser, 'ramen', undefined, 200, 0);

    expect(searchService.search).toHaveBeenCalledWith('u1', 'ramen', undefined, 100, 0);
  });

  it('defaults limit to 20 when not provided', async () => {
    await controller.search(freeUser, 'ramen');

    expect(searchService.search).toHaveBeenCalledWith('u1', 'ramen', undefined, 20, 0);
  });

  it('passes type filter to search service', async () => {
    await controller.search(freeUser, 'wine', 'WINE', 10, 0);

    expect(searchService.search).toHaveBeenCalledWith('u1', 'wine', 'WINE', 10, 0);
  });

  // ─── public search: premium filter gating ──────────────

  it('rejects premium filters for FREE user', async () => {
    await expect(
      controller.searchPublic(freeUser, 'ramen', undefined, undefined, '7'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows premium filters for CONNOISSEUR user', async () => {
    await expect(
      controller.searchPublic(premiumUser, 'ramen', undefined, undefined, '7'),
    ).resolves.toBeDefined();
  });

  // ─── delegation to TieredSearchService ─────────────────

  it('delegates to tieredSearchService.searchPublicTiered', async () => {
    await controller.searchPublic(freeUser, 'ramen');

    expect(tieredSearchService.searchPublicTiered).toHaveBeenCalledWith(
      'u1',
      'ramen',
      undefined,
      10,
      undefined,
    );
  });

  it('passes type and clamped perTier to tiered search', async () => {
    await controller.searchPublic(freeUser, 'wine', 'WINE', 25);

    expect(tieredSearchService.searchPublicTiered).toHaveBeenCalledWith(
      'u1',
      'wine',
      'WINE',
      25,
      undefined,
    );
  });

  it('clamps perTier between 1 and 50', async () => {
    await controller.searchPublic(freeUser, 'test', undefined, 200);

    expect(tieredSearchService.searchPublicTiered).toHaveBeenCalledWith(
      'u1',
      'test',
      undefined,
      50,
      undefined,
    );
  });

  it('passes parsed premium filters to tiered search', async () => {
    await controller.searchPublic(
      premiumUser, 'ramen', 'RESTAURANT', 10,
      '7', '50.5', 'japanese,ramen', 'Red', 'Whiskey', '2025-01-01', '2025-12-31',
    );

    expect(tieredSearchService.searchPublicTiered).toHaveBeenCalledWith(
      'u1',
      'ramen',
      'RESTAURANT',
      10,
      {
        minRating: 7,
        maxPrice: 50.5,
        cuisineTags: ['japanese', 'ramen'],
        wineType: 'Red',
        spiritType: 'Whiskey',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      },
    );
  });

  it('returns the tiered result from the service', async () => {
    const tieredResult = {
      tier1: [{ id: 'n1', tier: 1 }],
      tier2: [{ id: 'n2', tier: 2 }],
      tier3: [{ id: 'n3', tier: 3 }],
      tier4: [{ id: 'n4', tier: 4 }],
    };
    tieredSearchService.searchPublicTiered.mockResolvedValue(tieredResult);

    const result = await controller.searchPublic(freeUser, 'test');

    expect(result).toEqual(tieredResult);
  });
});
