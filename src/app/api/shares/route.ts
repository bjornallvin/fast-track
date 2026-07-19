import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import type { FastingSession, GroupSession, Share } from '@/types';
import { GROUP_TTL } from '@/utils/groups';
import { generateShareId } from '@/utils/shareId';

// POST /api/shares — create a configurable share.
// Body: { source: { kind, id }, scope?, participantId?, show, auth }
// Ownership is proven with an existing token:
//   session          → session.editToken
//   group + "all"     → group.editToken
//   group + "just me" → that participant's reportToken (or the organizer's editToken)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, scope, participantId, show, auth } = body ?? {};

    if (!source || (source.kind !== 'session' && source.kind !== 'group') || !source.id) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    let resolvedScope: 'all' | 'participant';
    let resolvedParticipantId: string | undefined;

    if (source.kind === 'session') {
      const session = await kv.get<FastingSession>(`session:${source.id}`);
      if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (!auth || auth !== session.editToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      resolvedScope = 'participant'; // one person; scope is moot
    } else {
      const group = await kv.get<GroupSession>(`group:${source.id}`);
      if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      if (scope === 'participant') {
        const p = group.participants.find(pp => pp.id === participantId);
        if (!p) return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
        if (!auth || (auth !== group.editToken && auth !== p.reportToken)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        resolvedScope = 'participant';
        resolvedParticipantId = p.id;
      } else {
        if (!auth || auth !== group.editToken) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        resolvedScope = 'all';
      }
    }

    const share: Share = {
      id: generateShareId(),
      createdAt: new Date(),
      source: { kind: source.kind, id: source.id },
      scope: resolvedScope,
      ...(resolvedParticipantId ? { participantId: resolvedParticipantId } : {}),
      show: {
        bodyMetrics: !!show?.bodyMetrics,
        checkins: !!show?.checkins,
        journal: !!show?.journal,
      },
    };

    await kv.set(`share:${share.id}`, share, { ex: GROUP_TTL });
    return NextResponse.json({ shareId: share.id });
  } catch (error) {
    console.error('Create share error:', error);
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
  }
}
