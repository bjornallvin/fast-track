'use client';

import { useState } from 'react';
import type { CheckinEntry, BodyMetric } from '@/types';
import { formatSwedishDateTime } from '@/utils/dateFormat';

interface EntryLogProps {
  entries: CheckinEntry[];
  bodyMetrics: BodyMetric[];
  onEditCheckin: (entry: CheckinEntry) => void;
  onDeleteCheckin: (id: string) => void;
  onEditBody: (metric: BodyMetric) => void;
  onDeleteBody: (id: string) => void;
  title?: string;
}

type Row =
  | { kind: 'checkin'; ts: number; entry: CheckinEntry }
  | { kind: 'body'; ts: number; metric: BodyMetric };

// A merged, newest-first log of a person's own check-ins and weight logs, each
// row editable/deletable — for fixing mistakes.
const EntryLog: React.FC<EntryLogProps> = ({
  entries,
  bodyMetrics,
  onEditCheckin,
  onDeleteCheckin,
  onEditBody,
  onDeleteBody,
  title = 'My log',
}) => {
  const [open, setOpen] = useState(false);

  const rows: Row[] = [
    ...entries.map(e => ({ kind: 'checkin' as const, ts: new Date(e.timestamp).getTime(), entry: e })),
    ...bodyMetrics.map(m => ({ kind: 'body' as const, ts: new Date(m.timestamp).getTime(), metric: m })),
  ].sort((a, b) => b.ts - a.ts);

  const del = (label: string, fn: () => void) => {
    if (confirm(`Delete this ${label}? This cannot be undone.`)) fn();
  };

  return (
    <div className="border border-line rounded-2xl bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
      >
        <span className="font-serif font-medium text-lg">
          {title}
          <span className="text-muted font-sans text-sm font-normal">
            {' '}· {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </span>
        </span>
        <span className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open &&
        (rows.length === 0 ? (
          <p className="font-serif italic text-muted text-sm px-4 pb-4">
            nothing logged yet — your check-ins and weight logs will show here.
          </p>
        ) : (
          <div className="divide-y divide-line border-t border-line">
      {rows.map(row => (
        <div
          key={row.kind === 'checkin' ? row.entry.id : row.metric.id}
          className="flex items-start gap-3 px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            {row.kind === 'checkin' ? (
              <>
                <div className="text-[15px]">
                  <span className="text-muted">Energy</span> {row.entry.energy} ·{' '}
                  <span className="text-muted">Hunger</span> {row.entry.hunger} ·{' '}
                  <span className="text-muted">Clarity</span> {row.entry.mentalClarity} ·{' '}
                  <span className="text-muted">Mood</span> {row.entry.mood} ·{' '}
                  <span className="text-muted">Comfort</span> {row.entry.physicalComfort}
                </div>
                {row.entry.note && (
                  <div className="text-sm text-ink/80 mt-0.5 whitespace-pre-wrap">{row.entry.note}</div>
                )}
              </>
            ) : (
              <div className="text-[15px]">
                {row.metric.weight != null && (
                  <span>
                    <span className="font-serif text-lg">{row.metric.weight}</span>
                    <span className="text-muted"> kg</span>
                  </span>
                )}
                {row.metric.bodyFatPercentage != null && (
                  <span className="ml-3">{row.metric.bodyFatPercentage}% body fat</span>
                )}
              </div>
            )}
            <div className="text-xs text-muted mt-0.5">
              {formatSwedishDateTime(new Date(row.ts))}
            </div>
          </div>
          <div className="flex gap-2.5 text-sm shrink-0 pt-0.5">
            <button
              onClick={() =>
                row.kind === 'checkin' ? onEditCheckin(row.entry) : onEditBody(row.metric)
              }
              className="text-muted underline cursor-pointer hover:text-ink"
            >
              edit
            </button>
            <button
              onClick={() =>
                row.kind === 'checkin'
                  ? del('check-in', () => onDeleteCheckin(row.entry.id))
                  : del('weight log', () => onDeleteBody(row.metric.id))
              }
              className="text-clay underline cursor-pointer hover:text-ink"
            >
              delete
            </button>
          </div>
        </div>
      ))}
          </div>
        ))}
    </div>
  );
};

export default EntryLog;
