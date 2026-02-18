import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { User, BinderCategory } from '@prisma/client';

const DEFAULT_BINDERS = [
  { name: 'My Restaurant Notes', category: BinderCategory.RESTAURANT },
  { name: 'My Wine Notes', category: BinderCategory.WINE },
  { name: 'My Spirit Notes', category: BinderCategory.SPIRIT },
  { name: 'My Winery Visits', category: BinderCategory.MIXED },
];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async register(idToken: string): Promise<User> {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    // Upsert user — idempotent
    const user = await this.prisma.user.upsert({
      where: { firebaseUid: uid },
      update: {
        email: email || '',
        displayName: name || email?.split('@')[0] || 'Gourmet',
        avatarUrl: picture || null,
      },
      create: {
        firebaseUid: uid,
        email: email || '',
        displayName: name || email?.split('@')[0] || 'Gourmet',
        avatarUrl: picture || null,
      },
    });

    // Create default binders if they don't exist
    const existingBinders = await this.prisma.binder.count({
      where: { ownerId: user.id, isDefault: true },
    });

    if (existingBinders === 0) {
      await this.prisma.binder.createMany({
        data: DEFAULT_BINDERS.map((b) => ({
          ownerId: user.id,
          name: b.name,
          category: b.category,
          isDefault: true,
        })),
      });
    }

    // Invalidate cache
    await this.redis.del(`user:firebase:${uid}`);

    this.logger.log(`User registered/updated: ${user.id} (${user.email})`);
    return user;
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
