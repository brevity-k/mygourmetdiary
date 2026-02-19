import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotesSearchService } from './notes.search.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PioneersService } from '../pioneers/pioneers.service';

const makeNote = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  authorId: 'u1',
  binderId: 'b1',
  type: 'RESTAURANT',
  title: 'Great Ramen',
  rating: 8,
  freeText: null,
  visibility: 'PUBLIC',
  tagIds: [],
  extension: { dishName: 'Tonkotsu' },
  venueId: null,
  photos: [],
  venue: null,
  createdAt: new Date('2026-01-15'),
  ...overrides,
});

describe('NotesService', () => {
  let service: NotesService;
  let prisma: any;
  let searchService: any;
  let notificationsService: any;
  let pioneersService: any;

  beforeEach(async () => {
    prisma = {
      note: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      binder: {
        findUnique: jest.fn(),
      },
      venue: {
        findUnique: jest.fn(),
      },
      photo: {
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      binderFollow: {
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    searchService = {
      indexNote: jest.fn().mockResolvedValue(undefined),
      removeNote: jest.fn().mockResolvedValue(undefined),
    };

    notificationsService = {
      notifyNewNoteInBinder: jest.fn().mockResolvedValue(undefined),
    };

    pioneersService = {
      checkAndAwardPioneerBadge: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotesSearchService, useValue: searchService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: PioneersService, useValue: pioneersService },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── feed ──────────────────────────────────────────────

  it('returns paginated feed for user', async () => {
    const notes = Array.from({ length: 3 }, (_, i) =>
      makeNote({ id: `n${i}`, createdAt: new Date(`2026-01-${15 - i}`) }),
    );
    prisma.note.findMany.mockResolvedValue(notes);

    const result = await service.feed('u1', undefined, 20);

    expect(result.items).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('detects hasMore when results exceed limit', async () => {
    const notes = Array.from({ length: 3 }, (_, i) =>
      makeNote({ id: `n${i}`, createdAt: new Date(`2026-01-${15 - i}`) }),
    );
    prisma.note.findMany.mockResolvedValue(notes);

    const result = await service.feed('u1', undefined, 2);

    expect(result.items).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
  });

  it('applies cursor filter when provided', async () => {
    prisma.note.findMany.mockResolvedValue([]);
    const cursor = '2026-01-10T00:00:00.000Z';

    await service.feed('u1', cursor, 20);

    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { lt: new Date(cursor) },
        }),
      }),
    );
  });

  it('applies type filter when provided', async () => {
    prisma.note.findMany.mockResolvedValue([]);

    await service.feed('u1', undefined, 20, 'WINE' as any);

    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'WINE' }),
      }),
    );
  });

  // ─── findById ──────────────────────────────────────────

  it('returns note when found and owned by user', async () => {
    const note = makeNote();
    prisma.note.findUnique.mockResolvedValue(note);

    const result = await service.findById('n1', 'u1');
    expect(result).toEqual(note);
  });

  it('throws NotFoundException when note not found', async () => {
    prisma.note.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException for private note of another user', async () => {
    prisma.note.findUnique.mockResolvedValue(
      makeNote({ authorId: 'other-user', visibility: 'PRIVATE' }),
    );

    await expect(service.findById('n1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access to public note from another user', async () => {
    const note = makeNote({ authorId: 'other-user', visibility: 'PUBLIC' });
    prisma.note.findUnique.mockResolvedValue(note);

    const result = await service.findById('n1', 'u1');
    expect(result).toEqual(note);
  });

  // ─── create ────────────────────────────────────────────

  it('throws BadRequestException for invalid binder', async () => {
    prisma.binder.findUnique.mockResolvedValue(null);

    await expect(
      service.create('u1', {
        type: 'RESTAURANT' as any,
        title: 'Test',
        binderId: 'bad-binder',
        rating: 8,
        extension: { dishName: 'Test', dishCategory: 'MAIN', wouldOrderAgain: true },
        experiencedAt: '2026-01-15',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when binder belongs to another user', async () => {
    prisma.binder.findUnique.mockResolvedValue({ id: 'b1', ownerId: 'other-user' });

    await expect(
      service.create('u1', {
        type: 'RESTAURANT' as any,
        title: 'Test',
        binderId: 'b1',
        rating: 8,
        extension: { dishName: 'Test', dishCategory: 'MAIN', wouldOrderAgain: true },
        experiencedAt: '2026-01-15',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates note with venue resolution for RESTAURANT type', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'u1',
      visibility: 'PUBLIC',
      name: 'My Restaurant Notes',
    });
    prisma.venue.findUnique.mockResolvedValue({ id: 'v-internal', placeId: 'place-123' });
    const created = makeNote({ venueId: 'v-internal' });
    prisma.note.create.mockResolvedValue(created);
    prisma.note.findUnique.mockResolvedValue(created);
    prisma.user.findUnique.mockResolvedValue({ displayName: 'Alice' });

    const result = await service.create('u1', {
      type: 'RESTAURANT' as any,
      title: 'Great Ramen',
      binderId: 'b1',
      rating: 8,
      extension: { dishName: 'Tonkotsu', dishCategory: 'MAIN', wouldOrderAgain: true },
      venueId: 'place-123',
      experiencedAt: '2026-01-15',
    });

    expect(result).toEqual(created);
    expect(prisma.note.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          venueId: 'v-internal',
        }),
      }),
    );
  });

  it('fires search indexing after create', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'u1',
      visibility: 'PRIVATE',
      name: 'Private Binder',
    });
    const created = makeNote({ visibility: 'PRIVATE' });
    prisma.note.create.mockResolvedValue(created);
    prisma.note.findUnique.mockResolvedValue(created);

    await service.create('u1', {
      type: 'RESTAURANT' as any,
      title: 'Test',
      binderId: 'b1',
      rating: 7,
      extension: { dishName: 'Test', dishCategory: 'MAIN', wouldOrderAgain: true },
      experiencedAt: '2026-01-15',
      visibility: 'PRIVATE' as any,
    });

    expect(searchService.indexNote).toHaveBeenCalled();
  });

  it('notifies binder followers for public notes', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'u1',
      visibility: 'PUBLIC',
      name: 'My Binder',
    });
    const created = makeNote({ visibility: 'PUBLIC' });
    prisma.note.create.mockResolvedValue(created);
    prisma.note.findUnique.mockResolvedValue(created);
    prisma.user.findUnique.mockResolvedValue({ displayName: 'Alice' });

    await service.create('u1', {
      type: 'RESTAURANT' as any,
      title: 'Test',
      binderId: 'b1',
      rating: 8,
      extension: { dishName: 'Test', dishCategory: 'MAIN', wouldOrderAgain: true },
      experiencedAt: '2026-01-15',
      visibility: 'PUBLIC' as any,
    });

    expect(notificationsService.notifyNewNoteInBinder).toHaveBeenCalledWith(
      'Alice',
      'My Binder',
      'b1',
      'u1',
    );
  });

  it('skips notifications for private notes', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'u1',
      visibility: 'PRIVATE',
      name: 'Private',
    });
    const created = makeNote({ visibility: 'PRIVATE' });
    prisma.note.create.mockResolvedValue(created);
    prisma.note.findUnique.mockResolvedValue(created);

    await service.create('u1', {
      type: 'RESTAURANT' as any,
      title: 'Test',
      binderId: 'b1',
      rating: 7,
      extension: { dishName: 'Test', dishCategory: 'MAIN', wouldOrderAgain: true },
      experiencedAt: '2026-01-15',
      visibility: 'PRIVATE' as any,
    });

    expect(notificationsService.notifyNewNoteInBinder).not.toHaveBeenCalled();
  });

  it('attaches photos during create when photoIds provided', async () => {
    prisma.binder.findUnique.mockResolvedValue({
      id: 'b1',
      ownerId: 'u1',
      visibility: 'PRIVATE',
      name: 'Binder',
    });
    const created = makeNote();
    prisma.note.create.mockResolvedValue(created);
    prisma.note.findUnique.mockResolvedValue(created);

    await service.create('u1', {
      type: 'RESTAURANT' as any,
      title: 'Test',
      binderId: 'b1',
      rating: 8,
      extension: { dishName: 'Test', dishCategory: 'MAIN', wouldOrderAgain: true },
      experiencedAt: '2026-01-15',
      visibility: 'PRIVATE' as any,
      photoIds: ['p1', 'p2'],
    });

    expect(prisma.photo.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['p1', 'p2'] },
        uploaderId: 'u1',
        noteId: null,
      },
      data: { noteId: 'n1' },
    });
  });

  // ─── update ────────────────────────────────────────────

  it('throws ForbiddenException when updating another users note', async () => {
    prisma.note.findUnique.mockResolvedValue(
      makeNote({ authorId: 'other-user', visibility: 'PUBLIC' }),
    );

    await expect(
      service.update('n1', 'u1', { title: 'New Title' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('validates binder ownership on binder change during update', async () => {
    prisma.note.findUnique.mockResolvedValue(makeNote());
    prisma.binder.findUnique.mockResolvedValue(null);

    await expect(
      service.update('n1', 'u1', { binderId: 'bad-binder' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates note and re-indexes search', async () => {
    prisma.note.findUnique.mockResolvedValue(makeNote());
    const updated = makeNote({ title: 'Updated Ramen' });
    prisma.note.update.mockResolvedValue(updated);

    const result = await service.update('n1', 'u1', { title: 'Updated Ramen' });

    expect(result.title).toBe('Updated Ramen');
    expect(searchService.indexNote).toHaveBeenCalledWith(updated);
  });

  // ─── remove ────────────────────────────────────────────

  it('throws ForbiddenException when deleting another users note', async () => {
    prisma.note.findUnique.mockResolvedValue(
      makeNote({ authorId: 'other-user', visibility: 'PUBLIC' }),
    );

    await expect(service.remove('n1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deletes note and removes from search index', async () => {
    prisma.note.findUnique.mockResolvedValue(makeNote());
    prisma.note.delete.mockResolvedValue({});

    await service.remove('n1', 'u1');

    expect(prisma.note.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
    expect(searchService.removeNote).toHaveBeenCalledWith('n1');
  });

  // ─── attachPhotos ──────────────────────────────────────

  it('throws BadRequestException when exceeding 5 photo limit', async () => {
    prisma.note.findUnique.mockResolvedValue(makeNote());
    prisma.photo.count.mockResolvedValue(4);

    await expect(
      service.attachPhotos('n1', 'u1', ['p1', 'p2']),
    ).rejects.toThrow(BadRequestException);
  });

  it('attaches photos with correct sort order', async () => {
    prisma.note.findUnique
      .mockResolvedValueOnce(makeNote())
      .mockResolvedValueOnce(makeNote());
    prisma.photo.count.mockResolvedValue(2);
    prisma.photo.updateMany.mockResolvedValue({ count: 1 });

    await service.attachPhotos('n1', 'u1', ['p1']);

    expect(prisma.photo.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['p1'] },
        uploaderId: 'u1',
        noteId: null,
      },
      data: { noteId: 'n1', sortOrder: 2 },
    });
  });

  // ─── socialFeed ────────────────────────────────────────

  it('returns empty feed when user follows no binders', async () => {
    prisma.binderFollow.findMany.mockResolvedValue([]);

    const result = await service.socialFeed('u1');

    expect(result).toEqual({ items: [], nextCursor: null, hasMore: false });
    expect(prisma.note.findMany).not.toHaveBeenCalled();
  });

  it('fetches notes from followed binders', async () => {
    prisma.binderFollow.findMany.mockResolvedValue([
      { binderId: 'b1' },
      { binderId: 'b2' },
    ]);
    const notes = [makeNote({ binderId: 'b1' })];
    prisma.note.findMany.mockResolvedValue(notes);

    const result = await service.socialFeed('u1');

    expect(result.items).toHaveLength(1);
    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          binderId: { in: ['b1', 'b2'] },
          visibility: 'PUBLIC',
        }),
      }),
    );
  });
});
