import type { GroupSession, GroupSessionPublic } from '@/types';

export const GROUP_TTL = 7776000; // 90 days, matching session:{id}

// Chart colors assigned to participants in join order (mock palette first)
export const PARTICIPANT_COLORS = [
  '#b5643f', // clay
  '#7c8a6b', // sage
  '#8a5a6b', // plum
  '#c9954a', // ochre
  '#4a6b8a', // steel blue
  '#6b7c4a', // olive
  '#a04a4a', // brick
  '#5a6b8a', // slate
];

export function rehydrateGroup(group: GroupSession): GroupSession {
  return {
    ...group,
    startTime: new Date(group.startTime),
    endTime: group.endTime ? new Date(group.endTime) : null,
    createdAt: new Date(group.createdAt),
    participants: group.participants.map(p => ({
      ...p,
      joinedAt: new Date(p.joinedAt),
      entries: p.entries.map(e => ({ ...e, timestamp: new Date(e.timestamp) })),
      bodyMetrics: p.bodyMetrics.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
      notes: (p.notes ?? []).map(n => ({ ...n, timestamp: new Date(n.timestamp) })),
    })),
  };
}

// Strip every token before anything leaves the server (requirement 6),
// resolving the caller's role from the token they presented.
export function toPublic(group: GroupSession, token: string | null): GroupSessionPublic {
  const matched = token ? group.participants.find(p => p.reportToken === token) : undefined;
  const role = token && token === group.editToken ? 'organizer' : matched ? 'participant' : 'viewer';
  return {
    id: group.id,
    name: group.name,
    startTime: group.startTime,
    targetDuration: group.targetDuration,
    endTime: group.endTime ?? null,
    createdAt: group.createdAt,
    participants: group.participants.map(({ reportToken: _reportToken, ...rest }) => rest),
    role,
    ...(matched ? { participantId: matched.id } : {}),
  };
}

// Same display name twice → "Anna" / "Anna (2)"
export function disambiguateName(name: string, existing: string[]): string {
  const trimmed = name.trim();
  if (!existing.includes(trimmed)) return trimmed;
  let n = 2;
  while (existing.includes(`${trimmed} (${n})`)) n++;
  return `${trimmed} (${n})`;
}

// Rehydrate a GroupSessionPublic fetched as JSON on the client
export function rehydratePublicGroup(group: GroupSessionPublic): GroupSessionPublic {
  return {
    ...group,
    startTime: new Date(group.startTime),
    endTime: group.endTime ? new Date(group.endTime) : null,
    createdAt: new Date(group.createdAt),
    participants: group.participants.map(p => ({
      ...p,
      joinedAt: new Date(p.joinedAt),
      entries: p.entries.map(e => ({ ...e, timestamp: new Date(e.timestamp) })),
      bodyMetrics: p.bodyMetrics.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
      notes: (p.notes ?? []).map(n => ({ ...n, timestamp: new Date(n.timestamp) })),
    })),
  };
}
