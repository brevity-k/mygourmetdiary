jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: [],
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { RedisService } from '../../src/redis/redis.service';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

// In-memory Redis mock
class InMemoryRedisService {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async getJson<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const entry: { value: string; expiresAt?: number } = {
      value: JSON.stringify(value),
    };
    if (ttlSeconds) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
    this.store.set(key, entry);
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  // ioredis methods used by the guard
  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, _mode?: string, _ttl?: number): Promise<void> {
    const entry: { value: string; expiresAt?: number } = { value };
    if (_mode === 'EX' && _ttl) {
      entry.expiresAt = Date.now() + _ttl * 1000;
    }
    this.store.set(key, entry);
  }

  async quit(): Promise<void> {}
  async connect(): Promise<void> {}
}

export async function createTestApp(): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
}> {
  process.env.NODE_ENV = 'development';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RedisService)
    .useClass(InMemoryRedisService)
    .compile();

  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();

  return { app, moduleRef };
}
