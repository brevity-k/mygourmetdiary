import { NoteType, Prisma } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { validateExtension } from '../validators/notes';

// ─── Pagination helpers ────────────────────────────────

function clampLimit(limit?: number, defaultVal = 20, max = 100): number {
  return Math.min(Math.max(limit || defaultVal, 1), max);
}

function paginateResults<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string,
): { items: T[]; hasMore: boolean; nextCursor: string | null } {
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? getCursor(page[page.length - 1]) : null;
  return { items: page, hasMore, nextCursor };
}

// ─── Types ─────────────────────────────────────────────

interface CreateNoteInput {
  type: NoteType;
  title: string;
  binderId: string;
  rating: number;
  freeText?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  tagIds?: string[];
  extension: Record<string, unknown>;
  venueId?: string;
  experiencedAt: string;
  photoIds?: string[];
}

interface UpdateNoteInput {
  title?: string;
  binderId?: string;
  rating?: number;
  freeText?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  tagIds?: string[];
  extension?: Record<string, unknown>;
  experiencedAt?: string;
}

// ─── Service ───────────────────────────────────────────

export const notesService = {
  clampLimit,

  async feed(
    userId: string,
    cursor?: string,
    limit = 20,
    type?: NoteType,
    binderId?: string,
  ) {
    const where: Record<string, unknown> = { authorId: userId };
    if (type) where.type = type;
    if (binderId) where.binderId = binderId;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const notes = await prisma.note.findMany({
      where,
      include: { photos: { orderBy: { sortOrder: 'asc' } }, venue: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    return paginateResults(notes, limit, (n) => n.createdAt.toISOString());
  },

  async findById(id: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: { photos: { orderBy: { sortOrder: 'asc' } }, venue: true },
    });

    if (!note) throw new Error('Note not found');
    if (note.authorId !== userId && note.visibility === 'PRIVATE') {
      throw new Error('Forbidden');
    }

    return note;
  },

  async create(userId: string, input: CreateNoteInput) {
    // Validate extension
    const extValidation = validateExtension(input.type, input.extension);
    if (!extValidation.success) {
      throw new Error(extValidation.error);
    }

    // Verify binder ownership
    const binder = await prisma.binder.findUnique({
      where: { id: input.binderId },
    });
    if (!binder || binder.ownerId !== userId) {
      throw new Error('Invalid binder');
    }

    // Venue check for restaurant/winery types
    let resolvedVenueId: string | null = null;
    if (
      input.venueId &&
      (input.type === NoteType.RESTAURANT || input.type === NoteType.WINERY_VISIT)
    ) {
      const venue = await prisma.venue.findUnique({
        where: { placeId: input.venueId },
      });
      if (!venue) {
        throw new Error('Venue not found. Search for it first.');
      }
      resolvedVenueId = venue.id;
    }

    const note = await prisma.note.create({
      data: {
        authorId: userId,
        binderId: input.binderId,
        type: input.type,
        title: input.title,
        rating: input.rating,
        freeText: input.freeText,
        visibility: input.visibility,
        tagIds: input.tagIds || [],
        extension: input.extension as unknown as Prisma.InputJsonValue,
        venueId: resolvedVenueId,
        experiencedAt: new Date(input.experiencedAt),
      },
      include: { photos: true, venue: true },
    });

    // Attach photos if provided
    if (input.photoIds?.length) {
      await prisma.photo.updateMany({
        where: {
          id: { in: input.photoIds },
          uploaderId: userId,
          noteId: null,
        },
        data: { noteId: note.id },
      });
    }

    return notesService.findById(note.id, userId);
  },

  async update(id: string, userId: string, input: UpdateNoteInput) {
    const note = await notesService.findById(id, userId);
    if (note.authorId !== userId) throw new Error('Forbidden');

    if (input.extension) {
      const extValidation = validateExtension(note.type, input.extension);
      if (!extValidation.success) {
        throw new Error(extValidation.error);
      }
    }

    if (input.binderId) {
      const binder = await prisma.binder.findUnique({
        where: { id: input.binderId },
      });
      if (!binder || binder.ownerId !== userId) {
        throw new Error('Invalid binder');
      }
    }

    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...input,
        extension: input.extension as unknown as Prisma.InputJsonValue,
        experiencedAt: input.experiencedAt
          ? new Date(input.experiencedAt)
          : undefined,
      },
      include: { photos: { orderBy: { sortOrder: 'asc' } }, venue: true },
    });

    return updated;
  },

  async remove(id: string, userId: string) {
    const note = await notesService.findById(id, userId);
    if (note.authorId !== userId) throw new Error('Forbidden');

    await prisma.note.delete({ where: { id } });
  },

  async publicFeed(cursor?: string, limit = 20, type?: NoteType) {
    const where: Record<string, unknown> = { visibility: 'PUBLIC' };
    if (type) where.type = type;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const notes = await prisma.note.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    return paginateResults(notes, limit, (n) => n.createdAt.toISOString());
  },

  async socialFeed(userId: string, cursor?: string, limit = 20, type?: NoteType) {
    // Get binder IDs the user follows
    const follows = await prisma.binderFollow.findMany({
      where: { followerId: userId },
      select: { binderId: true },
    });
    const binderIds = follows.map((f) => f.binderId);

    if (binderIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const where: Record<string, unknown> = {
      binderId: { in: binderIds },
      visibility: 'PUBLIC',
    };
    if (type) where.type = type;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const notes = await prisma.note.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    return paginateResults(notes, limit, (n) => n.createdAt.toISOString());
  },

  async findPublicById(id: string) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!note) throw new Error('Note not found');
    if (note.visibility === 'PRIVATE') throw new Error('Forbidden');

    return note;
  },

  async attachPhotos(noteId: string, userId: string, photoIds: string[]) {
    const note = await notesService.findById(noteId, userId);
    if (note.authorId !== userId) throw new Error('Forbidden');

    const existingCount = await prisma.photo.count({
      where: { noteId },
    });

    if (existingCount + photoIds.length > 5) {
      throw new Error('Maximum 5 photos per note');
    }

    await prisma.photo.updateMany({
      where: {
        id: { in: photoIds },
        uploaderId: userId,
        noteId: null,
      },
      data: { noteId, sortOrder: existingCount },
    });

    return notesService.findById(noteId, userId);
  },
};
