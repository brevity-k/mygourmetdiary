import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { PrismaService } from '../prisma/prisma.service';

interface NoteSearchDocument {
  id: string;
  authorId: string;
  binderId: string;
  type: string;
  title: string;
  freeText: string | null;
  rating: number;
  visibility: string;
  tagIds: string[];
  venueName: string | null;
  extensionText: string;
  createdAt: number;
  pricePaid: number | null;
  cuisineTags: string[];
  wineType: string | null;
  spiritType: string | null;
}

@Injectable()
export class NotesSearchService implements OnModuleInit {
  private readonly logger = new Logger(NotesSearchService.name);
  private client: MeiliSearch;
  private index!: Index;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILISEARCH_HOST') || 'http://localhost:7700',
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  private available = false;

  async onModuleInit() {
    try {
      await this.client.createIndex('notes', { primaryKey: 'id' });
    } catch {
      // Index may already exist — or Meilisearch is unreachable
    }

    try {
      this.index = this.client.index('notes');

      await this.index.updateSearchableAttributes([
        'title',
        'freeText',
        'extensionText',
        'venueName',
      ]);

      await this.index.updateFilterableAttributes([
        'authorId',
        'type',
        'visibility',
        'binderId',
        'rating',
        'pricePaid',
        'cuisineTags',
        'wineType',
        'spiritType',
        'createdAt',
      ]);

      await this.index.updateSortableAttributes(['createdAt', 'rating']);

      this.available = true;
      this.logger.log('Meilisearch notes index configured');
    } catch (e) {
      this.logger.warn(
        `Meilisearch unavailable — search features disabled: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  async indexNote(note: any): Promise<void> {
    if (!this.available) return;
    const ext = note.extension as any;
    const doc: NoteSearchDocument = {
      id: note.id,
      authorId: note.authorId,
      binderId: note.binderId,
      type: note.type,
      title: note.title,
      freeText: note.freeText,
      rating: note.rating,
      visibility: note.visibility,
      tagIds: note.tagIds,
      venueName: note.venue?.name || null,
      extensionText: this.extractExtensionText(note.type, note.extension),
      createdAt: new Date(note.createdAt).getTime(),
      pricePaid: ext?.pricePaid ?? null,
      cuisineTags: ext?.cuisineTags ?? [],
      wineType: ext?.wineType ?? null,
      spiritType: ext?.spiritType ?? null,
    };

    await this.index.addDocuments([doc]);
  }

  async removeNote(id: string): Promise<void> {
    if (!this.available) return;
    await this.index.deleteDocument(id);
  }

  async search(
    authorId: string,
    query: string,
    type?: string,
    limit = 20,
    offset = 0,
  ) {
    const VALID_TYPES = ['RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT'];
    if (type && !VALID_TYPES.includes(type)) {
      return { hits: [], total: 0, limit, offset };
    }

    if (this.available) {
      const filter = [`authorId = "${authorId}"`];
      if (type) filter.push(`type = "${type}"`);

      const results = await this.index.search(query, {
        filter,
        limit,
        offset,
        sort: ['createdAt:desc'],
      });

      return {
        hits: results.hits,
        total: results.estimatedTotalHits,
        limit,
        offset,
      };
    }

    return this.searchPostgres(authorId, query, type, limit, offset);
  }

  private async searchPostgres(
    authorId: string,
    query: string,
    type?: string,
    limit = 20,
    offset = 0,
  ) {
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
      this.prisma.note.findMany({
        where,
        include: { venue: true, photos: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.note.count({ where }),
    ]);

    return { hits: notes, total, limit, offset };
  }

  async searchPublic(
    query: string,
    authorIds?: string[],
    type?: string,
    limit = 20,
    offset = 0,
    filters?: {
      minRating?: number;
      maxPrice?: number;
      cuisineTags?: string[];
      wineType?: string;
      spiritType?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const VALID_TYPES = ['RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT'];
    if (type && !VALID_TYPES.includes(type)) {
      return { hits: [], total: 0, limit, offset };
    }

    if (this.available) {
      const filter: string[] = ['visibility = "PUBLIC"'];
      if (type) filter.push(`type = "${type}"`);
      if (authorIds && authorIds.length > 0) {
        const authorFilter = authorIds.map((id) => `authorId = "${id}"`).join(' OR ');
        filter.push(`(${authorFilter})`);
      }

      // Advanced filters
      if (filters) {
        if (filters.minRating !== undefined) {
          filter.push(`rating >= ${filters.minRating}`);
        }
        if (filters.maxPrice !== undefined) {
          filter.push(`pricePaid <= ${filters.maxPrice}`);
        }
        if (filters.cuisineTags && filters.cuisineTags.length > 0) {
          const tagFilter = filters.cuisineTags
            .map((t) => `cuisineTags = "${t}"`)
            .join(' OR ');
          filter.push(`(${tagFilter})`);
        }
        if (filters.wineType) {
          filter.push(`wineType = "${filters.wineType}"`);
        }
        if (filters.spiritType) {
          filter.push(`spiritType = "${filters.spiritType}"`);
        }
        if (filters.dateFrom) {
          filter.push(`createdAt >= ${new Date(filters.dateFrom).getTime()}`);
        }
        if (filters.dateTo) {
          filter.push(`createdAt <= ${new Date(filters.dateTo).getTime()}`);
        }
      }

      const results = await this.index.search(query, {
        filter,
        limit,
        offset,
        sort: ['createdAt:desc'],
      });

      return {
        hits: results.hits,
        total: results.estimatedTotalHits,
        limit,
        offset,
      };
    }

    // PostgreSQL fallback
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
      if (filters.dateFrom) where.createdAt = { ...(where.createdAt as any || {}), gte: new Date(filters.dateFrom) };
      if (filters.dateTo) where.createdAt = { ...(where.createdAt as any || {}), lte: new Date(filters.dateTo) };
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        include: { venue: true, photos: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.note.count({ where }),
    ]);

    return { hits: notes, total, limit, offset };
  }

  private extractExtensionText(type: string, extension: any): string {
    if (!extension) return '';
    const parts: string[] = [];

    switch (type) {
      case 'RESTAURANT':
        if (extension.dishName) parts.push(extension.dishName);
        if (extension.cuisineTags) parts.push(...extension.cuisineTags);
        break;
      case 'WINE':
        if (extension.wineName) parts.push(extension.wineName);
        if (extension.region) parts.push(extension.region);
        if (extension.grapeVarietal) parts.push(...extension.grapeVarietal);
        break;
      case 'SPIRIT':
        if (extension.spiritName) parts.push(extension.spiritName);
        if (extension.distillery) parts.push(extension.distillery);
        if (extension.subType) parts.push(extension.subType);
        break;
      case 'WINERY_VISIT':
        break;
    }

    return parts.join(' ');
  }
}
