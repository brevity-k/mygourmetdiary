import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_NOTES_PER_PAGE = 500;

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async exportNotes(
    userId: string,
    since?: string,
    cursor?: string,
  ) {
    const where: any = { authorId: userId };

    if (since) {
      where.updatedAt = { gte: new Date(since) };
    }

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const notes = await this.prisma.note.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_NOTES_PER_PAGE + 1,
    });

    const hasMore = notes.length > MAX_NOTES_PER_PAGE;
    const items = hasMore ? notes.slice(0, MAX_NOTES_PER_PAGE) : notes;
    const nextCursor = hasMore
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    // Also include binders
    const binders = await this.prisma.binder.findMany({
      where: { ownerId: userId },
    });

    return {
      notes: items,
      binders,
      nextCursor,
      hasMore,
      exportedAt: new Date().toISOString(),
    };
  }
}
