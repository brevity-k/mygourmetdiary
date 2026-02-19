import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NoteType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PioneersService } from '../pioneers/pioneers.service';
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
    private readonly notificationsService: NotificationsService,
    private readonly pioneersService: PioneersService,
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

    // Notify binder followers (fire-and-forget, public notes only)
    if (dto.visibility === 'PUBLIC' || (!dto.visibility && binder.visibility === 'PUBLIC')) {
      const author = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      });
      this.notificationsService
        .notifyNewNoteInBinder(
          author?.displayName ?? 'A gourmet',
          binder.name,
          binder.id,
          userId,
        )
        .catch((e) => {
          this.logger.error(`Notification failed for note ${note.id}`, e);
        });
    }

    // Check pioneer badge eligibility (fire-and-forget)
    if (resolvedVenueId && (dto.visibility === 'PUBLIC' || (!dto.visibility && binder.visibility === 'PUBLIC'))) {
      this.pioneersService
        .checkAndAwardPioneerBadge(userId, note.id)
        .catch((e) => {
          this.logger.error(`Pioneer check failed for note ${note.id}`, e);
        });
    }

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

  async publicFeed(
    cursor?: string,
    limit = 20,
    type?: NoteType,
  ) {
    const where: Record<string, unknown> = { visibility: 'PUBLIC' };
    if (type) where.type = type;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const notes = await this.prisma.note.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
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

  async socialFeed(
    userId: string,
    cursor?: string,
    limit = 20,
    type?: NoteType,
  ) {
    // Get binder IDs the user follows
    const follows = await this.prisma.binderFollow.findMany({
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

    const notes = await this.prisma.note.findMany({
      where,
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
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

  async findPublicById(id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        venue: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!note) throw new NotFoundException('Note not found');
    if (note.visibility === 'PRIVATE') throw new ForbiddenException();

    return note;
  }

  async findPublicByAuthor(authorId: string, cursor?: string, limit = 20) {
    const where: Record<string, unknown> = {
      authorId,
      visibility: 'PUBLIC',
    };
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
