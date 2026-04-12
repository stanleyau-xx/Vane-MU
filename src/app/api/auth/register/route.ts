import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, getUserByUsername } from '@/lib/auth';
import db from '@/lib/db';
import { sql } from 'drizzle-orm';
import { users } from '@/lib/db/schema';

export const runtime = 'nodejs';

const registerSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parse = registerSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { message: 'Invalid request', errors: parse.error.issues },
        { status: 400 },
      );
    }

    const { username, password } = parse.data;

    // Check if any users exist
    let userCount = 0;
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(users);
      userCount = result[0]?.count ?? 0;
    } catch {
      userCount = 0;
    }

    // Only the first user can be created this way (must be admin)
    if (userCount > 0) {
      return NextResponse.json(
        { message: 'Registration is disabled. Please contact your administrator.' },
        { status: 403 },
      );
    }

    // Check if username already taken
    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 409 },
      );
    }

    const user = await createUser(username, password, 'admin');

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 },
    );
  }
};
