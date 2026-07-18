import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import type { GroupSession, GroupParticipant } from '@/types';
import { GROUP_TTL, PARTICIPANT_COLORS, disambiguateName } from '@/utils/groups';
import { generateEditToken } from '@/utils/editToken';
import { generateId } from '@/utils/calculations';

// POST: join the group — creates a participant and returns their report token.
// This is the only response that ever contains a token, and only the new
// participant's own. Body: { name }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const group = await kv.get<GroupSession>(`group:${id}`);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (group.endTime) {
      return NextResponse.json({ error: 'This fast has already ended' }, { status: 400 });
    }

    const displayName = disambiguateName(name, group.participants.map(p => p.name));
    const participant: GroupParticipant = {
      id: generateId(),
      name: displayName,
      color: PARTICIPANT_COLORS[group.participants.length % PARTICIPANT_COLORS.length],
      reportToken: generateEditToken(),
      joinedAt: new Date(),
      entries: [],
      bodyMetrics: [],
      notes: [],
    };

    const updated: GroupSession = {
      ...group,
      participants: [...group.participants, participant],
    };
    await kv.set(`group:${id}`, updated, { ex: GROUP_TTL });

    return NextResponse.json({
      success: true,
      participantId: participant.id,
      name: participant.name,
      reportToken: participant.reportToken,
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
