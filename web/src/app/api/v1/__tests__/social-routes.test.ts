import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/* ------------------------------------------------------------------ */
/*  Mock user injected by the withAuth bypass                         */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Middleware mock — bypass auth, inject mockUser                     */
/* ------------------------------------------------------------------ */
vi.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: any) => (req: NextRequest) => handler(req, mockUser),
}));

/* ------------------------------------------------------------------ */
/*  Service mocks                                                     */
/* ------------------------------------------------------------------ */
vi.mock('@/lib/api/services/social/signals.service', () => ({
  signalsService: {
    getSignalSummary: vi.fn(),
    sendSignal: vi.fn(),
    removeSignal: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/tags.service', () => ({
  tagsService: {
    findAll: vi.fn(),
  },
}));

vi.mock('@/lib/api/services/community-stats.service', () => ({
  communityStatsService: {
    getStats: vi.fn(),
  },
}));

vi.mock('@/lib/api/clients/prisma', () => ({
  prisma: {
    venue: { findUnique: vi.fn() },
    product: { findUnique: vi.fn() },
  },
}));

/* ------------------------------------------------------------------ */
/*  Imports (must come after vi.mock calls)                           */
/* ------------------------------------------------------------------ */
import { GET as signalsGET, POST as signalsPOST, DELETE as signalsDELETE } from '../social/signals/route';
import { GET as tagsGET } from '../tags/route';
import { GET as communityStatsGET } from '../community/[subjectType]/[subjectId]/stats/route';
import { signalsService } from '@/lib/api/services/social/signals.service';
import { tagsService } from '@/lib/api/services/tags.service';
import { communityStatsService } from '@/lib/api/services/community-stats.service';
import { prisma } from '@/lib/api/clients/prisma';

/* ------------------------------------------------------------------ */
/*  Typed mocks for convenience                                       */
/* ------------------------------------------------------------------ */
const mockGetSignalSummary = signalsService.getSignalSummary as ReturnType<typeof vi.fn>;
const mockSendSignal = signalsService.sendSignal as ReturnType<typeof vi.fn>;
const mockRemoveSignal = signalsService.removeSignal as ReturnType<typeof vi.fn>;
const mockFindAllTags = tagsService.findAll as ReturnType<typeof vi.fn>;
const mockGetStats = communityStatsService.getStats as ReturnType<typeof vi.fn>;
const mockVenueFindUnique = prisma.venue.findUnique as ReturnType<typeof vi.fn>;
const mockProductFindUnique = prisma.product.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

/* ================================================================== */
/*  Signals — GET /api/v1/social/signals?noteId=…                     */
/* ================================================================== */
describe('GET /api/v1/social/signals', () => {
  it('returns 400 when noteId is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/social/signals');
    const res = await signalsGET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('noteId is required');
  });

  it('returns signal summary for a valid noteId', async () => {
    const summary = {
      bookmarkCount: 3,
      echoCount: 1,
      divergeCount: 0,
      mySignals: ['BOOKMARKED'],
    };
    mockGetSignalSummary.mockResolvedValueOnce(summary);

    const req = new NextRequest('http://localhost/api/v1/social/signals?noteId=note-1');
    const res = await signalsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(summary);
    expect(mockGetSignalSummary).toHaveBeenCalledWith('note-1', 'user-1');
  });
});

