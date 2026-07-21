import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import type { FastingSession, GroupSession } from '@/types';
import { EMAIL_REGEX } from '@/utils/sendEmail';

const SESSION_TTL = 7776000; // keep the same 90-day expiry on rewrite

// Admin API — everything requires the ADMIN_TOKEN env secret.
// POST body: { token, action: 'overview' } |
//            { token, action: 'delete', kind: 'session' | 'group', id } |
//            { token, action: 'set-email', kind: 'session' | 'group' | 'participant',
//              id, participantId?, email }   — empty email clears it
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

    if (body.action === 'clear-data') {
      const { kind, id } = body;
      if ((kind !== 'session' && kind !== 'group') || !id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid clear-data request' }, { status: 400 });
      }
      if (kind === 'session') {
        const session = await kv.get<FastingSession>(`session:${id}`);
        if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        await kv.set(
          `session:${id}`,
          { ...session, entries: [], bodyMetrics: [], notes: [] },
          { ex: SESSION_TTL }
        );
        return NextResponse.json({ success: true });
      }
      const group = await kv.get<GroupSession>(`group:${id}`);
      if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await kv.set(
        `group:${id}`,
        {
          ...group,
          participants: group.participants.map(p => ({
            ...p,
            entries: [],
            bodyMetrics: [],
            notes: [],
          })),
        },
        { ex: SESSION_TTL }
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === 'delete') {
      const { kind, id } = body;
      if ((kind !== 'session' && kind !== 'group') || !id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid delete request' }, { status: 400 });
      }
      await kv.del(`${kind}:${id}`);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'set-email') {
      const { kind, id, participantId } = body;
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (email && !EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }

      if (kind === 'session') {
        const session = await kv.get<FastingSession>(`session:${id}`);
        if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const updated = { ...session, email: email || undefined };
        await kv.set(`session:${id}`, updated, { ex: SESSION_TTL });
        return NextResponse.json({ success: true, email: email || null });
      }

      if (kind === 'group' || kind === 'participant') {
        const group = await kv.get<GroupSession>(`group:${id}`);
        if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        let updated: GroupSession;
        if (kind === 'group') {
          updated = { ...group, email: email || undefined };
        } else {
          if (!group.participants.some(p => p.id === participantId)) {
            return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
          }
          updated = {
            ...group,
            participants: group.participants.map(p =>
              p.id === participantId ? { ...p, email: email || undefined } : p
            ),
          };
        }
        await kv.set(`group:${id}`, updated, { ex: SESSION_TTL });
        return NextResponse.json({ success: true, email: email || null });
      }

      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }

    if (body.action === 'set-name') {
      const { kind, id, participantId } = body;
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!id || typeof id !== 'string' || !name) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }

      if (kind === 'session') {
        const session = await kv.get<FastingSession>(`session:${id}`);
        if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        await kv.set(`session:${id}`, { ...session, name }, { ex: SESSION_TTL });
        return NextResponse.json({ success: true, name });
      }

      if (kind === 'group' || kind === 'participant') {
        const group = await kv.get<GroupSession>(`group:${id}`);
        if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        let updated: GroupSession;
        if (kind === 'group') {
          updated = { ...group, name };
        } else {
          if (!group.participants.some(p => p.id === participantId)) {
            return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
          }
          updated = {
            ...group,
            participants: group.participants.map(p =>
              p.id === participantId ? { ...p, name } : p
            ),
          };
        }
        await kv.set(`group:${id}`, updated, { ex: SESSION_TTL });
        return NextResponse.json({ success: true, name });
      }

      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Admin request failed' }, { status: 500 });
  }
}
