import { User } from '@prisma/client';

const SENSITIVE_FIELDS = ['firebaseUid', 'rcCustomerId', 'subscriptionExpiresAt', 'updatedAt'] as const;

/**
 * Strip sensitive fields from a User record before returning to the client.
 */
export function sanitizeUser(user: User): Omit<User, (typeof SENSITIVE_FIELDS)[number]> {
  const result = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete (result as Record<string, unknown>)[field];
  }
  return result as Omit<User, (typeof SENSITIVE_FIELDS)[number]>;
}
