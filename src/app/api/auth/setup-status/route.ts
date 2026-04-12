import { NextResponse } from 'next/server';
import configManager from '@/lib/config';
import db from '@/lib/db';
import { sql } from 'drizzle-orm';
import { users } from '@/lib/db/schema';

export const runtime = 'nodejs';

export const GET = async () => {
  try {
    const setupComplete = configManager.isSetupComplete();
    
    // Check if any users exist
    let hasUsers = false;
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(users);
      hasUsers = result[0]?.count > 0;
    } catch {
      hasUsers = false;
    }

    return NextResponse.json({
      setupComplete,
      hasUsers,
    });
  } catch (err) {
    console.error('Error checking setup status:', err);
    return NextResponse.json(
      { setupComplete: false, hasUsers: false },
      { status: 500 },
    );
  }
};
