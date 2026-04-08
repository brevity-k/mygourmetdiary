import { prisma } from '../clients/prisma';
import { redis } from '../clients/redis';

export const subscriptionsService = {
  async handleWebhook(event: {
    type: string;
    app_user_id: string;
    product_id?: string;
    expiration_at_ms?: number;
  }) {
    const { type, app_user_id: supabaseId, expiration_at_ms } = event;

    const user = await prisma.user.findUnique({
      where: { supabaseId },
    });

    if (!user) {
      console.warn(`RevenueCat webhook for unknown user: ${supabaseId}`);
      return;
    }

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'CONNOISSEUR',
            subscriptionExpiresAt: expiration_at_ms
              ? new Date(expiration_at_ms)
              : null,
          },
        });
        console.log(`Subscription activated for user ${user.id}`);
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'FREE',
            subscriptionExpiresAt: null,
          },
        });
        console.log(`Subscription expired for user ${user.id}`);
        break;

      case 'BILLING_ISSUE':
        console.warn(`Billing issue for user ${user.id} — keeping tier until expiry`);
        break;

      default:
        console.log(`Unhandled RevenueCat event type: ${type}`);
    }

    // Invalidate user cache
    await redis.del(`user:supabase:${supabaseId}`);
  },

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!user) return null;

    return {
      tier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
      isActive: user.subscriptionTier === 'CONNOISSEUR',
    };
  },
};
