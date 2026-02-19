import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    redis = {
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => jest.clearAllMocks());

  // --- handleWebhook: user not found ---

  it('returns early and logs when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await service.handleWebhook({
      type: 'INITIAL_PURCHASE',
      app_user_id: 'unknown-uid',
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  // --- handleWebhook: INITIAL_PURCHASE ---

  it('upgrades user to CONNOISSEUR on INITIAL_PURCHASE', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });
    prisma.user.update.mockResolvedValue({});

    await service.handleWebhook({
      type: 'INITIAL_PURCHASE',
      app_user_id: 'fb1',
      expiration_at_ms: 1700000000000,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        subscriptionTier: 'CONNOISSEUR',
        subscriptionExpiresAt: new Date(1700000000000),
      },
    });
    expect(redis.del).toHaveBeenCalledWith('user:firebase:fb1');
  });

  // --- handleWebhook: RENEWAL ---

  it('upgrades user to CONNOISSEUR on RENEWAL', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });
    prisma.user.update.mockResolvedValue({});

    await service.handleWebhook({
      type: 'RENEWAL',
      app_user_id: 'fb1',
      expiration_at_ms: 1700000000000,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        subscriptionTier: 'CONNOISSEUR',
        subscriptionExpiresAt: new Date(1700000000000),
      },
    });
  });

  // --- handleWebhook: PRODUCT_CHANGE ---

  it('upgrades user to CONNOISSEUR on PRODUCT_CHANGE', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });
    prisma.user.update.mockResolvedValue({});

    await service.handleWebhook({
      type: 'PRODUCT_CHANGE',
      app_user_id: 'fb1',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        subscriptionTier: 'CONNOISSEUR',
        subscriptionExpiresAt: null,
      },
    });
  });

  // --- handleWebhook: CANCELLATION ---

  it('downgrades user to FREE on CANCELLATION', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });
    prisma.user.update.mockResolvedValue({});

    await service.handleWebhook({
      type: 'CANCELLATION',
      app_user_id: 'fb1',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: null,
      },
    });
  });

  // --- handleWebhook: EXPIRATION ---

  it('downgrades user to FREE on EXPIRATION', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });
    prisma.user.update.mockResolvedValue({});

    await service.handleWebhook({
      type: 'EXPIRATION',
      app_user_id: 'fb1',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: null,
      },
    });
  });

  // --- handleWebhook: BILLING_ISSUE ---

  it('does not change tier on BILLING_ISSUE', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });

    await service.handleWebhook({
      type: 'BILLING_ISSUE',
      app_user_id: 'fb1',
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith('user:firebase:fb1');
  });

  // --- handleWebhook: unknown event ---

  it('does not change tier on unknown event type', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });

    await service.handleWebhook({
      type: 'SOME_FUTURE_EVENT',
      app_user_id: 'fb1',
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  // --- handleWebhook: cache invalidation ---

  it('always invalidates user cache after webhook', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firebaseUid: 'fb1' });
    prisma.user.update.mockResolvedValue({});

    await service.handleWebhook({
      type: 'INITIAL_PURCHASE',
      app_user_id: 'fb1',
      expiration_at_ms: 1700000000000,
    });

    expect(redis.del).toHaveBeenCalledWith('user:firebase:fb1');
  });

  // --- getStatus ---

  it('returns null for unknown user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await service.getStatus('missing');
    expect(result).toBeNull();
  });

  it('returns FREE tier status', async () => {
    prisma.user.findUnique.mockResolvedValue({
      subscriptionTier: 'FREE',
      subscriptionExpiresAt: null,
    });

    const result = await service.getStatus('u1');
    expect(result).toEqual({
      tier: 'FREE',
      expiresAt: null,
      isActive: false,
    });
  });

  it('returns CONNOISSEUR tier status with expiresAt', async () => {
    const expires = new Date('2026-12-31T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue({
      subscriptionTier: 'CONNOISSEUR',
      subscriptionExpiresAt: expires,
    });

    const result = await service.getStatus('u1');
    expect(result).toEqual({
      tier: 'CONNOISSEUR',
      expiresAt: expires.toISOString(),
      isActive: true,
    });
  });
});
