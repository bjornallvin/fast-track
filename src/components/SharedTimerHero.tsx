'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateElapsedTime } from '../utils/calculations';
import {
  formatSwedishTime,
  formatSwedishDate,
  formatSwedishDateTime,
} from '../utils/dateFormat';

// HH:MM for same-day fasts; add the date once the fast spans days
function formatPoint(date: Date, multiDay: boolean): string {
  return multiDay
    ? `${formatSwedishDate(date).slice(5)} ${formatSwedishTime(date)}`
    : formatSwedishTime(date);
}

interface SharedTimerHeroProps {
  eyebrow: string;
  startTime: Date;
  targetDuration: number;
  endTime?: Date | null;
  subtitle?: string;
}

// The warm hero clock from the redesign mocks: eyebrow, big Fraunces clock,
// italic subtitle, gradient progress track, start/elapsed/end meta row.
const SharedTimerHero: React.FC<SharedTimerHeroProps> = ({
  eyebrow,
  startTime,
  targetDuration,
  endTime,
  subtitle,
}) => {
  const isActive = !endTime;
  const [elapsed, setElapsed] = useState(() =>
    calculateElapsedTime(startTime, targetDuration)
  );
  const [msToStart, setMsToStart] = useState(() => startTime.getTime() - Date.now());

  useEffect(() => {
    const update = () => {
      setMsToStart(startTime.getTime() - Date.now());
      if (endTime) {
        const diff = endTime.getTime() - startTime.getTime();
        const totalHours = diff / 3600000;
        const hours = Math.floor(totalHours);
        setElapsed({
          hours,
          minutes: Math.floor((totalHours - hours) * 60),
          totalHours,
          percentage: Math.min((totalHours / targetDuration) * 100, 100),
        });
      } else {
        setElapsed(calculateElapsedTime(startTime, targetDuration));
      }
    };
    update();
    if (!isActive) return;
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [startTime, targetDuration, endTime, isActive]);

  // Fast whose start time is still in the future: show a countdown, not a
  // running (negative) clock.
  const notStarted = isActive && msToStart > 0;
  const toStartHours = Math.floor(Math.max(msToStart, 0) / 3600000);
  const toStartMinutes = Math.floor((Math.max(msToStart, 0) % 3600000) / 60000);

  const targetEnd = useMemo(
    () => new Date(startTime.getTime() + targetDuration * 3600000),
    [startTime, targetDuration]
  );

  const clock = notStarted
    ? `${toStartHours}:${String(toStartMinutes).padStart(2, '0')}`
    : `${elapsed.hours}:${String(elapsed.minutes).padStart(2, '0')}`;
  const progressPct = notStarted ? 0 : elapsed.percentage;
  const multiDay = targetDuration > 24;

  // Milestones: 8h/16h/target for short fasts, one per day for longer ones
  const milestones = useMemo(() => {
    if (targetDuration <= 24) {
      return [8, 16, targetDuration]
        .filter((h, i, arr) => h <= targetDuration && arr.indexOf(h) === i)
        .map(h => ({ label: `${h}h`, hours: h }));
    }
    const days = Math.ceil(targetDuration / 24);
    return Array.from({ length: days }, (_, i) => {
      const hours = Math.min((i + 1) * 24, targetDuration);
      return { label: hours % 24 === 0 ? `${hours / 24}d` : `${hours}h`, hours };
    });
  }, [targetDuration]);

  return (
    <div className="bg-card border border-line rounded-2xl px-8 py-7 text-center">
      <div className="text-xs tracking-wider text-clay uppercase font-semibold">
        {notStarted ? 'Starts soon' : eyebrow}
      </div>
      <div
        className="font-serif font-medium text-6xl sm:text-7xl tracking-tight my-1"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {notStarted && <span className="text-3xl text-muted align-middle mr-2">in</span>}
        {clock}
      </div>
      <div className="font-serif italic text-muted">
        {notStarted
          ? `starts ${formatPoint(startTime, multiDay)} · a ${targetDuration}h fast`
          : subtitle ??
            `started at ${formatSwedishTime(startTime)} · ${Math.round(elapsed.percentage)}% of the ${targetDuration}h target`}
      </div>
      <div className="track max-w-md mx-auto mt-4">
        <i style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted mt-2 max-w-md mx-auto">
        <span>Start {formatPoint(startTime, multiDay)}</span>
        <span>
          {notStarted
            ? `starts in ${toStartHours}h ${toStartMinutes}m`
            : `${elapsed.hours}h ${elapsed.minutes}m in`}
        </span>
        <span>
          {endTime
            ? `Ended ${formatPoint(endTime, multiDay)}`
            : `Ends ~${formatPoint(targetEnd, multiDay)}`}
        </span>
      </div>
      {milestones.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {milestones.map(m => {
            const reached = elapsed.totalHours >= m.hours;
            return (
              <span
                key={m.hours}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  reached
                    ? 'bg-sage border-sage text-white font-semibold'
                    : 'border-line text-muted'
                }`}
              >
                {reached ? '✓ ' : ''}
                {m.label}
              </span>
            );
          })}
        </div>
      )}
      {!isActive && (
        <div className="mt-4 inline-block text-sm font-serif italic text-sage">
          fast completed · {formatSwedishDateTime(endTime!)}
        </div>
      )}
    </div>
  );
};

export default SharedTimerHero;
