import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async handleWebhook(event: {
    type: string;
    app_user_id: string;
    product_id?: string;
    expiration_at_ms?: number;
  }) {
    const { type, app_user_id: firebaseUid, expiration_at_ms } = event;

    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      this.logger.warn(`RevenueCat webhook for unknown user: ${firebaseUid}`);
      return;
    }

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'CONNOISSEUR',
            subscriptionExpiresAt: expiration_at_ms
              ? new Date(expiration_at_ms)
              : null,
          },
        });
        this.logger.log(`Subscription activated for user ${user.id}`);
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'FREE',
            subscriptionExpiresAt: null,
          },
        });
        this.logger.log(`Subscription expired for user ${user.id}`);
        break;

      case 'BILLING_ISSUE':
        this.logger.warn(`Billing issue for user ${user.id} — keeping tier until expiry`);
        break;

      default:
        this.logger.log(`Unhandled RevenueCat event type: ${type}`);
    }

    // Invalidate user cache
    await this.redis.del(`user:firebase:${firebaseUid}`);
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
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
  }
}
