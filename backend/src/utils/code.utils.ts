import crypto from 'crypto';

/**
 * Generates a cryptographically random invitation code like "AB3F-9E2C"
 */
export function generateInvitationCode(): string {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${part1}-${part2}`;
}
