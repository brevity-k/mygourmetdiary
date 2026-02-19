jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import * as admin from 'firebase-admin';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let redis: any;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      binder: {
        count: jest.fn(),
        createMany: jest.fn(),
      },
    };

    redis = {
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  // --- Dev bypass: existing user ---

  it('registers existing user via dev bypass without calling Firebase', async () => {
    process.env.NODE_ENV = 'development';
    const existingUser = {
      id: 'u1',
      firebaseUid: 'dev-uid-1',
      email: 'alice@test.com',
      displayName: 'Alice',
    };
    prisma.user.findUnique.mockResolvedValue(existingUser);
    prisma.user.upsert.mockResolvedValue(existingUser);
    prisma.binder.count.mockResolvedValue(4);

    const result = await service.register('dev:dev-uid-1');

    expect(result).toEqual(existingUser);
    expect(admin.auth).not.toHaveBeenCalled();
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { firebaseUid: 'dev-uid-1' },
      }),
    );
  });

  // --- Dev bypass: new user ---

  it('registers new user via dev bypass with default values', async () => {
    process.env.NODE_ENV = 'development';
    prisma.user.findUnique.mockResolvedValue(null);
    const newUser = {
      id: 'u-new',
      firebaseUid: 'dev-uid-2',
      email: 'dev-uid-2@gourmet.local',
      displayName: 'Dev User',
    };
    prisma.user.upsert.mockResolvedValue(newUser);
    prisma.binder.count.mockResolvedValue(0);
    prisma.binder.createMany.mockResolvedValue({ count: 4 });

    const result = await service.register('dev:dev-uid-2');

    expect(result).toEqual(newUser);
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          email: 'dev-uid-2@gourmet.local',
          displayName: 'Dev User',
        }),
      }),
    );
  });

  // --- Firebase path ---

  it('registers user via Firebase verifyIdToken', async () => {
    process.env.NODE_ENV = 'production';
    const mockVerify = jest.fn().mockResolvedValue({
      uid: 'firebase-uid-1',
      email: 'user@example.com',
      name: 'Real User',
      picture: 'https://example.com/avatar.jpg',
    });
    (admin.auth as jest.Mock).mockReturnValue({ verifyIdToken: mockVerify });

    const user = {
      id: 'u1',
      firebaseUid: 'firebase-uid-1',
      email: 'user@example.com',
      displayName: 'Real User',
    };
    prisma.user.upsert.mockResolvedValue(user);
    prisma.binder.count.mockResolvedValue(4);

    const result = await service.register('real-firebase-token');

    expect(result).toEqual(user);
    expect(mockVerify).toHaveBeenCalledWith('real-firebase-token');
  });

  // --- Default binder creation: new user ---

  it('creates 4 default binders for new user', async () => {
    process.env.NODE_ENV = 'development';
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockResolvedValue({ id: 'u1', firebaseUid: 'uid1' });
    prisma.binder.count.mockResolvedValue(0);
    prisma.binder.createMany.mockResolvedValue({ count: 4 });

    await service.register('dev:uid1');

    expect(prisma.binder.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ name: 'My Restaurant Notes', isDefault: true }),
        expect.objectContaining({ name: 'My Wine Notes', isDefault: true }),
        expect.objectContaining({ name: 'My Spirit Notes', isDefault: true }),
        expect.objectContaining({ name: 'My Winery Visits', isDefault: true }),
      ]),
    });
  });

  // --- Default binder creation: existing binders ---

  it('skips binder creation when default binders already exist', async () => {
    process.env.NODE_ENV = 'development';
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockResolvedValue({ id: 'u1', firebaseUid: 'uid1' });
    prisma.binder.count.mockResolvedValue(4);

    await service.register('dev:uid1');

    expect(prisma.binder.createMany).not.toHaveBeenCalled();
  });

  // --- Cache invalidation ---

  it('invalidates Redis cache on register', async () => {
    process.env.NODE_ENV = 'development';
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockResolvedValue({ id: 'u1', firebaseUid: 'uid1' });
    prisma.binder.count.mockResolvedValue(4);

    await service.register('dev:uid1');

    expect(redis.del).toHaveBeenCalledWith('user:firebase:uid1');
  });

  // --- getProfile ---

  it('returns user profile by id', async () => {
    const user = { id: 'u1', email: 'test@test.com', displayName: 'Tester' };
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.getProfile('u1');
    expect(result).toEqual(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
    });
  });

  it('returns null for unknown user profile', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await service.getProfile('missing');
    expect(result).toBeNull();
  });

  // --- displayName fallback ---

  it('falls back to email prefix when name is undefined', async () => {
    process.env.NODE_ENV = 'production';
    const mockVerify = jest.fn().mockResolvedValue({
      uid: 'fb-uid',
      email: 'hello@world.com',
      name: undefined,
      picture: undefined,
    });
    (admin.auth as jest.Mock).mockReturnValue({ verifyIdToken: mockVerify });

    prisma.user.upsert.mockResolvedValue({ id: 'u1' });
    prisma.binder.count.mockResolvedValue(4);

    await service.register('token');

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          displayName: 'hello',
        }),
      }),
    );
  });
});
