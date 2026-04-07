import { prisma } from '../clients/prisma';

const VALID_NOTE_TYPES = ['RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT'];

export const notesSearchService = {
  /**
   * Personal search — search only the current user's notes (Postgres).
   */
  async search(
    authorId: string,
    query: string,
    type?: string,
    limit = 20,
    offset = 0,
  ) {
    if (type && !VALID_NOTE_TYPES.includes(type)) {
      return { hits: [], total: 0, limit, offset };
    }

    const where: Record<string, unknown> = { authorId };
    if (type) where.type = type;

    if (query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { freeText: { contains: query.trim(), mode: 'insensitive' } },
        { venue: { name: { contains: query.trim(), mode: 'insensitive' } } },
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: { venue: true, photos: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    return { hits: notes, total, limit, offset };
  },

  /**
   * Public/global search — search user's own notes plus all public notes (Postgres).
   */
  async searchAll(
    userId: string,
    query: string,
    type?: string,
    limit = 20,
    offset = 0,
  ) {
    if (type && !VALID_NOTE_TYPES.includes(type)) {
      return { hits: [], total: 0, limit, offset };
    }

    const where: Record<string, unknown> = {
      OR: [
        { authorId: userId },
        { visibility: 'PUBLIC' },
      ],
    };
    if (type) where.type = type;

    if (query.trim()) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.trim(), mode: 'insensitive' } },
            { freeText: { contains: query.trim(), mode: 'insensitive' } },
            { venue: { name: { contains: query.trim(), mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: { venue: true, photos: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    return { hits: notes, total, limit, offset };
  },

  /**
   * Search public notes only (Postgres fallback path).
   * Supports optional filters: minRating, dateFrom, dateTo.
   */
  async searchPublic(
    query: string,
    authorIds?: string[],
    type?: string,
    limit = 20,
    offset = 0,
    filters?: {
      minRating?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    if (type && !VALID_NOTE_TYPES.includes(type)) {
      return { hits: [], total: 0, limit, offset };
    }

    const where: Record<string, unknown> = { visibility: 'PUBLIC' };
    if (type) where.type = type;
    if (authorIds && authorIds.length > 0) {
      where.authorId = { in: authorIds };
    }
    if (query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { freeText: { contains: query.trim(), mode: 'insensitive' } },
        { venue: { name: { contains: query.trim(), mode: 'insensitive' } } },
      ];
    }
    if (filters) {
      if (filters.minRating !== undefined) where.rating = { gte: filters.minRating };
      const createdAtFilter: { gte?: Date; lte?: Date } = {};
      if (filters.dateFrom) createdAtFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) createdAtFilter.lte = new Date(filters.dateTo);
      if (Object.keys(createdAtFilter).length > 0) where.createdAt = createdAtFilter;
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: { venue: true, photos: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    return { hits: notes, total, limit, offset };
  },
};
