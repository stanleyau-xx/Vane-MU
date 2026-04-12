import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByUsername, verifyPassword, createSession } from '@/lib/auth';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const runtime = 'nodejs';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parse = loginSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { message: 'Invalid request', errors: parse.error.issues },
        { status: 400 },
      );
    }

    const { username, password } = parse.data;

    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 },
      );
    }

    const token = await createSession({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('vane_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 },
    );
  }
};
