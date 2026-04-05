import { User } from '@prisma/client';

/**
 * Strip sensitive fields from a User record before returning to the client.
 * Excludes: firebaseUid, rcCustomerId, subscriptionExpiresAt, updatedAt.
 */
export function sanitizeUser(user: User) {
  const { firebaseUid, rcCustomerId, subscriptionExpiresAt, updatedAt, ...safe } = user;
  return safe;
}
