import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('./clients/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { withAuth, withPremium, withCron } from './middleware';
import { prisma } from './clients/prisma';

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('withAuth', () => {
  const handler = vi.fn(async () => new Response('ok'));

  it('returns 401 when no Authorization header', async () => {
    const req = new NextRequest('http://localhost/api/test');
    const wrapped = withAuth(handler);
    const res = await wrapped(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Unauthorized');
  });

  it('returns 401 when Supabase auth fails', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token'),
    });
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer bad-token' },
    });
    const res = await withAuth(handler)(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found in DB', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'supabase-uid' } },
      error: null,
    });
    mockFindUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    });
    const res = await withAuth(handler)(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe('User not found');
  });

  it('calls handler with user when auth succeeds', async () => {
    const dbUser = { id: 'db-1', supabaseId: 'supabase-uid', subscriptionTier: 'FREE' };
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'supabase-uid' } },
      error: null,
    });
    mockFindUnique.mockResolvedValueOnce(dbUser);
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    });
    await withAuth(handler)(req);
    expect(handler).toHaveBeenCalledWith(req, dbUser);
  });

  it('returns 500 on unexpected errors', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('connection lost'));
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    });
    const res = await withAuth(handler)(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toBe('Internal server error');
  });
});

describe('withPremium', () => {
  const handler = vi.fn(async () => new Response('ok'));

  it('returns 403 for FREE tier users', async () => {
    const dbUser = { id: 'db-1', supabaseId: 'supabase-uid', subscriptionTier: 'FREE' };
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'supabase-uid' } },
      error: null,
    });
    mockFindUnique.mockResolvedValueOnce(dbUser);
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    });
    const res = await withPremium(handler)(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe('Premium subscription required');
  });

  it('passes through for CONNOISSEUR users', async () => {
    const dbUser = { id: 'db-1', supabaseId: 'supabase-uid', subscriptionTier: 'CONNOISSEUR' };
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'supabase-uid' } },
      error: null,
    });
    mockFindUnique.mockResolvedValueOnce(dbUser);
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    });
    await withPremium(handler)(req);
    expect(handler).toHaveBeenCalledWith(expect.any(NextRequest), dbUser);
  });
});

describe('withCron', () => {
  const handler = vi.fn(async () => new Response('ok'));

  beforeEach(() => {
    process.env.CRON_SECRET = 'my-cron-secret';
  });

  it('returns 401 when wrong secret', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await withCron(handler)(req);
    expect(res.status).toBe(401);
  });

  it('calls handler when secret matches', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer my-cron-secret' },
    });
    await withCron(handler)(req);
    expect(handler).toHaveBeenCalledWith(req);
  });
});
