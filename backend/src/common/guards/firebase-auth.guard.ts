import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      // Dev bypass: Bearer dev:<firebaseUid>
      let firebaseUid: string;
      if (process.env.NODE_ENV === 'development' && token.startsWith('dev:')) {
        firebaseUid = token.substring(4);
      } else {
        const decoded = await admin.auth().verifyIdToken(token);
        firebaseUid = decoded.uid;
      }

      // Check Redis cache first
      const cacheKey = `user:firebase:${firebaseUid}`;
      const cached = await this.redis.getJson(cacheKey);
      if (cached) {
        request.user = cached;
        return true;
      }

      // Fetch from DB
      const user = await this.prisma.user.findUnique({
        where: { firebaseUid },
      });

      if (!user) {
        throw new UnauthorizedException('User not registered. Call POST /api/v1/auth/register first.');
      }

      // Cache for 1 hour
      await this.redis.setJson(cacheKey, user, 3600);
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Firebase token verification failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
