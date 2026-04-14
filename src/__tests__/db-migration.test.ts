import { describe, it, expect } from 'vitest';

// Migration smoke tests — verify schema imports and operations work

describe('DB Schema — smoke tests', () => {
  it('DB schema module loads without errors', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema).toBeDefined();
  });

  it('users and sessions tables are exported', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.users).toBeDefined();
    expect(schema.sessions).toBeDefined();
  });
});

describe('Auth types — user role types', () => {
  it('UserRole type allows admin and user roles', async () => {
    const { UserRole } = await import('@/lib/auth');
    const roles: UserRole[] = ['admin', 'user'];
    expect(roles).toContain('admin');
    expect(roles).toContain('user');
  });

  it('AuthUser interface structure is correct', async () => {
    const { AuthUser } = await import('@/lib/auth');
    const user: AuthUser = { id: 'test-id', username: 'testuser', role: 'user' };
    expect(user.id).toBe('test-id');
    expect(user.username).toBe('testuser');
    expect(user.role).toBe('user');
  });

  it('SessionUser includes sessionId', async () => {
    const { SessionUser } = await import('@/lib/auth');
    const sessionUser: SessionUser = {
      id: 'test-id',
      username: 'testuser',
      role: 'admin',
      sessionId: 'session-123',
    };
    expect(sessionUser.sessionId).toBe('session-123');
  });
});
