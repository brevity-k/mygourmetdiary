import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

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
}

@Injectable()
export class NotesSearchService implements OnModuleInit {
  private readonly logger = new Logger(NotesSearchService.name);
  private client: MeiliSearch;
  private index!: Index;

  constructor(private readonly configService: ConfigService) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILISEARCH_HOST') || 'http://localhost:7700',
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  async onModuleInit() {
    try {
      await this.client.createIndex('notes', { primaryKey: 'id' });
    } catch {
      // Index may already exist
    }

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
    ]);

    await this.index.updateSortableAttributes(['createdAt', 'rating']);

    this.logger.log('Meilisearch notes index configured');
  }

  async indexNote(note: any): Promise<void> {
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
    };

    await this.index.addDocuments([doc]);
  }

  async removeNote(id: string): Promise<void> {
    await this.index.deleteDocument(id);
  }

  async search(
    authorId: string,
    query: string,
    type?: string,
    limit = 20,
    offset = 0,
  ) {
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
