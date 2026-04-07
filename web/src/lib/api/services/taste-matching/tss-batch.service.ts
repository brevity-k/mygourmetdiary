import type { TasteCategory, NoteType } from '@prisma/client';
import { prisma } from '../../clients/prisma';
import { redis, getJson, setJson } from '../../clients/redis';
import { tssComputationService } from './tss-computation.service';

const BATCH_SIZE = 50;
const CURSOR_KEY = 'tss:batch:cursor';
const CURSOR_TTL = 14400; // 4 hours
const LOCK_KEY = 'tss:batch:lock';
const LOCK_TTL = 300; // 5 min (short — one invocation)

const CATEGORIES: TasteCategory[] = ['RESTAURANT', 'WINE', 'SPIRIT'];

function categoryToNoteType(category: TasteCategory): NoteType | null {
  switch (category) {
    case 'RESTAURANT': return 'RESTAURANT';
    case 'WINE': return 'WINE';
    case 'SPIRIT': return 'SPIRIT';
    default: return null;
  }
}

export const tssBatchService = {
  /**
   * Process a chunk of user pairs for TSS computation.
   * Returns the number of pairs processed and whether more remain.
   */
  async processChunk(): Promise<{
    processed: number;
    hasMore: boolean;
    category: string;
    message: string;
  }> {
    // Acquire short-lived lock
    const acquired = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL, 'NX');
    if (!acquired) {
      return { processed: 0, hasMore: false, category: '', message: 'Already running' };
    }

    try {
      // Read cursor: "category:offset" format, e.g. "RESTAURANT:0"
      const cursorRaw = await redis.get(CURSOR_KEY);
      let categoryIdx = 0;
      let offset = 0;

      if (cursorRaw) {
        const parts = cursorRaw.split(':');
        categoryIdx = CATEGORIES.indexOf(parts[0] as TasteCategory);
        if (categoryIdx < 0) categoryIdx = 0;
        offset = parseInt(parts[1] || '0', 10) || 0;
      }

      const category = CATEGORIES[categoryIdx];
      const noteType = categoryToNoteType(category);
      if (!noteType) {
        return { processed: 0, hasMore: false, category: '', message: 'Invalid category' };
      }

      // Find user pairs with >= 5 overlapping items (chunked)
      const pairs = await prisma.$queryRaw<
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
        ORDER BY a.author_id, b.author_id
        OFFSET ${offset}
        LIMIT ${BATCH_SIZE + 1}
      `;

      const safePairs = pairs.map((p) => ({
        user_a_id: p.user_a_id,
        user_b_id: p.user_b_id,
        overlap: Number(p.overlap),
      }));

      const hasMoreInCategory = safePairs.length > BATCH_SIZE;
      const toProcess = safePairs.slice(0, BATCH_SIZE);

      // Process pairs in parallel
      let processed = 0;
      await Promise.all(
        toProcess.map(async (pair) => {
          try {
            await tssComputationService.recomputePair(pair.user_a_id, pair.user_b_id, category);
            processed++;
          } catch (error) {
            console.error(
              `Failed to compute TSS for ${pair.user_a_id}/${pair.user_b_id}/${category}`,
              error,
            );
          }
        }),
      );

      // Update cursor
      if (hasMoreInCategory) {
        // More pairs in this category
        await redis.set(CURSOR_KEY, `${category}:${offset + BATCH_SIZE}`, 'EX', CURSOR_TTL);
        return { processed, hasMore: true, category, message: `Processed ${processed} pairs for ${category}` };
      } else if (categoryIdx < CATEGORIES.length - 1) {
        // Move to next category
        const nextCategory = CATEGORIES[categoryIdx + 1];
        await redis.set(CURSOR_KEY, `${nextCategory}:0`, 'EX', CURSOR_TTL);
        return { processed, hasMore: true, category, message: `Finished ${category}, moving to ${nextCategory}` };
      } else {
        // All categories done — reset cursor and flush caches
        await redis.del(CURSOR_KEY);
        await flushTssCaches();
        return { processed, hasMore: false, category, message: 'Batch complete for all categories' };
      }
    } finally {
      await redis.del(LOCK_KEY);
    }
  },
};

async function flushTssCaches() {
  // Scan and delete all p2:tss:* keys
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(
      parseInt(cursor, 10),
      'MATCH',
      'p2:tss:*',
      'COUNT',
      100,
    );
    cursor = String(nextCursor);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== '0');
}
