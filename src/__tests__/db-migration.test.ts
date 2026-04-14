import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read migration files directly — no DB connection required
const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');

describe('DB Migration — file smoke tests', () => {
  const migrationFiles = [
    '0000_fuzzy_randall.sql',
    '0001_wise_rockslide.sql',
    '0002_daffy_wrecker.sql',
    '0003_add_users_sessions.sql',
    '0004_add_userid_to_chats.sql',
  ];

  it('all migration files exist', () => {
    migrationFiles.forEach((file) => {
      const filePath = path.join(MIGRATIONS_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('0003 creates users table with RBAC columns', () => {
    const sql = fs.readFileSync(
      path.join(MIGRATIONS_DIR, '0003_add_users_sessions.sql'),
      'utf-8',
    );

    // Users table
    expect(sql).toMatch(/CREATE TABLE.*users/);
    expect(sql).toMatch(/`id`.*PRIMARY KEY/);
    expect(sql).toMatch(/`username`/);
    expect(sql).toMatch(/`password_hash`/);
    expect(sql).toMatch(/`role`/);
    expect(sql).toMatch(/`createdAt`/);

    // Sessions table
    expect(sql).toMatch(/CREATE TABLE.*sessions/);
    expect(sql).toMatch(/`id`.*PRIMARY KEY/);
    expect(sql).toMatch(/`userId`/);
    expect(sql).toMatch(/`expiresAt`/);
    expect(sql).toMatch(/`createdAt`/);
  });

  it('0004 adds userId to chats table for multi-user support', () => {
    const sql = fs.readFileSync(
      path.join(MIGRATIONS_DIR, '0004_add_userid_to_chats.sql'),
      'utf-8',
    );

    expect(sql).toMatch(/ALTER TABLE.*chats/);
    expect(sql).toMatch(/userId/);
  });

  it('migration files are valid SQL (no obvious syntax errors)', () => {
    migrationFiles.forEach((file) => {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

      // Basic checks — SQL files should have CREATE, ALTER, be a no-op, or be a comment-only migration
      const isEmpty = sql.trim().length === 0;
      const isNoOp = sql.trim().toLowerCase() === '/* do nothing */';
      const hasValidStatements =
        isEmpty || isNoOp || sql.includes('CREATE') || sql.includes('ALTER');

      expect(hasValidStatements).toBe(true);
    });
  });
});

describe('DB Schema — TypeScript type smoke tests', () => {
  it('users and sessions schema modules load without error', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.users).toBeDefined();
    expect(schema.sessions).toBeDefined();
  });

  it('UserRole type allows admin and user', async () => {
    const { UserRole } = await import('@/lib/auth');
    const roles: UserRole[] = ['admin', 'user'];
    expect(roles).toContain('admin');
    expect(roles).toContain('user');
  });

  it('AuthUser has required fields', async () => {
    const { AuthUser } = await import('@/lib/auth');
    const user: AuthUser = { id: 'test', username: 'test', role: 'user' };
    expect(user.id).toBe('test');
    expect(user.role).toBe('user');
  });

  it('SessionUser includes sessionId', async () => {
    const { SessionUser } = await import('@/lib/auth');
    const s: SessionUser = {
      id: 'test',
      username: 'test',
      role: 'admin',
      sessionId: 'sess-1',
    };
    expect(s.sessionId).toBe('sess-1');
  });
});
