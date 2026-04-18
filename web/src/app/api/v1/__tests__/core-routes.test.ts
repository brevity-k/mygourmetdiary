import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mock user ────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  supabaseId: 'sb-1',
  email: 'test@test.com',
  displayName: 'Test User',
  avatarUrl: null,
  subscriptionTier: 'FREE',
  subscriptionExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Mock middleware ──────────────────────────────────

vi.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: any) => (req: NextRequest) => handler(req, mockUser),
  withPremium: (handler: any) => (req: NextRequest) => handler(req, mockUser),
}));

// ─── Mock services ───────────────────────────────────

vi.mock('@/lib/api/services/notes.service', () => ({
  notesService: {
    clampLimit: vi.fn((limit?: number) => Math.min(Math.max(limit || 20, 1), 100)),
    feed: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/binders.service', () => ({
  bindersService: {
    findAllByOwner: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/users.service', () => ({
  usersService: {
    update: vi.fn(),
  },
  sanitizeUser: vi.fn((user: any) => {
    const { supabaseId, rcCustomerId, subscriptionExpiresAt, updatedAt, ...rest } = user;
    return rest;
  }),
}));

// ─── Import routes (after mocks) ─────────────────────

import { GET as notesGET, POST as notesPOST } from '../notes/route';
import { GET as bindersGET, POST as bindersPOST } from '../binders/route';
import { GET as usersMeGET, PATCH as usersMePATCH } from '../users/me/route';

import { notesService } from '@/lib/api/services/notes.service';
import { bindersService } from '@/lib/api/services/binders.service';
import { usersService } from '@/lib/api/services/users.service';

// ─── Helpers ─────────────────────────────────────────

function getReq(url: string) {
  return new NextRequest(url);
}

function postReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function patchReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Notes Routes ────────────────────────────────────

describe('GET /api/v1/notes', () => {
  const feedMock = notesService.feed as ReturnType<typeof vi.fn>;

  it('returns notes from feed with default pagination', async () => {
    const feedResult = {
      items: [{ id: 'note-1', title: 'Great ramen' }],
      hasMore: false,
      nextCursor: null,
    };
    feedMock.mockResolvedValueOnce(feedResult);

    const res = await notesGET(getReq('http://localhost/api/v1/notes'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual(feedResult);
    expect(feedMock).toHaveBeenCalledWith('user-1', undefined, 20, undefined, undefined);
  });

  it('passes cursor and limit query params to feed', async () => {
    feedMock.mockResolvedValueOnce({ items: [], hasMore: false, nextCursor: null });

    await notesGET(getReq('http://localhost/api/v1/notes?cursor=abc&limit=10'));
    expect(feedMock).toHaveBeenCalledWith('user-1', 'abc', 10, undefined, undefined);
  });

  it('passes type and binderId query params to feed', async () => {
    feedMock.mockResolvedValueOnce({ items: [], hasMore: false, nextCursor: null });

    await notesGET(getReq('http://localhost/api/v1/notes?type=WINE&binderId=b-1'));
    expect(feedMock).toHaveBeenCalledWith('user-1', undefined, 20, 'WINE', 'b-1');
  });

  it('rejects invalid note type with 400', async () => {
    const res = await notesGET(getReq('http://localhost/api/v1/notes?type=COCKTAIL'));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBe('Invalid note type');
    expect(feedMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/notes', () => {
  const createMock = notesService.create as ReturnType<typeof vi.fn>;

  const validNotePayload = {
    type: 'RESTAURANT' as const,
    title: 'Great ramen spot',
    binderId: 'binder-1',
    rating: 8,
    extension: { dishName: 'Tonkotsu', dishCategory: 'MAIN', wouldOrderAgain: true },
    experiencedAt: '2026-04-08',
  };

  it('creates note with valid data and returns 201', async () => {
    const createdNote = { id: 'note-new', ...validNotePayload };
    createMock.mockResolvedValueOnce(createdNote);

    const res = await notesPOST(postReq('http://localhost/api/v1/notes', validNotePayload));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data).toEqual(createdNote);
    expect(createMock).toHaveBeenCalledWith('user-1', expect.objectContaining({
      type: 'RESTAURANT',
      title: 'Great ramen spot',
      binderId: 'binder-1',
      rating: 8,
    }));
  });

  it('returns 400 for invalid input (missing required fields)', async () => {
    const res = await notesPOST(postReq('http://localhost/api/v1/notes', {
      title: 'No type or rating',
    }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 400 for rating out of range', async () => {
    const res = await notesPOST(postReq('http://localhost/api/v1/notes', {
      ...validNotePayload,
      rating: 0,
    }));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 400 when service throws "Invalid binder"', async () => {
    createMock.mockRejectedValueOnce(new Error('Invalid binder'));

    const res = await notesPOST(postReq('http://localhost/api/v1/notes', validNotePayload));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBe('Invalid binder');
  });

  it('returns 400 when service throws "Venue not found" error', async () => {
    createMock.mockRejectedValueOnce(new Error('Venue not found. Search for it first.'));

    const res = await notesPOST(postReq('http://localhost/api/v1/notes', validNotePayload));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBe('Venue not found. Search for it first.');
  });

  it('returns 500 for unexpected service errors', async () => {
    createMock.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await notesPOST(postReq('http://localhost/api/v1/notes', validNotePayload));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.message).toBe('Failed to create note');
  });
});

// ─── Binders Routes ──────────────────────────────────

describe('GET /api/v1/binders', () => {
  const findAllMock = bindersService.findAllByOwner as ReturnType<typeof vi.fn>;

  it('returns binders for current user', async () => {
    const binders = [
      { id: 'b-1', name: 'LA Restaurants', category: 'RESTAURANT', _count: { notes: 5 } },
      { id: 'b-2', name: 'Wine Collection', category: 'WINE', _count: { notes: 12 } },
    ];
    findAllMock.mockResolvedValueOnce(binders);

    const res = await bindersGET(getReq('http://localhost/api/v1/binders'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual(binders);
    expect(findAllMock).toHaveBeenCalledWith('user-1');
  });

  it('returns empty array when user has no binders', async () => {
    findAllMock.mockResolvedValueOnce([]);

    const res = await bindersGET(getReq('http://localhost/api/v1/binders'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});

describe('POST /api/v1/binders', () => {
  const createMock = bindersService.create as ReturnType<typeof vi.fn>;

  const validBinderPayload = {
    name: 'My Wine Binder',
    category: 'WINE' as const,
    description: 'All my wine notes',
  };

  it('creates binder with valid data and returns 201', async () => {
    const createdBinder = { id: 'b-new', ownerId: 'user-1', ...validBinderPayload };
    createMock.mockResolvedValueOnce(createdBinder);

    const res = await bindersPOST(postReq('http://localhost/api/v1/binders', validBinderPayload));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data).toEqual(createdBinder);
    expect(createMock).toHaveBeenCalledWith('user-1', expect.objectContaining({
      name: 'My Wine Binder',
      category: 'WINE',
    }));
  });

  it('returns 400 for missing required fields', async () => {
    const res = await bindersPOST(postReq('http://localhost/api/v1/binders', {
      description: 'no name or category',
    }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid category', async () => {
    const res = await bindersPOST(postReq('http://localhost/api/v1/binders', {
      name: 'Test',
      category: 'COCKTAIL',
    }));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 400 for name exceeding max length', async () => {
    const res = await bindersPOST(postReq('http://localhost/api/v1/binders', {
      name: 'x'.repeat(101),
      category: 'MIXED',
    }));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 500 for unexpected service errors', async () => {
    createMock.mockRejectedValueOnce(new Error('DB error'));

    const res = await bindersPOST(postReq('http://localhost/api/v1/binders', validBinderPayload));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.message).toBe('Failed to create binder');
  });
});

// ─── Users/me Routes ─────────────────────────────────

describe('GET /api/v1/users/me', () => {
  it('returns sanitized current user', async () => {
    const res = await usersMeGET(getReq('http://localhost/api/v1/users/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    // sanitizeUser strips supabaseId, subscriptionExpiresAt, updatedAt
    expect(body.data).toHaveProperty('id', 'user-1');
    expect(body.data).toHaveProperty('email', 'test@test.com');
    expect(body.data).toHaveProperty('displayName', 'Test User');
    expect(body.data).not.toHaveProperty('supabaseId');
    expect(body.data).not.toHaveProperty('subscriptionExpiresAt');
    expect(body.data).not.toHaveProperty('updatedAt');
  });
});

describe('PATCH /api/v1/users/me', () => {
  const updateMock = usersService.update as ReturnType<typeof vi.fn>;

  it('updates user with valid displayName', async () => {
    const updatedUser = { ...mockUser, displayName: 'New Name' };
    updateMock.mockResolvedValueOnce(updatedUser);

    const res = await usersMePATCH(patchReq('http://localhost/api/v1/users/me', {
      displayName: 'New Name',
    }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveProperty('displayName', 'New Name');
    expect(body.data).not.toHaveProperty('supabaseId');
    expect(updateMock).toHaveBeenCalledWith('user-1', { displayName: 'New Name' });
  });

  it('updates user with valid avatarUrl', async () => {
    const updatedUser = { ...mockUser, avatarUrl: 'https://example.com/avatar.png' };
    updateMock.mockResolvedValueOnce(updatedUser);

    const res = await usersMePATCH(patchReq('http://localhost/api/v1/users/me', {
      avatarUrl: 'https://example.com/avatar.png',
    }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveProperty('avatarUrl', 'https://example.com/avatar.png');
  });

  it('returns 400 for invalid input (displayName too long)', async () => {
    const res = await usersMePATCH(patchReq('http://localhost/api/v1/users/me', {
      displayName: 'x'.repeat(51),
    }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid avatarUrl (not a URL)', async () => {
    const res = await usersMePATCH(patchReq('http://localhost/api/v1/users/me', {
      avatarUrl: 'not-a-url',
    }));
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns 500 for unexpected service errors', async () => {
    updateMock.mockRejectedValueOnce(new Error('DB error'));

    const res = await usersMePATCH(patchReq('http://localhost/api/v1/users/me', {
      displayName: 'Fail',
    }));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.message).toBe('Failed to update user');
  });
});
