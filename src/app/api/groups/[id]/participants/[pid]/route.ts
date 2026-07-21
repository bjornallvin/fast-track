import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import type { GroupSession, CheckinEntry, BodyMetric } from '@/types';
import { GROUP_TTL } from '@/utils/groups';

// POST: append a check-in or body metric under ONE participant, guarded by
// their report token. Cannot touch the shared timer or anyone else's data.
// Body: { token, checkin?, bodyMetric? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params;
  try {
    const body = await request.json();
    const group = await kv.get<GroupSession>(`group:${id}`);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const participant = group.participants.find(p => p.id === pid);
    if (!participant || !body.token || participant.reportToken !== body.token) {
      return NextResponse.json({ error: 'Invalid report token' }, { status: 403 });
    }

    const updated: GroupSession = {
      ...group,
      participants: group.participants.map(p => {
        if (p.id !== pid) return p;
        return {
          ...p,
          entries: body.checkin ? [...p.entries, body.checkin as CheckinEntry] : p.entries,
          bodyMetrics: body.bodyMetric
            ? [...p.bodyMetrics, body.bodyMetric as BodyMetric]
            : p.bodyMetrics,
        };
      }),
    };
    await kv.set(`group:${id}`, updated, { ex: GROUP_TTL });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reporting to group:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}

// DELETE: remove a participant (and their data) from the group. Organizer only,
// proven with the group edit token (?token=).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params;
  const token = new URL(request.url).searchParams.get('token');
  try {
    const group = await kv.get<GroupSession>(`group:${id}`);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (!token || token !== group.editToken) {
      return NextResponse.json({ error: 'Invalid edit token' }, { status: 403 });
    }
    const updated: GroupSession = {
      ...group,
      participants: group.participants.filter(p => p.id !== pid),
    };
    await kv.set(`group:${id}`, updated, { ex: GROUP_TTL });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
  }
}
