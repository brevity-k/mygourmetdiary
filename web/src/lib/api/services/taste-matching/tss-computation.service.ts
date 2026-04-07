import type { NoteType, TasteCategory } from '@prisma/client';
import { prisma } from '../../clients/prisma';

interface RatedItem {
  noteId: string;
  authorId: string;
  rating: number;
  matchKey: string;
  experiencedAt: Date;
}

const NOTE_TYPE_TO_CATEGORY: Partial<Record<NoteType, TasteCategory>> = {
  RESTAURANT: 'RESTAURANT',
  WINE: 'WINE',
  SPIRIT: 'SPIRIT',
};

const HALF_LIFE_DAYS = 180;
const DECAY_LAMBDA = Math.LN2 / HALF_LIFE_DAYS;
const MIN_OVERLAP = 5;
const MAX_RATING_DIFF = 9;

function buildMatchKey(
  type: NoteType,
  extension: Record<string, unknown>,
  venueId?: string | null,
): string | null {
  switch (type) {
    case 'RESTAURANT': {
      const dish = (extension?.dishName || '').toString().toLowerCase().trim();
      if (!venueId || !dish) return null;
      return `r:${venueId}:${dish}`;
    }
    case 'WINE': {
      const name = (extension?.wineName || '').toString().toLowerCase().trim();
      const vintage = extension?.vintage || 'nv';
      if (!name) return null;
      return `w:${name}:${vintage}`;
    }
    case 'SPIRIT': {
      const name = (extension?.spiritName || '').toString().toLowerCase().trim();
      const distillery = (extension?.distillery || '').toString().toLowerCase().trim();
      if (!name) return null;
      return `s:${name}:${distillery}`;
    }
    default:
      return null;
  }
}

function computeTss(
  itemsA: RatedItem[],
  itemsB: RatedItem[],
  now: Date,
): { score: number; overlapCount: number } {
  const mapA = new Map<string, RatedItem>();
  for (const item of itemsA) mapA.set(item.matchKey, item);

  let weightedSum = 0;
  let totalWeight = 0;
  let overlapCount = 0;

  for (const itemB of itemsB) {
    const itemA = mapA.get(itemB.matchKey);
    if (!itemA) continue;

    overlapCount++;
    const ratingDiff = Math.abs(itemA.rating - itemB.rating);
    const similarity = 1 - ratingDiff / MAX_RATING_DIFF;

    // Recency weight: use the more recent of the two experiences
    const moreRecent = new Date(
      Math.max(itemA.experiencedAt.getTime(), itemB.experiencedAt.getTime()),
    );
    const daysSince = (now.getTime() - moreRecent.getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-DECAY_LAMBDA * daysSince);

    weightedSum += similarity * weight;
    totalWeight += weight;
  }

  if (overlapCount < MIN_OVERLAP) {
    return { score: 0, overlapCount };
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { score: Math.round(score * 1000) / 1000, overlapCount };
}

async function getRatedItemsForCategory(
  userId: string,
  category: TasteCategory,
): Promise<RatedItem[]> {
  const noteType = (Object.entries(NOTE_TYPE_TO_CATEGORY)
    .find(([, cat]) => cat === category)?.[0]) as NoteType | undefined;
  if (!noteType) return [];

  const notes = await prisma.note.findMany({
    where: {
      authorId: userId,
      type: noteType,
      visibility: 'PUBLIC',
    },
    select: {
      id: true,
      authorId: true,
      rating: true,
      extension: true,
      venueId: true,
      experiencedAt: true,
      type: true,
    },
  });

  return notes
    .map((n: { id: string; authorId: string; rating: number; extension: unknown; venueId: string | null; experiencedAt: Date; type: NoteType }) => {
      const matchKey = buildMatchKey(n.type, n.extension as Record<string, unknown>, n.venueId);
      if (!matchKey) return null;
      return {
        noteId: n.id,
        authorId: n.authorId,
        rating: n.rating,
        matchKey,
        experiencedAt: n.experiencedAt,
      };
    })
    .filter((item: RatedItem | null): item is RatedItem => item !== null);
}

export const tssComputationService = {
  noteTypeToCategory(type: NoteType): TasteCategory | null {
    return NOTE_TYPE_TO_CATEGORY[type] ?? null;
  },

  buildMatchKey,
  computeTss,
  getRatedItemsForCategory,

  async recomputePair(userAId: string, userBId: string, category: TasteCategory) {
    // Canonical ordering: userAId < userBId
    const [canonA, canonB] = userAId < userBId
      ? [userAId, userBId]
      : [userBId, userAId];

    const [itemsA, itemsB] = await Promise.all([
      getRatedItemsForCategory(canonA, category),
      getRatedItemsForCategory(canonB, category),
    ]);

    const now = new Date();
    const { score, overlapCount } = computeTss(itemsA, itemsB, now);

    if (overlapCount < MIN_OVERLAP) {
      // Remove stale similarity if overlap dropped below threshold
      await prisma.tasteSimilarity.deleteMany({
        where: { userAId: canonA, userBId: canonB, category },
      });
      return null;
    }

    return prisma.tasteSimilarity.upsert({
      where: {
        userAId_userBId_category: {
          userAId: canonA,
          userBId: canonB,
          category,
        },
      },
      create: {
        userAId: canonA,
        userBId: canonB,
        category,
        score,
        overlapCount,
        lastComputedAt: now,
      },
      update: {
        score,
        overlapCount,
        lastComputedAt: now,
      },
    });
  },
};
