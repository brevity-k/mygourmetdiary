import type { CommunitySubjectType } from '@mygourmetdiary/shared-types';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';

const CACHE_TTL = 300; // 5 minutes

interface RatingGroup {
  rating: number;
  _count: { id: number };
}

export function buildRatingDistribution(grouped: RatingGroup[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (let i = 1; i <= 10; i++) dist[String(i)] = 0;
  for (const g of grouped) dist[String(g.rating)] = g._count.id;
  return dist;
}

export function computeStats(
  subjectType: CommunitySubjectType,
  subjectId: string,
  totalNotes: number,
  totalGourmets: number,
  avgRating: number | null,
) {
  return {
    subjectType,
    subjectId,
    totalNotes,
    totalGourmets,
    avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
  };
}

export const communityStatsService = {
  async getStats(subjectType: CommunitySubjectType, subjectId: string, noteField: string) {
    const cacheKey = `community-stats:${subjectType}:${subjectId}`;
    const cached = await getJson<ReturnType<typeof computeStats> & { ratingDistribution: Record<string, number> }>(cacheKey);
    if (cached) return cached;

    const publicWhere = { [noteField]: subjectId, visibility: 'PUBLIC' as const };

    const [count, gourmets, avg, ratings] = await Promise.all([
      prisma.note.count({ where: publicWhere }),
      prisma.note.groupBy({ by: ['authorId'], where: publicWhere, _count: { id: true } }),
      prisma.note.aggregate({ where: publicWhere, _avg: { rating: true } }),
      prisma.note.groupBy({ by: ['rating'], where: publicWhere, _count: { id: true } }),
    ]);

    const stats = {
      ...computeStats(subjectType, subjectId, count, gourmets.length, avg._avg.rating),
      ratingDistribution: buildRatingDistribution(ratings),
    };

    await setJson(cacheKey, stats, CACHE_TTL);
    return stats;
  },
};
