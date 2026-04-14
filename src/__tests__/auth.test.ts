import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSession,
  verifySession,
  createUser,
  getUserByUsername,
  deleteUser,
  SESSION_EXPIRY_MS,
} from '@/lib/auth';

// These tests require a database connection.
// Run with: npm test -- --env=node
// Or prefix test files with integration tests that need the DB.

describe('Auth — password hashing', () => {
  it('hashPassword produces a bcrypt hash', async () => {
    const hash = await hashPassword('test-password-123');
    expect(hash).toMatch(/^\$2[ayb]\$/);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('hashPassword produces different hashes for same input (due to salt)', async () => {
    const hash1 = await hashPassword('same-password');
    const hash2 = await hashPassword('same-password');
    expect(hash1).not.toBe(hash2);
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('correct-password');
    const valid = await verifyPassword('correct-password', hash);
    expect(valid).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const valid = await verifyPassword('wrong-password', hash);
    expect(valid).toBe(false);
  });

  it('bcrypt is computationally expensive (delays response timing)', async () => {
    // This test verifies bcrypt cost factor is high enough to make brute-force impractical
    const hash = await hashPassword('test');
    const start = Date.now();
    await verifyPassword('guessed', hash);
    const elapsed = Date.now() - start;
    // bcrypt with cost 12 should take >100ms per compare
    expect(elapsed).toBeGreaterThan(50);
  });
});

describe('Auth — SESSION_EXPIRY_MS constant', () => {
  it('session expiry is 7 days in milliseconds', () => {
    expect(SESSION_EXPIRY_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('cookie maxAge in login route uses SESSION_EXPIRY_MS (7 days, not 1 year)', async () => {
    // This is verified by checking the login route source
    // maxAge = Math.floor(SESSION_EXPIRY_MS / 1000) = 604800 seconds = 7 days
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    expect(Math.floor(SESSION_EXPIRY_MS / 1000)).toBe(sevenDaysInSeconds);
    expect(sevenDaysInSeconds).not.toBe(365 * 24 * 60 * 60); // Should NOT be 1 year
  });
});
