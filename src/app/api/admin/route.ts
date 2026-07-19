import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import type { FastingSession, GroupSession } from '@/types';

// Admin API — everything requires the ADMIN_TOKEN env secret.
// POST body: { token, action: 'overview' } |
//            { token, action: 'delete', kind: 'session' | 'group', id }
// Token travels in the body (never a URL) to keep it out of logs.

async function scanKeys(match: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | number = 0;
  do {
    const result: [string | number, string[]] = await kv.scan(cursor, { match, count: 100 });
    cursor = result[0];
    keys.push(...(result[1] as string[]));
  } while (cursor !== 0 && cursor !== '0');
  return keys;
}

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'Admin is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    if (!body.token || body.token !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (body.action === 'overview') {
      const [sessionKeys, groupKeys] = await Promise.all([
        scanKeys('session:*'),
        scanKeys('group:*'),
      ]);

      const sessions = (
        await Promise.all(sessionKeys.map(key => kv.get<FastingSession>(key)))
      )
        .filter((s): s is FastingSession => s !== null)
        .map(s => ({
          id: s.id,
          name: s.name,
          startTime: s.startTime,
          targetDuration: s.targetDuration,
          isActive: s.isActive,
          email: s.email ?? null,
          editToken: s.editToken ?? null,
          checkins: s.entries.length,
          bodyMetrics: s.bodyMetrics.length,
          notes: s.notes.length,
        }));

      const groups = (
        await Promise.all(groupKeys.map(key => kv.get<GroupSession>(key)))
      )
        .filter((g): g is GroupSession => g !== null)
        .map(g => ({
          id: g.id,
          name: g.name,
          startTime: g.startTime,
          targetDuration: g.targetDuration,
          endTime: g.endTime ?? null,
          createdAt: g.createdAt,
          email: g.email ?? null,
          editToken: g.editToken,
          participants: g.participants.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email ?? null,
            reportToken: p.reportToken,
            joinedAt: p.joinedAt,
            checkins: p.entries.length,
            bodyMetrics: p.bodyMetrics.length,
          })),
        }));

      return NextResponse.json({ sessions, groups });
    }

    if (body.action === 'delete') {
      const { kind, id } = body;
      if ((kind !== 'session' && kind !== 'group') || !id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid delete request' }, { status: 400 });
      }
      await kv.del(`${kind}:${id}`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Admin request failed' }, { status: 500 });
  }
}
