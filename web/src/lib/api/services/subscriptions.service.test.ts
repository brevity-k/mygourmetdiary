import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../clients/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../clients/redis', () => ({
  redis: {
    del: vi.fn(),
  },
}));

import { subscriptionsService } from './subscriptions.service';
import { prisma } from '../clients/prisma';
import { redis } from '../clients/redis';

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockRedisDel = redis.del as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('subscriptionsService.handleWebhook', () => {
  it('sets tier to CONNOISSEUR on INITIAL_PURCHASE', async () => {
    const dbUser = { id: 'db-1', supabaseId: 'sup-1' };
    mockFindUnique.mockResolvedValueOnce(dbUser);
    mockUpdate.mockResolvedValueOnce({});
    mockRedisDel.mockResolvedValueOnce(1);

    await subscriptionsService.handleWebhook({
      type: 'INITIAL_PURCHASE',
      app_user_id: 'sup-1',
      expiration_at_ms: 1700000000000,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'db-1' },
      data: {
        subscriptionTier: 'CONNOISSEUR',
        subscriptionExpiresAt: new Date(1700000000000),
      },
    });
    expect(mockRedisDel).toHaveBeenCalledWith('user:supabase:sup-1');
  });

  it('sets tier to FREE on CANCELLATION', async () => {
    const dbUser = { id: 'db-1', supabaseId: 'sup-1' };
    mockFindUnique.mockResolvedValueOnce(dbUser);
    mockUpdate.mockResolvedValueOnce({});
    mockRedisDel.mockResolvedValueOnce(1);

    await subscriptionsService.handleWebhook({
      type: 'CANCELLATION',
      app_user_id: 'sup-1',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'db-1' },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: null,
      },
    });
  });

  it('logs warning and returns without throwing for unknown user', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      subscriptionsService.handleWebhook({
        type: 'INITIAL_PURCHASE',
        app_user_id: 'unknown-user',
      }),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      'RevenueCat webhook for unknown user: unknown-user',
    );
    expect(mockUpdate).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe('subscriptionsService.getStatus', () => {
  it('returns null for missing user', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const result = await subscriptionsService.getStatus('non-existent');
    expect(result).toBeNull();
  });

  it('returns correct shape with isActive true for CONNOISSEUR', async () => {
    const expiresAt = new Date('2026-12-31T00:00:00Z');
    mockFindUnique.mockResolvedValueOnce({
      subscriptionTier: 'CONNOISSEUR',
      subscriptionExpiresAt: expiresAt,
    });

    const result = await subscriptionsService.getStatus('user-1');
    expect(result).toEqual({
      tier: 'CONNOISSEUR',
      expiresAt: expiresAt.toISOString(),
      isActive: true,
    });
  });

  it('returns correct shape with isActive false for FREE', async () => {
    mockFindUnique.mockResolvedValueOnce({
      subscriptionTier: 'FREE',
      subscriptionExpiresAt: null,
    });

    const result = await subscriptionsService.getStatus('user-1');
    expect(result).toEqual({
      tier: 'FREE',
      expiresAt: null,
      isActive: false,
    });
  });
});
