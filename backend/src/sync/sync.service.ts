import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginateResults } from '../common/utils/pagination';

const MAX_NOTES_PER_PAGE = 500;

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async exportNotes(
    userId: string,
    since?: string,
    cursor?: string,
  ) {
    const where: Prisma.NoteWhereInput = { authorId: userId };

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

    const { items, hasMore, nextCursor } = paginateResults(
      notes,
      MAX_NOTES_PER_PAGE,
      (n) => n.createdAt.toISOString(),
    );

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
