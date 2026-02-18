import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NoteType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteExtensionFactory } from './factory/note-extension.factory';
import { NotesSearchService } from './notes.search.service';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: NotesSearchService,
  ) {}

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

    const notes = await this.prisma.note.findMany({
      where,
      include: { photos: { orderBy: { sortOrder: 'asc' } }, venue: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = notes.length > limit;
    const items = hasMore ? notes.slice(0, limit) : notes;
    const nextCursor = hasMore
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    return { items, nextCursor, hasMore };
  }

  async findById(id: string, userId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: { photos: { orderBy: { sortOrder: 'asc' } }, venue: true },
    });

    if (!note) throw new NotFoundException('Note not found');
    if (note.authorId !== userId && note.visibility === 'PRIVATE') {
      throw new ForbiddenException();
    }

    return note;
  }

  async create(userId: string, dto: CreateNoteDto) {
    // Validate extension
    NoteExtensionFactory.validate(dto.type, dto.extension);

    // Verify binder ownership
    const binder = await this.prisma.binder.findUnique({
      where: { id: dto.binderId },
    });
    if (!binder || binder.ownerId !== userId) {
      throw new BadRequestException('Invalid binder');
    }

    // Venue check for restaurant/winery types
    let resolvedVenueId: string | null = null;
    if (
      dto.venueId &&
      (dto.type === NoteType.RESTAURANT || dto.type === NoteType.WINERY_VISIT)
    ) {
      const venue = await this.prisma.venue.findUnique({
        where: { placeId: dto.venueId },
      });
      if (!venue) {
        throw new BadRequestException('Venue not found. Search for it first.');
      }
      resolvedVenueId = venue.id;
    }

    const note = await this.prisma.note.create({
      data: {
        authorId: userId,
        binderId: dto.binderId,
        type: dto.type,
        title: dto.title,
        rating: dto.rating,
        freeText: dto.freeText,
        visibility: dto.visibility,
        tagIds: dto.tagIds || [],
        extension: dto.extension as any,
        venueId: resolvedVenueId,
        experiencedAt: new Date(dto.experiencedAt),
      },
      include: { photos: true, venue: true },
    });

    // Attach photos if provided
    if (dto.photoIds?.length) {
      await this.prisma.photo.updateMany({
        where: {
          id: { in: dto.photoIds },
          uploaderId: userId,
          noteId: null,
        },
        data: { noteId: note.id },
      });
    }

    // Sync to search (fire-and-forget)
    this.searchService.indexNote(note).catch((e) => {
      this.logger.error(`Search index failed for note ${note.id}`, e);
    });

    return this.findById(note.id, userId);
  }

  async update(id: string, userId: string, dto: UpdateNoteDto) {
    const note = await this.findById(id, userId);
    if (note.authorId !== userId) throw new ForbiddenException();

    if (dto.extension) {
      NoteExtensionFactory.validate(note.type, dto.extension);
    }

    if (dto.binderId) {
      const binder = await this.prisma.binder.findUnique({
        where: { id: dto.binderId },
      });
      if (!binder || binder.ownerId !== userId) {
        throw new BadRequestException('Invalid binder');
      }
    }

    const updated = await this.prisma.note.update({
      where: { id },
      data: {
        ...dto,
        extension: dto.extension as any,
        experiencedAt: dto.experiencedAt
          ? new Date(dto.experiencedAt)
          : undefined,
      },
      include: { photos: { orderBy: { sortOrder: 'asc' } }, venue: true },
    });

    this.searchService.indexNote(updated).catch((e) => {
      this.logger.error(`Search re-index failed for note ${id}`, e);
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const note = await this.findById(id, userId);
    if (note.authorId !== userId) throw new ForbiddenException();

    await this.prisma.note.delete({ where: { id } });

    this.searchService.removeNote(id).catch((e) => {
      this.logger.error(`Search removal failed for note ${id}`, e);
    });
  }

  async attachPhotos(noteId: string, userId: string, photoIds: string[]) {
    const note = await this.findById(noteId, userId);
    if (note.authorId !== userId) throw new ForbiddenException();

    const existingCount = await this.prisma.photo.count({
      where: { noteId },
    });

    if (existingCount + photoIds.length > 5) {
      throw new BadRequestException('Maximum 5 photos per note');
    }

    await this.prisma.photo.updateMany({
      where: {
        id: { in: photoIds },
        uploaderId: userId,
        noteId: null,
      },
      data: { noteId, sortOrder: existingCount },
    });

    return this.findById(noteId, userId);
  }
}
