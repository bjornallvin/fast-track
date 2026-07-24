'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { isValidSessionId } from '@/utils/sessionId';
import type { FastingSession, CheckinEntry, BodyMetric, JournalEntry } from '@/types';
import type { SessionLink } from '@/types/sessionLink';
import SharedTimerHero from '@/components/SharedTimerHero';
import FastingStageCard from '@/components/FastingStageCard';
import Wordmark from '@/components/Wordmark';
import ProgressChart from '@/components/ProgressChart';
import { formatSwedishDateTime } from '@/utils/dateFormat';

const METRIC_CARDS: {
  key: 'energy' | 'hunger' | 'mentalClarity' | 'mood' | 'physicalComfort';
  label: string;
  clay?: boolean;
}[] = [
  { key: 'energy', label: 'Energy' },
  { key: 'hunger', label: 'Hunger', clay: true },
  { key: 'mentalClarity', label: 'Mental clarity' },
  { key: 'mood', label: 'Mood' },
  { key: 'physicalComfort', label: 'Physical comfort' },
];

export default function ViewSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<FastingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidSessionId(sessionId)) {
      setError('Invalid session ID');
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const kvSession = await response.json();
          if (kvSession) {
            const sessionWithDates: FastingSession = {
              ...kvSession,
              startTime: new Date(kvSession.startTime),
              endTime: kvSession.endTime ? new Date(kvSession.endTime) : null,
              entries: kvSession.entries.map((e: CheckinEntry) => ({
                ...e,
                timestamp: new Date(e.timestamp),
              })),
              bodyMetrics: kvSession.bodyMetrics.map((m: BodyMetric) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
              notes: kvSession.notes.map((n: JournalEntry) => ({
                ...n,
                timestamp: new Date(n.timestamp),
              })),
            };
            setSession(sessionWithDates);

            const sessionLink: SessionLink = {
              id: sessionId,
              name: sessionWithDates.name,
              type: 'readonly',
              lastAccessed: new Date(),
              startTime: sessionWithDates.startTime,
              targetDuration: sessionWithDates.targetDuration,
              isActive: sessionWithDates.isActive,
            };
            const storedLinks = localStorage.getItem('sessionLinks');
            const links: SessionLink[] = storedLinks ? JSON.parse(storedLinks) : [];
            const existingIndex = links.findIndex(
              l => l.id === sessionId && l.type === 'readonly'
            );
            if (existingIndex !== -1) {
              links[existingIndex].lastAccessed = new Date();
              links[existingIndex].name = sessionWithDates.name;
              links[existingIndex].isActive = sessionWithDates.isActive;
            } else {
              links.push(sessionLink);
            }
            localStorage.setItem('sessionLinks', JSON.stringify(links));
          } else {
            setError('Session not found');
          }
        } else if (response.status === 404) {
          setError('Session not found');
        } else {
          setError('Failed to load session');
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const latest = useMemo(() => {
    if (!session || session.entries.length === 0) return null;
    return [...session.entries].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )[0];
  }, [session]);

  const stats = useMemo(() => {
    if (!session) return null;
    const avgEnergy =
      session.entries.length > 0
        ? (
            session.entries.reduce((sum, e) => sum + e.energy, 0) / session.entries.length
          ).toFixed(1)
        : null;
    const weights = [...session.bodyMetrics]
      .filter(m => m.weight !== undefined)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const weightChange =
      weights.length > 1
        ? (weights[weights.length - 1].weight! - weights[0].weight!).toFixed(1)
        : null;
    return { avgEnergy, weightChange, checkins: session.entries.length };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif italic text-muted">
        loading the fast…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif font-medium text-3xl mb-2">
            {error || 'Session not found'}
          </h1>
          <p className="text-muted">
            This fast may have been deleted, or the link is wrong.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-7 py-9 pb-20">
      <header className="flex justify-between items-center mb-6">
        <Wordmark />
        <span className="text-[11px] text-sage border border-sage rounded-full px-2.5 py-[3px] tracking-wide">
          shared · read-only
        </span>
      </header>

      <h1 className="font-serif font-medium text-4xl tracking-tight">{session.name}</h1>
      <div className="font-serif italic text-muted mt-0.5 mb-6">
        this fast, hour by hour — following along
      </div>

      <div className="mb-7">
        <SharedTimerHero
          eyebrow={session.isActive ? 'Currently fasting' : 'The fast has ended'}
          startTime={session.startTime}
          targetDuration={session.targetDuration}
          endTime={session.isActive ? null : session.endTime}
        />
      </div>

      <FastingStageCard
        startTime={session.startTime}
        endTime={session.isActive ? null : session.endTime}
        className="mb-6"
      />

      {stats && (
        <div className="grid grid-cols-3 gap-3.5 mb-7">
          <div className="bg-card border border-line rounded-2xl px-4 py-4">
            <div className="text-xs text-muted">Check-ins</div>
            <div className="font-serif font-medium text-3xl tracking-tight mt-0.5">
              {stats.checkins}
            </div>
          </div>
          <div className="bg-card border border-line rounded-2xl px-4 py-4">
            <div className="text-xs text-muted">Avg energy</div>
            <div className="font-serif font-medium text-3xl tracking-tight mt-0.5">
              {stats.avgEnergy ?? '—'}
              {stats.avgEnergy && <span className="text-sm text-muted">/10</span>}
            </div>
          </div>
          <div className="bg-card border border-line rounded-2xl px-4 py-4">
            <div className="text-xs text-muted">Weight change</div>
            <div className="font-serif font-medium text-3xl tracking-tight mt-0.5">
              {stats.weightChange ? (
                <>
                  {Number(stats.weightChange) > 0 ? '+' : ''}
                  {stats.weightChange}
                  <span className="text-sm text-muted"> kg</span>
                </>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      )}

      {latest && (
        <>
          <h3 className="font-serif font-medium text-xl mb-3.5 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
            How they feel
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-7">
            {METRIC_CARDS.map(card => {
              const value = latest[card.key];
              return (
                <div key={card.key} className="bg-card border border-line rounded-2xl px-5 py-4.5">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm font-semibold">{card.label}</span>
                    <span className="font-serif font-medium text-[22px]">
                      {value}
                      <span className="text-[13px] text-muted font-sans">/10</span>
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span
                        key={i}
                        className={`w-[15px] h-[15px] rounded-full border-[1.5px] ${
                          card.clay ? 'border-clay' : 'border-sage'
                        } ${i < value ? (card.clay ? 'bg-clay' : 'bg-sage') : ''}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="space-y-6">
        <ProgressChart
          entries={session.entries}
          startTime={session.startTime}
          endTime={session.isActive ? null : session.endTime}
        />

        {session.bodyMetrics.length > 0 && (
          <div className="bg-card border border-line rounded-2xl px-5 py-5">
            <h3 className="font-serif font-medium text-lg mb-3">Body</h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {[...session.bodyMetrics]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map(metric => (
                  <div
                    key={metric.id}
                    className="flex justify-between text-sm px-3 py-2 rounded-lg bg-paper border border-line/60"
                  >
                    <span className="text-muted">{formatSwedishDateTime(metric.timestamp)}</span>
                    <div className="flex gap-4">
                      {metric.weight !== undefined && <span>{metric.weight} kg</span>}
                      {metric.bodyFatPercentage !== undefined && (
                        <span>{metric.bodyFatPercentage}%</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {session.notes.length > 0 && (
          <div className="bg-card border border-line rounded-2xl px-5 py-5">
            <h3 className="font-serif font-medium text-lg mb-3">Journal</h3>
            <div className="space-y-4">
              {[...session.notes]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map(note => (
                  <div key={note.id} className="border-l-[3px] border-ochre pl-4 py-1">
                    <div className="text-xs text-muted mb-1">
                      {formatSwedishDateTime(note.timestamp)}
                    </div>
                    <p className="whitespace-pre-wrap text-[15px]">{note.content}</p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {note.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-paper border border-line text-muted px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-9">
        <a href="/" className="text-clay underline text-sm">
          Start your own fast →
        </a>
      </div>

      <div className="text-center mt-8 text-xs text-muted font-serif italic">
        Swedish time · YYYY-MM-DD HH:mm · export as JSON or CSV anytime
      </div>
    </div>
  );
}
