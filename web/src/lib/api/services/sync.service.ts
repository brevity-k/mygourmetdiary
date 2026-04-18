import type { Prisma } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { photosService } from './photos.service';

const MAX_NOTES_PER_PAGE = 500;

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

export const syncService = {
  async exportNotes(userId: string, since?: string, cursor?: string) {
    const where: Prisma.NoteWhereInput = { authorId: userId };

    if (since) {
      where.updatedAt = { gte: new Date(since) };
    }

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_NOTES_PER_PAGE + 1,
    });

    await photosService.attachSignedUrlsToItems(notes);
    const result = paginateResults(
      notes,
      MAX_NOTES_PER_PAGE,
      (n: { createdAt: Date }) => n.createdAt.toISOString(),
    );

    // Also include binders
    const binders = await prisma.binder.findMany({
      where: { ownerId: userId },
    });

    return {
      notes: result.items,
      binders,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      exportedAt: new Date().toISOString(),
    };
  },
};
