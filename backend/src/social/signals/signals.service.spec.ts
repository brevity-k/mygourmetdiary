import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SignalType, NoteType } from '@prisma/client';
import { SignalsService } from './signals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TssComputationService } from '../../taste-matching/tss-computation.service';
import { NotificationsService } from '../../notifications/notifications.service';

describe('SignalsService', () => {
  let service: SignalsService;
  let prisma: any;
  let redis: any;
  let tssComputation: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ displayName: 'Tester' }) },
      note: { findUnique: jest.fn() },
      tasteSignal: {
        deleteMany: jest.fn(),
        upsert: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
    };

    redis = {
      getJson: jest.fn(),
      setJson: jest.fn(),
      del: jest.fn(),
    };

    tssComputation = {
      noteTypeToCategory: jest.fn(),
      recomputePair: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: TssComputationService, useValue: tssComputation },
        { provide: NotificationsService, useValue: { notifySignalOnNote: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<SignalsService>(SignalsService);
  });

  afterEach(() => jest.clearAllMocks());

  const publicNote = {
    id: 'note1',
    authorId: 'author1',
    visibility: 'PUBLIC',
    type: NoteType.RESTAURANT,
  };

  // --- sendSignal: validation ---

  it('throws NotFoundException if note does not exist', async () => {
    prisma.note.findUnique.mockResolvedValue(null);
    await expect(
      service.sendSignal('sender1', 'nonexistent', {
        signalType: SignalType.BOOKMARKED,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException for private notes', async () => {
    prisma.note.findUnique.mockResolvedValue({
      ...publicNote,
      visibility: 'PRIVATE',
    });
    await expect(
      service.sendSignal('sender1', 'note1', {
        signalType: SignalType.BOOKMARKED,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when signaling own note', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    await expect(
      service.sendSignal('author1', 'note1', {
        signalType: SignalType.BOOKMARKED,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // --- sendSignal: mutual exclusion ---

  it('deletes DIVERGED when sending ECHOED', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    prisma.tasteSignal.upsert.mockResolvedValue({ id: 's1' });
    tssComputation.noteTypeToCategory.mockReturnValue('RESTAURANT');
    tssComputation.recomputePair.mockResolvedValue(null);

    await service.sendSignal('sender1', 'note1', {
      signalType: SignalType.ECHOED,
      senderRating: 8,
    });

    expect(prisma.tasteSignal.deleteMany).toHaveBeenCalledWith({
      where: {
        senderId: 'sender1',
        noteId: 'note1',
        signalType: SignalType.DIVERGED,
      },
    });
  });

  it('deletes ECHOED when sending DIVERGED', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    prisma.tasteSignal.upsert.mockResolvedValue({ id: 's1' });
    tssComputation.noteTypeToCategory.mockReturnValue('RESTAURANT');
    tssComputation.recomputePair.mockResolvedValue(null);

    await service.sendSignal('sender1', 'note1', {
      signalType: SignalType.DIVERGED,
      senderRating: 3,
    });

    expect(prisma.tasteSignal.deleteMany).toHaveBeenCalledWith({
      where: {
        senderId: 'sender1',
        noteId: 'note1',
        signalType: SignalType.ECHOED,
      },
    });
  });

  it('does NOT delete other signals when sending BOOKMARKED', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    prisma.tasteSignal.upsert.mockResolvedValue({ id: 's1' });

    await service.sendSignal('sender1', 'note1', {
      signalType: SignalType.BOOKMARKED,
    });

    expect(prisma.tasteSignal.deleteMany).not.toHaveBeenCalled();
  });

  // --- sendSignal: TSS recompute ---

  it('triggers TSS recompute for ECHOED signals', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    prisma.tasteSignal.upsert.mockResolvedValue({ id: 's1' });
    tssComputation.noteTypeToCategory.mockReturnValue('RESTAURANT');
    tssComputation.recomputePair.mockResolvedValue(null);

    await service.sendSignal('sender1', 'note1', {
      signalType: SignalType.ECHOED,
      senderRating: 8,
    });

    expect(tssComputation.recomputePair).toHaveBeenCalledWith(
      'sender1',
      'author1',
      'RESTAURANT',
    );
  });

  it('triggers TSS recompute for DIVERGED signals', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    prisma.tasteSignal.upsert.mockResolvedValue({ id: 's1' });
    tssComputation.noteTypeToCategory.mockReturnValue('RESTAURANT');
    tssComputation.recomputePair.mockResolvedValue(null);

    await service.sendSignal('sender1', 'note1', {
      signalType: SignalType.DIVERGED,
      senderRating: 3,
    });

    expect(tssComputation.recomputePair).toHaveBeenCalledWith(
      'sender1',
      'author1',
      'RESTAURANT',
    );
  });

  it('does NOT trigger TSS recompute for BOOKMARKED signals', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    prisma.tasteSignal.upsert.mockResolvedValue({ id: 's1' });

    await service.sendSignal('sender1', 'note1', {
      signalType: SignalType.BOOKMARKED,
    });

    expect(tssComputation.recomputePair).not.toHaveBeenCalled();
  });

  // --- sendSignal: cache invalidation ---

  it('invalidates signal cache after sending signal', async () => {
    prisma.note.findUnique.mockResolvedValue(publicNote);
    prisma.tasteSignal.upsert.mockResolvedValue({ id: 's1' });

    await service.sendSignal('sender1', 'note1', {
      signalType: SignalType.BOOKMARKED,
    });

    expect(redis.del).toHaveBeenCalledWith('p2:signals:count:note1');
  });

  // --- removeSignal ---

  it('removes signal and invalidates cache', async () => {
    await service.removeSignal('sender1', 'note1', SignalType.BOOKMARKED);

    expect(prisma.tasteSignal.deleteMany).toHaveBeenCalledWith({
      where: {
        senderId: 'sender1',
        noteId: 'note1',
        signalType: SignalType.BOOKMARKED,
      },
    });
    expect(redis.del).toHaveBeenCalledWith('p2:signals:count:note1');
  });

  // --- getSignalSummary ---

  it('returns cached signal summary when available', async () => {
    const cached = { bookmarkCount: 3, echoCount: 1, divergeCount: 0 };
    redis.getJson.mockResolvedValue(cached);

    const result = await service.getSignalSummary('note1');
    expect(result).toEqual({ ...cached, mySignals: [] });
    expect(prisma.tasteSignal.groupBy).not.toHaveBeenCalled();
  });

  it('computes and caches signal summary on cache miss', async () => {
    redis.getJson.mockResolvedValue(null);
    prisma.tasteSignal.groupBy.mockResolvedValue([
      { signalType: SignalType.BOOKMARKED, _count: 5 },
      { signalType: SignalType.ECHOED, _count: 2 },
    ]);

    const result = await service.getSignalSummary('note1') as any;
    expect(result.bookmarkCount).toBe(5);
    expect(result.echoCount).toBe(2);
    expect(result.divergeCount).toBe(0);
    expect(redis.setJson).toHaveBeenCalledWith(
      'p2:signals:count:note1',
      expect.objectContaining({ bookmarkCount: 5 }),
      900,
    );
  });
});
