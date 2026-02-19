import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './setup/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.binder.deleteMany({
      where: { owner: { firebaseUid: { startsWith: 'e2e-auth-' } } },
    });
    await prisma.user.deleteMany({
      where: { firebaseUid: { startsWith: 'e2e-auth-' } },
    });
    await app.close();
  });

  it('POST /api/v1/auth/register creates user with 4 default binders', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('Authorization', 'Bearer dev:e2e-auth-user1')
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.firebaseUid).toBe('e2e-auth-user1');

    // Verify 4 default binders
    const binders = await prisma.binder.findMany({
      where: { ownerId: res.body.data.id, isDefault: true },
    });
    expect(binders).toHaveLength(4);
  });

  it('POST /api/v1/auth/register is idempotent', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('Authorization', 'Bearer dev:e2e-auth-user1')
      .expect(201);

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('Authorization', 'Bearer dev:e2e-auth-user1')
      .expect(201);

    expect(res1.body.data.id).toBe(res2.body.data.id);

    // Still only 4 default binders (not 8)
    const binders = await prisma.binder.findMany({
      where: { ownerId: res1.body.data.id, isDefault: true },
    });
    expect(binders).toHaveLength(4);
  });

  it('GET /api/v1/auth/me returns current user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer dev:e2e-auth-user1')
      .expect(200);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data).toHaveProperty('displayName');
  });

  it('GET /api/v1/auth/me returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('GET /api/v1/auth/me returns 401 with invalid token format', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'InvalidFormat')
      .expect(401);
  });
});
