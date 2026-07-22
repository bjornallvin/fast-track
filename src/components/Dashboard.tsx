'use client';

import { useMemo, useState } from 'react';
import SharedTimerHero from './SharedTimerHero';
import FastingStageCard from './FastingStageCard';
import CheckinForm from './CheckinForm';
import Journal from './Journal';
import BodyMetrics from './BodyMetrics';
import ProgressChart from './ProgressChart';
import SessionSelector from './SessionSelector';
import NewSessionDialog from './NewSessionDialog';
import ShareButton from './ShareButton';
import ShareDialog from './ShareDialog';
import ResetFastDialog from './ResetFastDialog';
import type { FastingSession, CheckinEntry, BodyMetric } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';
import { exportSessionData, exportSessionDataAsCSV } from '../utils/dataExport';
import { calculateElapsedTime } from '../utils/calculations';

interface DashboardProps {
  session: FastingSession | null;
  activeSessionId: string | null;
  showNewSessionDialog: boolean;
  onAddCheckin: (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => void;
  onAddBodyMetric: (metric: Omit<BodyMetric, 'id' | 'timestamp'>) => void;
  onAddJournalEntry: (content: string, tags: string[]) => void;
  onEndFast: () => void;
  onUpdateSession?: (updates: Partial<FastingSession>) => void;
  onImportSession?: (session: FastingSession) => void;
  onCreateNewSession: (name: string, startTime: Date, targetDuration: number) => void;
  setShowNewSessionDialog: (show: boolean) => void;
}

const DAY_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

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

const Dashboard: React.FC<DashboardProps> = ({
  session,
  activeSessionId,
  showNewSessionDialog,
  onAddCheckin,
  onAddBodyMetric,
  onAddJournalEntry,
  onEndFast,
  onUpdateSession,
  onCreateNewSession,
  setShowNewSessionDialog,
}) => {
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const latest = useMemo(() => {
    if (!session || session.entries.length === 0) return null;
    return [...session.entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }, [session]);

  const [latestBody, previousBody] = useMemo(() => {
    if (!session || session.bodyMetrics.length === 0) return [null, null];
    const sorted = [...session.bodyMetrics].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return [sorted[0], sorted[1] ?? null];
  }, [session]);

  const dayLabel = useMemo(() => {
    if (!session) return '';
    if (session.isActive && new Date(session.startTime).getTime() > Date.now()) {
      return 'starts soon';
    }
    const elapsed = session.endTime
      ? (session.endTime.getTime() - session.startTime.getTime()) / 3600000
      : calculateElapsedTime(session.startTime, session.targetDuration).totalHours;
    const day = Math.max(1, Math.floor(elapsed / 24) + 1);
    return `day ${DAY_WORDS[day - 1] ?? day}`;
  }, [session]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-7 py-10 pb-20">
      <header className="flex justify-between items-center mb-9 gap-4 flex-wrap">
        <a href="/" className="font-serif font-semibold text-2xl tracking-tight text-ink">
          Fast<b className="text-clay">·</b>Track
        </a>
        <div className="flex items-center gap-3">
          {session && (
            <span className="text-[13px] text-muted hidden sm:inline">
              A quiet fast for <b className="text-ink font-semibold">{session.name}</b> · {dayLabel}
            </span>
          )}
          <SessionSelector
            currentSessionId={activeSessionId}
            currentSessionName={session?.name}
            onCreateNew={() => setShowNewSessionDialog(true)}
          />
        </div>
      </header>

      {!session ? (
        <div className="bg-card border border-line rounded-2xl p-10 text-center">
          <p className="font-serif italic text-muted mb-5">
            no active fast here — begin one to start the clock
          </p>
          <button
            onClick={() => setShowNewSessionDialog(true)}
            className="bg-clay text-white px-8 py-3.5 rounded-2xl font-semibold cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90"
          >
            ＋ Start a new fast
          </button>
        </div>
      ) : (
        <>
          <SharedTimerHero
            eyebrow={session.isActive ? 'Currently fasting' : 'The fast has ended'}
            startTime={session.startTime}
            targetDuration={session.targetDuration}
            endTime={session.isActive ? null : session.endTime}
          />

          <div className="mt-8 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:items-start">
          <div>
          {latest && (
            <>
              <h3 className="font-serif font-medium text-xl mt-9 mb-3.5 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
                How you feel
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              <p className="text-xs text-muted font-serif italic mt-3">
                last check-in {formatSwedishDateTime(latest.timestamp)}
              </p>
            </>
          )}

          {latestBody && (
            <>
              <h3 className="font-serif font-medium text-xl mt-9 mb-3.5 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
                Body
              </h3>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-card border border-line rounded-2xl px-5 py-5">
                  <div className="text-[13px] text-muted">Weight</div>
                  <div className="font-serif font-medium text-4xl tracking-tight mt-0.5">
                    {latestBody.weight ?? '—'}
                    <span className="text-base text-muted"> kg</span>
                  </div>
                  {latestBody.weight !== undefined && previousBody?.weight !== undefined && (
                    <div
                      className={`text-sm mt-1 ${
                        latestBody.weight <= previousBody.weight ? 'text-sage' : 'text-clay'
                      }`}
                    >
                      {latestBody.weight <= previousBody.weight ? '↓' : '↑'}{' '}
                      {Math.abs(latestBody.weight - previousBody.weight).toFixed(1)} kg since last
                    </div>
                  )}
                </div>
                <div className="bg-card border border-line rounded-2xl px-5 py-5">
                  <div className="text-[13px] text-muted">Body fat</div>
                  <div className="font-serif font-medium text-4xl tracking-tight mt-0.5">
                    {latestBody.bodyFatPercentage ?? '—'}
                    <span className="text-base text-muted"> %</span>
                  </div>
                  {latestBody.bodyFatPercentage !== undefined &&
                    previousBody?.bodyFatPercentage !== undefined && (
                      <div
                        className={`text-sm mt-1 ${
                          latestBody.bodyFatPercentage <= previousBody.bodyFatPercentage
                            ? 'text-sage'
                            : 'text-clay'
                        }`}
                      >
                        {latestBody.bodyFatPercentage <= previousBody.bodyFatPercentage ? '↓' : '↑'}{' '}
                        {Math.abs(
                          latestBody.bodyFatPercentage - previousBody.bodyFatPercentage
                        ).toFixed(1)}
                        % since last
                      </div>
                    )}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-8 flex-wrap">
            <button
              onClick={() => setShowCheckinForm(true)}
              disabled={!session.isActive || new Date(session.startTime).getTime() > Date.now()}
              title={
                new Date(session.startTime).getTime() > Date.now()
                  ? 'Check-ins open when the fast starts'
                  : undefined
              }
              className="flex-1 min-w-[140px] bg-clay text-white rounded-xl py-3.5 font-semibold cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add a check-in
            </button>
            {session.isActive && (
              <button
                onClick={onEndFast}
                className="flex-1 min-w-[110px] rounded-xl py-3.5 font-semibold border border-line bg-transparent cursor-pointer hover:border-clay hover:text-clay transition-colors"
              >
                End fast
              </button>
            )}
            {session.editToken ? (
              <ShareDialog source={{ kind: 'session', id: session.id }} auth={session.editToken} />
            ) : (
              <ShareButton sessionId={session.id} />
            )}
            {onUpdateSession && (
              <button
                onClick={() => setShowResetDialog(true)}
                className="flex-1 min-w-[110px] rounded-xl py-3.5 font-semibold border border-line bg-transparent cursor-pointer hover:border-muted transition-colors"
              >
                Reset fast
              </button>
            )}
          </div>

          <FastingStageCard
            startTime={session.startTime}
            endTime={session.isActive ? null : session.endTime}
            className="mt-6"
          />

          </div>{/* end left column */}

          <div className="mt-9 lg:mt-0 space-y-6">
            <ProgressChart entries={session.entries} startTime={session.startTime} />
            {session.entries.some(e => e.note) && (
              <div className="bg-card border border-line rounded-2xl px-5 py-5">
                <h3 className="font-serif font-medium text-lg mb-3">Check-in notes</h3>
                <div className="space-y-3">
                  {[...session.entries]
                    .filter(e => e.note)
                    .reverse()
                    .map(e => (
                      <div key={e.id} className="border-l-2 border-line pl-3">
                        <div className="text-xs text-muted">
                          {formatSwedishDateTime(e.timestamp)}
                        </div>
                        <div className="text-ink whitespace-pre-wrap text-[15px]">{e.note}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <BodyMetrics metrics={session.bodyMetrics} onAddMetric={onAddBodyMetric} />
            <Journal entries={session.notes} onAddEntry={onAddJournalEntry} />
          </div>
          </div>{/* end two-column grid */}

          <div className="bg-card border border-line rounded-2xl px-5 py-5 mt-8">
            <h3 className="font-serif font-medium text-lg mb-3">Your data, yours</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => session && exportSessionData(session)}
                className="px-4 py-2.5 rounded-xl border border-line bg-transparent font-semibold text-sm cursor-pointer hover:border-muted"
              >
                Export as JSON
              </button>
              <button
                onClick={() => session && exportSessionDataAsCSV(session)}
                className="px-4 py-2.5 rounded-xl border border-line bg-transparent font-semibold text-sm cursor-pointer hover:border-muted"
              >
                Export as CSV
              </button>
            </div>
          </div>

          <div className="text-center mt-10 text-xs text-muted font-serif italic">
            Kept privately · shared only by link
          </div>
        </>
      )}

      {showResetDialog && session && onUpdateSession && (
        <ResetFastDialog
          startTime={session.startTime}
          targetDuration={session.targetDuration}
          onClose={() => setShowResetDialog(false)}
          onSave={onUpdateSession}
        />
      )}

      {showCheckinForm && session && (
        <CheckinForm
          onSubmit={onAddCheckin}
          onClose={() => setShowCheckinForm(false)}
          subheading={`${dayLabel} of ${session.name}`}
          previous={latest}
        />
      )}

      {showNewSessionDialog && (
        <NewSessionDialog
          onCreateSession={onCreateNewSession}
          onClose={() => setShowNewSessionDialog(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
