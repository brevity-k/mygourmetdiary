import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './setup/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Notes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let binderId: string;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.moduleRef.get<PrismaService>(PrismaService);

    // Register a test user
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('Authorization', 'Bearer dev:e2e-notes-user1');
    userId = res.body.data.id;

    // Get default restaurant binder
    const binders = await prisma.binder.findMany({
      where: { ownerId: userId, name: 'My Restaurant Notes' },
    });
    binderId = binders[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.note.deleteMany({
      where: { author: { firebaseUid: { startsWith: 'e2e-notes-' } } },
    });
    await prisma.binder.deleteMany({
      where: { owner: { firebaseUid: { startsWith: 'e2e-notes-' } } },
    });
    await prisma.user.deleteMany({
      where: { firebaseUid: { startsWith: 'e2e-notes-' } },
    });
    await app.close();
  });

  const token = 'Bearer dev:e2e-notes-user1';

  it('POST /api/v1/notes creates a note', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', token)
      .send({
        type: 'RESTAURANT',
        title: 'Amazing Ramen',
        binderId,
        rating: 9,
        extension: {
          dishName: 'Tonkotsu Ramen',
          dishCategory: 'MAIN',
          wouldOrderAgain: true,
        },
        experiencedAt: '2026-02-01',
        visibility: 'PUBLIC',
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Amazing Ramen');
    expect(res.body.data.rating).toBe(9);
  });

  it('GET /api/v1/notes/feed returns user notes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/notes/feed')
      .set('Authorization', token)
      .expect(200);

    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/notes/:id returns specific note', async () => {
    // Create a note first
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', token)
      .send({
        type: 'RESTAURANT',
        title: 'Test Get By Id',
        binderId,
        rating: 7,
        extension: {
          dishName: 'Sushi',
          dishCategory: 'MAIN',
          wouldOrderAgain: false,
        },
        experiencedAt: '2026-02-01',
      });

    const noteId = createRes.body.data.id;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/notes/${noteId}`)
      .set('Authorization', token)
      .expect(200);

    expect(res.body.data.id).toBe(noteId);
    expect(res.body.data.title).toBe('Test Get By Id');
  });

  it('PATCH /api/v1/notes/:id updates a note', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', token)
      .send({
        type: 'RESTAURANT',
        title: 'Before Update',
        binderId,
        rating: 6,
        extension: {
          dishName: 'Pasta',
          dishCategory: 'MAIN',
          wouldOrderAgain: true,
        },
        experiencedAt: '2026-02-01',
      });

    const noteId = createRes.body.data.id;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/notes/${noteId}`)
      .set('Authorization', token)
      .send({ title: 'After Update', rating: 8 })
      .expect(200);

    expect(res.body.data.title).toBe('After Update');
    expect(res.body.data.rating).toBe(8);
  });

  it('DELETE /api/v1/notes/:id deletes a note', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', token)
      .send({
        type: 'RESTAURANT',
        title: 'To Delete',
        binderId,
        rating: 5,
        extension: {
          dishName: 'Salad',
          dishCategory: 'APPETIZER',
          wouldOrderAgain: false,
        },
        experiencedAt: '2026-02-01',
      });

    const noteId = createRes.body.data.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/notes/${noteId}`)
      .set('Authorization', token)
      .expect(204);

    // Verify note is gone
    await request(app.getHttpServer())
      .get(`/api/v1/notes/${noteId}`)
      .set('Authorization', token)
      .expect(404);
  });

  it('POST /api/v1/notes rejects missing required fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', token)
      .send({
        title: 'Missing type and other fields',
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  it('POST /api/v1/notes rejects invalid rating', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', token)
      .send({
        type: 'RESTAURANT',
        title: 'Bad Rating',
        binderId,
        rating: 15,
        extension: {
          dishName: 'Something',
          dishCategory: 'MAIN',
          wouldOrderAgain: true,
        },
        experiencedAt: '2026-02-01',
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  it('response has { data, statusCode, timestamp } wrapper', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/notes/feed')
      .set('Authorization', token)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('timestamp');
  });
});
