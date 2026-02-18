import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SignalType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TssComputationService } from '../../taste-matching/tss-computation.service';
import { CreateSignalDto } from './dto/create-signal.dto';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tssComputation: TssComputationService,
  ) {}

  async sendSignal(senderId: string, noteId: string, dto: CreateSignalDto) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, authorId: true, visibility: true, type: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.visibility !== 'PUBLIC') {
      throw new ForbiddenException('Cannot signal a private note');
    }
    if (note.authorId === senderId) {
      throw new BadRequestException('Cannot signal your own note');
    }

    // ECHOED and DIVERGED are mutually exclusive — remove the other if exists
    if (dto.signalType === SignalType.ECHOED || dto.signalType === SignalType.DIVERGED) {
      const opposite = dto.signalType === SignalType.ECHOED
        ? SignalType.DIVERGED
        : SignalType.ECHOED;

      await this.prisma.tasteSignal.deleteMany({
        where: { senderId, noteId, signalType: opposite },
      });
    }

    const signal = await this.prisma.tasteSignal.upsert({
      where: {
        senderId_noteId_signalType: { senderId, noteId, signalType: dto.signalType },
      },
      create: {
        senderId,
        noteId,
        signalType: dto.signalType,
        senderRating: dto.senderRating,
      },
      update: {
        senderRating: dto.senderRating,
      },
    });

    await this.invalidateSignalCache(noteId);

    // Trigger incremental TSS recomputation for ECHOED/DIVERGED signals
    if (dto.signalType === SignalType.ECHOED || dto.signalType === SignalType.DIVERGED) {
      const category = this.tssComputation.noteTypeToCategory(note.type);
      if (category) {
        this.tssComputation.recomputePair(senderId, note.authorId, category).catch((e) => {
          this.logger.error(`Incremental TSS recompute failed for ${senderId}/${note.authorId}`, e);
        });
      }
    }

    return signal;
  }

  async removeSignal(senderId: string, noteId: string, signalType: SignalType) {
    await this.prisma.tasteSignal.deleteMany({
      where: { senderId, noteId, signalType },
    });
    await this.invalidateSignalCache(noteId);
  }

  async getSignalSummary(noteId: string, viewerId?: string) {
    const cacheKey = `p2:signals:count:${noteId}`;
    let counts = await this.redis.getJson<Record<string, number>>(cacheKey);

    if (!counts) {
      const results = await this.prisma.tasteSignal.groupBy({
        by: ['signalType'],
        where: { noteId },
        _count: true,
      });
      counts = {
        bookmarkCount: 0,
        echoCount: 0,
        divergeCount: 0,
      };
      for (const r of results) {
        if (r.signalType === SignalType.BOOKMARKED) counts.bookmarkCount = r._count;
        if (r.signalType === SignalType.ECHOED) counts.echoCount = r._count;
        if (r.signalType === SignalType.DIVERGED) counts.divergeCount = r._count;
      }
      await this.redis.setJson(cacheKey, counts, 900); // 15 min TTL
    }

    let mySignals: SignalType[] = [];
    if (viewerId) {
      const signals = await this.prisma.tasteSignal.findMany({
        where: { senderId: viewerId, noteId },
        select: { signalType: true },
      });
      mySignals = signals.map((s) => s.signalType);
    }

    return { ...counts, mySignals };
  }

  private async invalidateSignalCache(noteId: string) {
    await this.redis.del(`p2:signals:count:${noteId}`);
  }
}
