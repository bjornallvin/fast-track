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

    // No check-ins before the fast starts. After it ends, logging stays open —
    // post-fast entries (timestamp > endTime) show what happens once eating resumes.
    const started = new Date(group.startTime).getTime() <= Date.now();
    if (!started) {
      return NextResponse.json({ error: 'Fast has not started yet' }, { status: 409 });
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

// PATCH: a participant edits or deletes one of their OWN entries, guarded by
// their report token. Fixing a mistake is allowed even after the fast ends.
// Body: { token, editCheckin? } | { token, deleteCheckinId? } |
//       { token, editBodyMetric? } | { token, deleteBodyMetricId? }
export async function PATCH(
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
        let entries = p.entries;
        let bodyMetrics = p.bodyMetrics;
        if (body.editCheckin?.id) {
          entries = entries.map(e =>
            e.id === body.editCheckin.id ? { ...(body.editCheckin as CheckinEntry) } : e
          );
        }
        if (body.deleteCheckinId) {
          entries = entries.filter(e => e.id !== body.deleteCheckinId);
        }
        if (body.editBodyMetric?.id) {
          bodyMetrics = bodyMetrics.map(m =>
            m.id === body.editBodyMetric.id ? { ...(body.editBodyMetric as BodyMetric) } : m
          );
        }
        if (body.deleteBodyMetricId) {
          bodyMetrics = bodyMetrics.filter(m => m.id !== body.deleteBodyMetricId);
        }
        return { ...p, entries, bodyMetrics };
      }),
    };
    await kv.set(`group:${id}`, updated, { ex: GROUP_TTL });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editing entry:', error);
    return NextResponse.json({ error: 'Failed to edit entry' }, { status: 500 });
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
