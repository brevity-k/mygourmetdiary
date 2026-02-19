import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SearchController } from './search.controller';
import { NotesSearchService } from '../notes/notes.search.service';
import { TssCacheService } from '../taste-matching/tss-cache.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: any;
  let tssCache: any;

  const freeUser: any = { id: 'u1', subscriptionTier: 'FREE' };
  const premiumUser: any = { id: 'u1', subscriptionTier: 'CONNOISSEUR' };

  beforeEach(async () => {
    searchService = {
      search: jest.fn().mockResolvedValue({ hits: [], total: 0, limit: 20, offset: 0 }),
      searchPublic: jest.fn().mockResolvedValue({ hits: [], total: 0, limit: 10, offset: 0 }),
    };

    tssCache = {
      getPinnedFriendIds: jest.fn().mockResolvedValue([]),
      getHighTssUserIds: jest.fn().mockResolvedValue([]),
      getModerateTssUserIds: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: NotesSearchService, useValue: searchService },
        { provide: TssCacheService, useValue: tssCache },
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

  // ─── tier deduplication ────────────────────────────────

  it('deduplicates results across tiers', async () => {
    tssCache.getPinnedFriendIds.mockResolvedValue(['friend1']);
    tssCache.getHighTssUserIds.mockResolvedValue(['friend1', 'high1']);
    tssCache.getModerateTssUserIds.mockResolvedValue([]);

    const sharedHit = { id: 'note-1', title: 'Shared' };
    searchService.searchPublic
      .mockResolvedValueOnce({ hits: [sharedHit], total: 1, limit: 10, offset: 0 }) // tier1
      .mockResolvedValueOnce({ hits: [sharedHit], total: 1, limit: 10, offset: 0 }) // tier2
      .mockResolvedValueOnce({ hits: [], total: 0, limit: 10, offset: 0 }) // tier3
      .mockResolvedValueOnce({ hits: [sharedHit], total: 1, limit: 10, offset: 0 }); // tier4

    const result = await controller.searchPublic(freeUser, 'ramen');

    expect(result.tier1).toHaveLength(1);
    expect(result.tier2).toHaveLength(0); // deduplicated
    expect(result.tier4).toHaveLength(0); // deduplicated
  });

  // ─── tier set filtering ────────────────────────────────

  it('excludes friend IDs from high-TSS tier', async () => {
    tssCache.getPinnedFriendIds.mockResolvedValue(['user-a']);
    tssCache.getHighTssUserIds.mockResolvedValue(['user-a', 'user-b']);
    tssCache.getModerateTssUserIds.mockResolvedValue([]);

    searchService.searchPublic.mockResolvedValue({ hits: [], total: 0, limit: 10, offset: 0 });

    await controller.searchPublic(freeUser, 'test');

    // tier2 call should only include user-b (user-a is already in friends)
    const tier2Call = searchService.searchPublic.mock.calls[1];
    expect(tier2Call[1]).toEqual(['user-b']);
  });

  it('excludes friend and high IDs from moderate tier', async () => {
    tssCache.getPinnedFriendIds.mockResolvedValue(['user-a']);
    tssCache.getHighTssUserIds.mockResolvedValue(['user-b']);
    tssCache.getModerateTssUserIds.mockResolvedValue(['user-a', 'user-b', 'user-c']);

    searchService.searchPublic.mockResolvedValue({ hits: [], total: 0, limit: 10, offset: 0 });

    await controller.searchPublic(freeUser, 'test');

    // tier3 call should only include user-c
    const tier3Call = searchService.searchPublic.mock.calls[2];
    expect(tier3Call[1]).toEqual(['user-c']);
  });

  // ─── empty tiers ───────────────────────────────────────

  it('skips search call when tier has no user IDs', async () => {
    tssCache.getPinnedFriendIds.mockResolvedValue([]);
    tssCache.getHighTssUserIds.mockResolvedValue([]);
    tssCache.getModerateTssUserIds.mockResolvedValue([]);

    searchService.searchPublic.mockResolvedValue({ hits: [], total: 0, limit: 10, offset: 0 });

    const result = await controller.searchPublic(freeUser, 'test');

    // Only tier4 (general) should call searchPublic with undefined authorIds
    expect(searchService.searchPublic).toHaveBeenCalledTimes(1);
    expect(result.tier1).toEqual([]);
    expect(result.tier2).toEqual([]);
    expect(result.tier3).toEqual([]);
  });

  // ─── 4-tier response shape ─────────────────────────────

  it('returns correct 4-tier response shape with tier annotations', async () => {
    tssCache.getPinnedFriendIds.mockResolvedValue(['f1']);
    tssCache.getHighTssUserIds.mockResolvedValue(['h1']);
    tssCache.getModerateTssUserIds.mockResolvedValue(['m1']);

    searchService.searchPublic
      .mockResolvedValueOnce({ hits: [{ id: 'n1' }], total: 1, limit: 10, offset: 0 })
      .mockResolvedValueOnce({ hits: [{ id: 'n2' }], total: 1, limit: 10, offset: 0 })
      .mockResolvedValueOnce({ hits: [{ id: 'n3' }], total: 1, limit: 10, offset: 0 })
      .mockResolvedValueOnce({ hits: [{ id: 'n4' }], total: 1, limit: 10, offset: 0 });

    const result = await controller.searchPublic(freeUser, 'test');

    expect(result.tier1).toEqual([{ id: 'n1', tier: 1 }]);
    expect(result.tier2).toEqual([{ id: 'n2', tier: 2 }]);
    expect(result.tier3).toEqual([{ id: 'n3', tier: 3 }]);
    expect(result.tier4).toEqual([{ id: 'n4', tier: 4 }]);
  });
});
