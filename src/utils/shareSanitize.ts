import type {
  FastingSession,
  GroupSession,
  Share,
  SharePayload,
  SharePerson,
  ShareVisibility,
} from '@/types';

// The single enforcement point for spec 003. Everything a share exposes flows
// through here, and it is fail-closed: any field or participant not explicitly
// permitted by the config is omitted. Tokens are never carried into the output.

function normShow(show: Partial<ShareVisibility> | undefined): ShareVisibility {
  return {
    bodyMetrics: !!show?.bodyMetrics,
    checkins: !!show?.checkins,
    journal: !!show?.journal,
  };
}

function filterPerson(base: SharePerson, show: ShareVisibility): SharePerson {
  return {
    id: base.id,
    name: base.name,
    color: base.color,
    joinedAt: base.joinedAt,
    entries: show.checkins ? base.entries : [],
    bodyMetrics: show.bodyMetrics ? base.bodyMetrics : [],
    notes: show.journal ? base.notes : [],
  };
}

// Rehydrate a session's Date fields (mirrors the sessions GET route).
export function rehydrateSession(session: FastingSession): FastingSession {
  return {
    ...session,
    startTime: new Date(session.startTime),
    endTime: session.endTime ? new Date(session.endTime) : null,
    entries: session.entries.map(e => ({ ...e, timestamp: new Date(e.timestamp) })),
    bodyMetrics: session.bodyMetrics.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
    notes: session.notes.map(n => ({ ...n, timestamp: new Date(n.timestamp) })),
  };
}

export function sanitizeSessionShare(session: FastingSession, share: Share): SharePayload {
  const show = normShow(share.show);
  return {
    shareId: share.id,
    kind: 'session',
    scope: 'participant',
    title: session.name,
    startTime: session.startTime,
    targetDuration: session.targetDuration,
    endTime: session.endTime ?? null,
    show,
    people: [
      filterPerson(
        {
          id: session.id,
          name: session.name,
          joinedAt: session.startTime,
          entries: session.entries,
          bodyMetrics: session.bodyMetrics,
          notes: session.notes,
        },
        show
      ),
    ],
  };
}

// Returns null when the share targets a participant who no longer exists
// (removed after sharing) — the route turns that into a graceful 404.
export function sanitizeGroupShare(group: GroupSession, share: Share): SharePayload | null {
  const show = normShow(share.show);
  let participants = group.participants;
  if (share.scope === 'participant') {
    const one = group.participants.find(p => p.id === share.participantId);
    if (!one) return null;
    participants = [one];
  }
  return {
    shareId: share.id,
    kind: 'group',
    scope: share.scope,
    title: group.name,
    startTime: group.startTime,
    targetDuration: group.targetDuration,
    endTime: group.endTime ?? null,
    show,
    people: participants.map(p =>
      filterPerson(
        {
          id: p.id,
          name: p.name,
          color: p.color,
          joinedAt: p.joinedAt,
          entries: p.entries,
          bodyMetrics: p.bodyMetrics,
          notes: p.notes ?? [],
        },
        show
      )
    ),
  };
}
