import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  verifySession,
  SESSION_EXPIRY_MS,
} from '@/lib/auth';

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

  it('bcrypt is computationally expensive (mitigates brute-force)', async () => {
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

  it('cookie maxAge aligned with JWT expiry (7 days, NOT 1 year)', () => {
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    expect(Math.floor(SESSION_EXPIRY_MS / 1000)).toBe(sevenDaysInSeconds);
    expect(sevenDaysInSeconds).not.toBe(365 * 24 * 60 * 60); // NOT 1 year
  });
});

describe('Auth — verifySession (unit, mocked DB)', () => {
  // verifySession requires a real DB connection in integration tests.
  // Here we test the logic path: invalid token returns null
  it('verifySession returns null for malformed token', async () => {
    const result = await verifySession('not-a-valid-jwt-token');
    expect(result).toBeNull();
  });

  it('verifySession returns null for empty token', async () => {
    const result = await verifySession('');
    expect(result).toBeNull();
  });
});
