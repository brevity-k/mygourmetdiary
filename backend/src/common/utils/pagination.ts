/**
 * Clamp a user-supplied limit to a safe range.
 *
 * @param limit    - Raw query-string value (may be undefined)
 * @param defaultVal - Value used when limit is falsy (default 20)
 * @param max      - Upper bound (default 100)
 */
export function clampLimit(
  limit?: number,
  defaultVal = 20,
  max = 100,
): number {
  return Math.min(Math.max(limit || defaultVal, 1), max);
}

/**
 * Paginate a cursor-based result set.
 *
 * The caller should fetch `limit + 1` rows. This helper trims the extra row,
 * determines whether more rows exist, and extracts the next cursor value.
 *
 * @param items     - Rows returned from the database (length may be limit + 1)
 * @param limit     - Requested page size
 * @param getCursor - Extracts a cursor string from the last item
 */
export function paginateResults<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string,
): { items: T[]; hasMore: boolean; nextCursor: string | null } {
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? getCursor(page[page.length - 1]) : null;
  return { items: page, hasMore, nextCursor };
}
