import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { FastingSession } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Scan all session keys and check for matching email
    const normalizedEmail = email.toLowerCase();
    const sessions: FastingSession[] = [];

    // Use SCAN to iterate through all session keys
    let cursor: string | number = 0;
    do {
      const result = await kv.scan(cursor, { match: 'session:*', count: 100 });
      cursor = result[0];
      const keys = result[1] as string[];

      // Fetch all sessions in this batch
      for (const key of keys) {
        const session = await kv.get<FastingSession>(key);
        if (session && session.email && session.email.toLowerCase() === normalizedEmail) {
          sessions.push(session);
        }
      }
    } while (cursor !== 0 && cursor !== '0');

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found for this email' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
