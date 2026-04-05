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
