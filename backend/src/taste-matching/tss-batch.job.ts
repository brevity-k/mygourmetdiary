import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TasteCategory, NoteType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TssComputationService } from './tss-computation.service';

const LOCK_KEY = 'tss:batch:lock';
const LOCK_TTL = 7200; // 2 hours

@Injectable()
export class TssBatchJob {
  private readonly logger = new Logger(TssBatchJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tssComputation: TssComputationService,
  ) {}

  @Cron('0 2 * * *')
  async runBatch() {
    // Acquire distributed lock
    const acquired = await this.redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL, 'NX');
    if (!acquired) {
      this.logger.log('TSS batch already running, skipping.');
      return;
    }

    this.logger.log('Starting TSS batch computation...');
    const start = Date.now();

    try {
      for (const category of [TasteCategory.RESTAURANT, TasteCategory.WINE, TasteCategory.SPIRIT]) {
        await this.computeForCategory(category);
      }

      // Flush TSS cache keys
      await this.flushTssCaches();

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      this.logger.log(`TSS batch completed in ${elapsed}s`);
    } catch (error) {
      this.logger.error('TSS batch failed', error);
    } finally {
      await this.redis.del(LOCK_KEY);
    }
  }

  private async computeForCategory(category: TasteCategory) {
    const noteType = this.categoryToNoteType(category);
    if (!noteType) return;

    // Find all user pairs with overlapping public rated items
    // Using raw query for efficiency: find pairs with >= 5 overlapping items
    const pairs = await this.prisma.$queryRaw<
      Array<{ user_a_id: string; user_b_id: string; overlap: bigint }>
    >`
      WITH rated_items AS (
        SELECT
          n.author_id,
          CASE
            WHEN ${noteType}::text = 'RESTAURANT' THEN
              'r:' || n.venue_id || ':' || LOWER(TRIM(n.extension->>'dishName'))
            WHEN ${noteType}::text = 'WINE' THEN
              'w:' || LOWER(TRIM(n.extension->>'wineName')) || ':' || COALESCE(n.extension->>'vintage', 'nv')
            WHEN ${noteType}::text = 'SPIRIT' THEN
              's:' || LOWER(TRIM(n.extension->>'spiritName')) || ':' || LOWER(TRIM(COALESCE(n.extension->>'distillery', '')))
          END AS match_key
        FROM notes n
        WHERE n.type = ${noteType}::"NoteType"
          AND n.visibility = 'PUBLIC'::"Visibility"
          AND CASE
            WHEN ${noteType}::text = 'RESTAURANT' THEN n.venue_id IS NOT NULL AND n.extension->>'dishName' IS NOT NULL
            WHEN ${noteType}::text = 'WINE' THEN n.extension->>'wineName' IS NOT NULL
            WHEN ${noteType}::text = 'SPIRIT' THEN n.extension->>'spiritName' IS NOT NULL
            ELSE false
          END
      )
      SELECT
        a.author_id AS user_a_id,
        b.author_id AS user_b_id,
        COUNT(DISTINCT a.match_key) AS overlap
      FROM rated_items a
      JOIN rated_items b ON a.match_key = b.match_key AND a.author_id < b.author_id
      GROUP BY a.author_id, b.author_id
      HAVING COUNT(DISTINCT a.match_key) >= 5
    `;

    // Convert BigInt overlap to Number (PostgreSQL COUNT returns bigint)
    const safePairs = pairs.map((p) => ({
      user_a_id: p.user_a_id,
      user_b_id: p.user_b_id,
      overlap: Number(p.overlap),
    }));

    this.logger.log(`Category ${category}: found ${safePairs.length} pairs to compute`);

    for (const pair of safePairs) {
      try {
        await this.tssComputation.recomputePair(pair.user_a_id, pair.user_b_id, category);
      } catch (error) {
        this.logger.error(
          `Failed to compute TSS for ${pair.user_a_id}/${pair.user_b_id}/${category}`,
          error,
        );
      }
    }
  }

  private categoryToNoteType(category: TasteCategory): NoteType | null {
    switch (category) {
      case TasteCategory.RESTAURANT: return NoteType.RESTAURANT;
      case TasteCategory.WINE: return NoteType.WINE;
      case TasteCategory.SPIRIT: return NoteType.SPIRIT;
      default: return null;
    }
  }

  private async flushTssCaches() {
    // Scan and delete all p2:tss:* keys
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        'p2:tss:*',
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }
}