/* ================================================================== */
/*  Signals — POST /api/v1/social/signals                             */
/* ================================================================== */
describe('POST /api/v1/social/signals', () => {
  function postReq(body: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/v1/social/signals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('creates a signal with valid data (201)', async () => {
    const created = { id: 'sig-1', senderId: 'user-1', noteId: 'note-1', signalType: 'BOOKMARKED' };
    mockSendSignal.mockResolvedValueOnce(created);

    const res = await signalsPOST(postReq({ noteId: 'note-1', signalType: 'BOOKMARKED' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual(created);
    expect(mockSendSignal).toHaveBeenCalledWith('user-1', 'note-1', {
      signalType: 'BOOKMARKED',
      senderRating: undefined,
    });
  });

  it('returns 400 when noteId is missing', async () => {
    const res = await signalsPOST(postReq({ signalType: 'BOOKMARKED' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('noteId is required');
  });

  it('returns 404 for "Note not found" error', async () => {
    mockSendSignal.mockRejectedValueOnce(new Error('Note not found'));

    const res = await signalsPOST(postReq({ noteId: 'missing', signalType: 'BOOKMARKED' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe('Note not found');
  });

  it('returns 403 for "Cannot signal a private note"', async () => {
    mockSendSignal.mockRejectedValueOnce(new Error('Cannot signal a private note'));

    const res = await signalsPOST(postReq({ noteId: 'note-priv', signalType: 'ECHOED', senderRating: 8 }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe('Cannot signal a private note');
  });

  it('returns 400 for "Cannot signal your own note"', async () => {
    mockSendSignal.mockRejectedValueOnce(new Error('Cannot signal your own note'));

    const res = await signalsPOST(postReq({ noteId: 'note-own', signalType: 'DIVERGED', senderRating: 5 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('Cannot signal your own note');
  });
});

/* ================================================================== */
/*  Signals — DELETE /api/v1/social/signals?noteId=…&signalType=…     */
/* ================================================================== */
describe('DELETE /api/v1/social/signals', () => {
  it('returns 204 on successful delete', async () => {
    mockRemoveSignal.mockResolvedValueOnce(undefined);

    const req = new NextRequest(
      'http://localhost/api/v1/social/signals?noteId=note-1&signalType=BOOKMARKED',
      { method: 'DELETE' },
    );
    const res = await signalsDELETE(req);
    expect(res.status).toBe(204);
    expect(mockRemoveSignal).toHaveBeenCalledWith('user-1', 'note-1', 'BOOKMARKED');
  });

  it('returns 400 when noteId is missing', async () => {
    const req = new NextRequest(
      'http://localhost/api/v1/social/signals?signalType=BOOKMARKED',
      { method: 'DELETE' },
    );
    const res = await signalsDELETE(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('noteId and signalType are required');
  });

  it('returns 400 when signalType is missing', async () => {
    const req = new NextRequest(
      'http://localhost/api/v1/social/signals?noteId=note-1',
      { method: 'DELETE' },
    );
    const res = await signalsDELETE(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('noteId and signalType are required');
  });

  it('returns 400 for invalid signal type', async () => {
    const req = new NextRequest(
      'http://localhost/api/v1/social/signals?noteId=note-1&signalType=INVALID',
      { method: 'DELETE' },
    );
    const res = await signalsDELETE(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('Invalid signal type');
  });
});

/* ================================================================== */
/*  Tags — GET /api/v1/tags                                           */
/* ================================================================== */
describe('GET /api/v1/tags', () => {
  const sampleTags = [
    { id: 't1', name: 'Sushi', category: 'RESTAURANT', group: 'Japanese' },
    { id: 't2', name: 'Pinot Noir', category: 'WINE', group: 'Red' },
  ];

  it('returns tags with no filter', async () => {
    mockFindAllTags.mockResolvedValueOnce(sampleTags);

    const req = new NextRequest('http://localhost/api/v1/tags');
    const res = await tagsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(sampleTags);
    expect(mockFindAllTags).toHaveBeenCalledWith(undefined, undefined);
  });

  it('returns empty array for invalid category', async () => {
    const req = new NextRequest('http://localhost/api/v1/tags?category=INVALID');
    const res = await tagsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    // Service should NOT be called for invalid category
    expect(mockFindAllTags).not.toHaveBeenCalled();
  });

  it('filters by category param', async () => {
    const wineTags = [{ id: 't2', name: 'Pinot Noir', category: 'WINE', group: 'Red' }];
    mockFindAllTags.mockResolvedValueOnce(wineTags);

    const req = new NextRequest('http://localhost/api/v1/tags?category=WINE');
    const res = await tagsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(wineTags);
    expect(mockFindAllTags).toHaveBeenCalledWith('WINE', undefined);
  });

  it('filters by category and group params', async () => {
    const filtered = [{ id: 't1', name: 'Sushi', category: 'RESTAURANT', group: 'Japanese' }];
    mockFindAllTags.mockResolvedValueOnce(filtered);

    const req = new NextRequest('http://localhost/api/v1/tags?category=RESTAURANT&group=Japanese');
    const res = await tagsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(filtered);
    expect(mockFindAllTags).toHaveBeenCalledWith('RESTAURANT', 'Japanese');
  });
});

/* ================================================================== */
/*  Community Stats — GET /api/v1/community/:subjectType/:subjectId/stats */
/* ================================================================== */
describe('GET /api/v1/community/[subjectType]/[subjectId]/stats', () => {
  // The route extracts params from req.nextUrl.pathname using split('/'),
  // so we construct a realistic URL path.

  const venueStats = {
    subjectType: 'venue',
    subjectId: 'venue-1',
    totalNotes: 10,
    totalGourmets: 3,
    avgRating: 8.2,
    ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 1, '8': 5, '9': 3, '10': 1 },
  };

  it('returns stats for a valid venue', async () => {
    mockVenueFindUnique.mockResolvedValueOnce({ id: 'venue-1', name: 'Test Venue' });
    mockGetStats.mockResolvedValueOnce(venueStats);

    const req = new NextRequest('http://localhost/api/v1/community/venue/venue-1/stats');
    const res = await communityStatsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(venueStats);
    expect(mockGetStats).toHaveBeenCalledWith('venue', 'venue-1', 'venueId', 'user-1');
  });

  it('returns stats for a valid product', async () => {
    const productStats = { ...venueStats, subjectType: 'product', subjectId: 'prod-1' };
    mockProductFindUnique.mockResolvedValueOnce({ id: 'prod-1', name: 'Test Product' });
    mockGetStats.mockResolvedValueOnce(productStats);

    const req = new NextRequest('http://localhost/api/v1/community/product/prod-1/stats');
    const res = await communityStatsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(productStats);
    expect(mockGetStats).toHaveBeenCalledWith('product', 'prod-1', 'productId', 'user-1');
  });

  it('returns 400 for invalid subject type', async () => {
    const req = new NextRequest('http://localhost/api/v1/community/invalid/id-1/stats');
    const res = await communityStatsGET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('Invalid subject type. Use "venue" or "product".');
  });

  it('returns 404 when venue not found', async () => {
    mockVenueFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/v1/community/venue/missing-id/stats');
    const res = await communityStatsGET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe('Venue not found');
  });

  it('returns 404 when product not found', async () => {
    mockProductFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/v1/community/product/missing-id/stats');
    const res = await communityStatsGET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe('Product not found');
  });
});
