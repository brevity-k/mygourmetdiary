import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasteCategory } from '@prisma/client';
import { FriendsService } from './friends.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TssCacheService } from '../../taste-matching/tss-cache.service';

describe('FriendsService', () => {
  let service: FriendsService;
  let prisma: any;
  let tssCache: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      gourmetFriendPin: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    tssCache = {
      getPairScore: jest.fn(),
      getAllScoresForUser: jest.fn(),
      invalidateUserCaches: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TssCacheService, useValue: tssCache },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  afterEach(() => jest.clearAllMocks());

  // --- pinFriend ---

  it('throws BadRequestException when pinning yourself', async () => {
    await expect(
      service.pinFriend('user1', {
        pinnedId: 'user1',
        categories: [TasteCategory.RESTAURANT],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException for non-existent user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.pinFriend('user1', {
        pinnedId: 'user2',
        categories: [TasteCategory.RESTAURANT],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when TSS is below 0.7', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user2' });
    tssCache.getPairScore.mockResolvedValue({ score: 0.5, overlapCount: 10 });

    await expect(
      service.pinFriend('user1', {
        pinnedId: 'user2',
        categories: [TasteCategory.RESTAURANT],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when overlap is below 5', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user2' });
    tssCache.getPairScore.mockResolvedValue({ score: 0.8, overlapCount: 3 });

    await expect(
      service.pinFriend('user1', {
        pinnedId: 'user2',
        categories: [TasteCategory.RESTAURANT],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when no TSS entry exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user2' });
    tssCache.getPairScore.mockResolvedValue(null);

    await expect(
      service.pinFriend('user1', {
        pinnedId: 'user2',
        categories: [TasteCategory.RESTAURANT],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('successfully pins with valid TSS and invalidates cache', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user2' });
    tssCache.getPairScore.mockResolvedValue({ score: 0.85, overlapCount: 10 });
    const pin = {
      pinnerId: 'user1',
      pinnedId: 'user2',
      categories: [TasteCategory.RESTAURANT],
      pinned: { id: 'user2', displayName: 'Test', avatarUrl: null },
    };
    prisma.gourmetFriendPin.upsert.mockResolvedValue(pin);

    const result = await service.pinFriend('user1', {
      pinnedId: 'user2',
      categories: [TasteCategory.RESTAURANT],
    });

    expect(result).toBe(pin);
    expect(tssCache.invalidateUserCaches).toHaveBeenCalledWith('user1');
  });

  // --- unpinFriend ---

  it('unpins friend and invalidates cache', async () => {
    await service.unpinFriend('user1', 'user2');
    expect(prisma.gourmetFriendPin.deleteMany).toHaveBeenCalledWith({
      where: { pinnerId: 'user1', pinnedId: 'user2' },
    });
    expect(tssCache.invalidateUserCaches).toHaveBeenCalledWith('user1');
  });

  // --- canPin ---

  it('returns canPin: true when at least one category meets thresholds', async () => {
    tssCache.getPairScore.mockImplementation(
      (_u: string, _t: string, cat: TasteCategory) => {
        if (cat === TasteCategory.RESTAURANT) {
          return Promise.resolve({ score: 0.8, overlapCount: 10 });
        }
        return Promise.resolve({ score: 0.3, overlapCount: 2 });
      },
    );

    const result = await service.canPin('user1', 'user2');
    expect(result.canPin).toBe(true);
    expect(result.eligibleCategories).toContain(TasteCategory.RESTAURANT);
    expect(result.eligibleCategories).not.toContain(TasteCategory.WINE);
  });

  it('returns canPin: false when no category meets thresholds', async () => {
    tssCache.getPairScore.mockResolvedValue({ score: 0.4, overlapCount: 3 });

    const result = await service.canPin('user1', 'user2');
    expect(result.canPin).toBe(false);
    expect(result.eligibleCategories).toHaveLength(0);
  });

  // --- listFriends ---

  it('returns friends enriched with TSS scores from cache', async () => {
    prisma.gourmetFriendPin.findMany.mockResolvedValue([
      {
        pinnerId: 'user1',
        pinnedId: 'user2',
        categories: [TasteCategory.RESTAURANT],
        pinned: { id: 'user2', displayName: 'Bob', avatarUrl: null, createdAt: new Date() },
        createdAt: new Date(),
      },
    ]);
    tssCache.getAllScoresForUser.mockResolvedValue([
      { userId: 'user2', category: TasteCategory.RESTAURANT, score: 0.85, overlapCount: 12 },
      { userId: 'user2', category: TasteCategory.WINE, score: 0.72, overlapCount: 6 },
    ]);

    const result = await service.listFriends('user1');
    expect(result).toHaveLength(1);
    expect(result[0].similarities).toHaveLength(3);

    const restaurant = result[0].similarities.find(
      (s) => s.category === TasteCategory.RESTAURANT,
    );
    expect(restaurant?.score).toBe(0.85);
    expect(restaurant?.overlapCount).toBe(12);

    const spirit = result[0].similarities.find(
      (s) => s.category === TasteCategory.SPIRIT,
    );
    expect(spirit?.score).toBeNull();
    expect(spirit?.overlapCount).toBe(0);
  });

  it('uses single cache call for listFriends (no N+1)', async () => {
    prisma.gourmetFriendPin.findMany.mockResolvedValue([]);
    tssCache.getAllScoresForUser.mockResolvedValue([]);

    await service.listFriends('user1');

    // Should call getAllScoresForUser exactly once, not getPairScore
    expect(tssCache.getAllScoresForUser).toHaveBeenCalledTimes(1);
    expect(tssCache.getPairScore).not.toHaveBeenCalled();
  });
});
