import type { SignalType } from '@prisma/client';
import { prisma } from '../../clients/prisma';
import { redis, getJson, setJson } from '../../clients/redis';
import { tssComputationService } from '../taste-matching/tss-computation.service';
import { notificationsService } from '../notifications.service';

export const signalsService = {
  async sendSignal(
    senderId: string,
    noteId: string,
    dto: { signalType: SignalType; senderRating?: number },
  ) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, authorId: true, visibility: true, type: true, extension: true },
    });
    if (!note) throw new Error('Note not found');
    if (note.visibility !== 'PUBLIC') {
      throw new Error('Cannot signal a private note');
    }
    if (note.authorId === senderId) {
      throw new Error('Cannot signal your own note');
    }

    // ECHOED and DIVERGED are mutually exclusive — remove the other if exists
    if (dto.signalType === 'ECHOED' || dto.signalType === 'DIVERGED') {
      const opposite: SignalType = dto.signalType === 'ECHOED' ? 'DIVERGED' : 'ECHOED';
      await prisma.tasteSignal.deleteMany({
        where: { senderId, noteId, signalType: opposite },
      });
    }

    const signal = await prisma.tasteSignal.upsert({
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

    await invalidateSignalCache(noteId);

    // Notify note author (fire-and-forget)
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true },
    });
    const ext = note.extension as Record<string, unknown>;
    const itemName = note.type === 'RESTAURANT'
      ? (ext?.dishName as string) ?? 'a dish'
      : 'your note';

    notificationsService
      .notifySignalOnNote(
        sender?.displayName ?? 'Someone',
        dto.signalType,
        itemName,
        note.authorId,
        noteId,
      )
      .catch((e) => console.warn('Failed to send signal notification', e));

    // Trigger incremental TSS recomputation for ECHOED/DIVERGED signals
    if (dto.signalType === 'ECHOED' || dto.signalType === 'DIVERGED') {
      const category = tssComputationService.noteTypeToCategory(note.type);
      if (category) {
        tssComputationService
          .recomputePair(senderId, note.authorId, category)
          .catch((firstErr) => {
            console.warn(
              `Incremental TSS recompute failed (will retry once) for ${senderId}/${note.authorId}/${category}`,
              firstErr,
            );
            setTimeout(() => {
              tssComputationService
                .recomputePair(senderId, note.authorId, category)
                .catch((retryErr) => {
                  console.warn(
                    `Incremental TSS recompute permanently failed for ${senderId}/${note.authorId}/${category}`,
                    retryErr,
                  );
                });
            }, 5000);
          });
      }
    }

    return signal;
  },

  async removeSignal(senderId: string, noteId: string, signalType: SignalType) {
    await prisma.tasteSignal.deleteMany({
      where: { senderId, noteId, signalType },
    });
    await invalidateSignalCache(noteId);
  },

  async getSignalSummary(noteId: string, viewerId?: string) {
    const cacheKey = `p2:signals:count:${noteId}`;
    let counts = await getJson<Record<string, number>>(cacheKey);

    if (!counts) {
      const results = await prisma.tasteSignal.groupBy({
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
        if (r.signalType === 'BOOKMARKED') counts.bookmarkCount = r._count;
        if (r.signalType === 'ECHOED') counts.echoCount = r._count;
        if (r.signalType === 'DIVERGED') counts.divergeCount = r._count;
      }
      await setJson(cacheKey, counts, 900); // 15 min TTL
    }

    let mySignals: SignalType[] = [];
    if (viewerId) {
      const signals = await prisma.tasteSignal.findMany({
        where: { senderId: viewerId, noteId },
        select: { signalType: true },
      });
      mySignals = signals.map((s: { signalType: SignalType }) => s.signalType);
    }

    return { ...counts, mySignals };
  },
};

async function invalidateSignalCache(noteId: string) {
  await redis.del(`p2:signals:count:${noteId}`);
}
