'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SharedTimerHero from '@/components/SharedTimerHero';
import FastingStageCard from '@/components/FastingStageCard';
import GroupComparisonChart from '@/components/GroupComparisonChart';
import ProgressChart from '@/components/ProgressChart';
import { formatSwedishDateTime } from '@/utils/dateFormat';
import type { GroupSessionPublic, SharePayload } from '@/types';

function rehydrate(p: SharePayload): SharePayload {
  return {
    ...p,
    startTime: new Date(p.startTime),
    endTime: p.endTime ? new Date(p.endTime) : null,
    people: p.people.map(person => ({
      ...person,
      joinedAt: new Date(person.joinedAt),
      entries: person.entries.map(e => ({ ...e, timestamp: new Date(e.timestamp) })),
      bodyMetrics: person.bodyMetrics.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
      notes: person.notes.map(n => ({ ...n, timestamp: new Date(n.timestamp) })),
    })),
  };
}

// Build a GroupSessionPublic-shaped object so we can reuse GroupComparisonChart
// for the multi-person ("all") case.
function asGroup(p: SharePayload): GroupSessionPublic {
  return {
    id: p.shareId,
    name: p.title,
    startTime: p.startTime,
    targetDuration: p.targetDuration,
    endTime: p.endTime,
    createdAt: p.startTime,
    participants: p.people.map(person => ({
      id: person.id,
      name: person.name,
      color: person.color,
      joinedAt: person.joinedAt,
      entries: person.entries,
      bodyMetrics: person.bodyMetrics,
      notes: person.notes,
    })),
    role: 'viewer',
  };
}

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'gone'>('loading');

  useEffect(() => {
    let alive = true;
    fetch(`/api/shares/${shareId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive) return;
        if (!data) return setState('gone');
        setPayload(rehydrate(data));
        setState('ready');
      })
      .catch(() => alive && setState('gone'));
    return () => {
      alive = false;
    };
  }, [shareId]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif italic text-muted">
        loading…
      </div>
    );
  }

  if (state === 'gone' || !payload) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="font-serif font-medium text-3xl mb-2">This share is no longer available</h1>
          <p className="text-muted">The link may have been revoked, or the fast has ended long ago.</p>
        </div>
      </div>
    );
  }

  const multi = payload.people.length > 1;
  const single = payload.people[0];
  const nothingShown = !payload.show.checkins && !payload.show.bodyMetrics && !payload.show.journal;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-7 py-9 pb-20">
      <header className="flex justify-between items-center mb-6">
        <a href="/" className="font-serif font-semibold text-[22px] text-ink">
          Fast<b className="text-clay">·</b>Track
        </a>
        <span className="text-[11px] text-sage border border-sage rounded-full px-2.5 py-[3px] tracking-wide">
          shared · read-only
        </span>
      </header>

      <h1 className="font-serif font-medium text-4xl tracking-tight">{payload.title}</h1>
      <div className="font-serif italic text-muted mt-0.5 mb-6">
        {payload.kind === 'group' && payload.scope === 'participant'
          ? `${single?.name}'s journey`
          : payload.kind === 'group'
            ? `one fast, ${payload.people.length} ${payload.people.length === 1 ? 'person' : 'people'}`
            : 'a fast'}
      </div>

      <div className="mb-7">
        <SharedTimerHero
          eyebrow={payload.endTime ? 'The fast has ended' : 'Fasting'}
          startTime={payload.startTime}
          targetDuration={payload.targetDuration}
          endTime={payload.endTime}
        />
      </div>

      <FastingStageCard startTime={payload.startTime} endTime={payload.endTime} className="mb-6" />

      {nothingShown && (
        <p className="text-center text-muted font-serif italic">
          The sharer chose to keep the details private.
        </p>
      )}

      {/* Wellbeing */}
      {payload.show.checkins &&
        (multi ? (
          <GroupComparisonChart group={asGroup(payload)} />
        ) : (
          single &&
          single.entries.length > 0 && (
            <div className="mb-6">
              <h3 className="font-serif font-medium text-lg mb-3">Wellbeing over the fast</h3>
              <ProgressChart entries={single.entries} startTime={payload.startTime} />
            </div>
          )
        ))}

      {/* Body metrics — latest values per person */}
      {payload.show.bodyMetrics && (
        <div className="mb-6">
          <h3 className="font-serif font-medium text-lg mb-3">Body</h3>
          <div className="grid grid-cols-2 gap-3">
            {payload.people.map(person => {
              const last = person.bodyMetrics[person.bodyMetrics.length - 1];
              return (
                <div key={person.id} className="rounded-2xl border border-line bg-card p-4">
                  {multi && <div className="text-sm font-medium mb-1">{person.name}</div>}
                  <div className="text-muted text-sm">
                    {last?.weight != null ? (
                      <span className="font-serif text-2xl text-ink">
                        {last.weight}
                        <span className="text-sm text-muted"> kg</span>
                      </span>
                    ) : (
                      <span>no weight logged</span>
                    )}
                    {last?.bodyFatPercentage != null && (
                      <span className="ml-3">{last.bodyFatPercentage}% body fat</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Journal (opt-in) */}
      {payload.show.journal && (
        <div className="mb-6">
          <h3 className="font-serif font-medium text-lg mb-3">Journal</h3>
          <div className="space-y-3">
            {payload.people.flatMap(person =>
              person.notes.map(note => (
                <div key={note.id} className="rounded-2xl border border-line bg-card p-4">
                  <div className="text-xs text-muted mb-1">
                    {multi ? `${person.name} · ` : ''}
                    {formatSwedishDateTime(note.timestamp)}
                  </div>
                  <div className="text-ink whitespace-pre-wrap">{note.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="text-center mt-10 text-xs text-muted font-serif italic">
        shared from Fast Track · read-only
      </div>
    </div>
  );
}
