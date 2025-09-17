import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import type { FastingSession } from '@/types';

// GET: Load session from KV
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await kv.get<FastingSession>(`session:${id}`);

    if (!session) {
      return NextResponse.json(null, { status: 404 });
    }

    // Convert date strings back to Date objects
    const sessionWithDates = {
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : null,
      entries: session.entries.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      })),
      bodyMetrics: session.bodyMetrics.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })),
      notes: session.notes.map(n => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
    };

    return NextResponse.json(sessionWithDates);
  } catch (error) {
    console.error('Error loading session:', error);
    // In development, KV might not be configured
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

// POST: Save session to KV
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await request.json();

    // Store with 90-day expiry (in seconds)
    await kv.set(`session:${id}`, session, { ex: 7776000 });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error saving session:', error);
    // In development, KV might not be configured
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ success: true, id });
    }
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

// DELETE: Remove session from KV
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await kv.del(`session:${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}