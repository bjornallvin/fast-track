import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import type { FastingSession, GroupSession, Share } from '@/types';
import { rehydrateGroup } from '@/utils/groups';
import {
  rehydrateSession,
  sanitizeSessionShare,
  sanitizeGroupShare,
} from '@/utils/shareSanitize';

// GET /api/shares/[shareId] — return the sanitized payload for a share.
// No auth: the opaque shareId IS the credential. Returns only permitted data.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  try {
    const share = await kv.get<Share>(`share:${shareId}`);
    if (!share) return NextResponse.json(null, { status: 404 });

    if (share.source.kind === 'session') {
      const session = await kv.get<FastingSession>(`session:${share.source.id}`);
      if (!session) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(sanitizeSessionShare(rehydrateSession(session), share));
    }

    const group = await kv.get<GroupSession>(`group:${share.source.id}`);
    if (!group) return NextResponse.json(null, { status: 404 });
    const payload = sanitizeGroupShare(rehydrateGroup(group), share);
    if (!payload) return NextResponse.json(null, { status: 404 }); // scoped participant gone
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Load share error:', error);
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to load share' }, { status: 500 });
  }
}

// DELETE /api/shares/[shareId]?auth=<token> — revoke a share. Requires the same
// ownership proof as creation (source edit token, or the scoped participant's
// report token).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const auth = new URL(request.url).searchParams.get('auth');
  try {
    const share = await kv.get<Share>(`share:${shareId}`);
    if (!share) return NextResponse.json({ success: true }); // already gone

    let ok = false;
    if (share.source.kind === 'session') {
      const session = await kv.get<FastingSession>(`session:${share.source.id}`);
      ok = !!session && !!auth && auth === session.editToken;
    } else {
      const group = await kv.get<GroupSession>(`group:${share.source.id}`);
      if (group && auth) {
        if (auth === group.editToken) ok = true;
        else if (share.scope === 'participant') {
          const p = group.participants.find(pp => pp.id === share.participantId);
          ok = !!p && auth === p.reportToken;
        }
      }
    }

    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    await kv.del(`share:${shareId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete share error:', error);
    return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 });
  }
}
