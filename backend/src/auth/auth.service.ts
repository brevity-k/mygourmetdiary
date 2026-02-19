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
    let uid: string;
    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    // Dev bypass: token format is `dev:<firebaseUid>`
    if (process.env.NODE_ENV === 'development' && idToken.startsWith('dev:')) {
      uid = idToken.substring(4);
      // Look up existing user data if available
      const existing = await this.prisma.user.findUnique({
        where: { firebaseUid: uid },
      });
      email = existing?.email || `${uid}@gourmet.local`;
      name = existing?.displayName || 'Dev User';
    } else {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
      email = decoded.email;
      name = decoded.name;
      picture = decoded.picture;
    }

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
