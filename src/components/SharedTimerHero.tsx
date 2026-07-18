'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateElapsedTime } from '../utils/calculations';
import { formatSwedishTime, formatSwedishDateTime } from '../utils/dateFormat';

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

  useEffect(() => {
    const update = () => {
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

  const targetEnd = useMemo(
    () => new Date(startTime.getTime() + targetDuration * 3600000),
    [startTime, targetDuration]
  );

  const clock = `${elapsed.hours}:${String(elapsed.minutes).padStart(2, '0')}`;

  return (
    <div className="bg-card border border-line rounded-2xl px-8 py-7 text-center">
      <div className="text-xs tracking-wider text-clay uppercase font-semibold">
        {eyebrow}
      </div>
      <div
        className="font-serif font-medium text-6xl sm:text-7xl tracking-tight my-1"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {clock}
      </div>
      <div className="font-serif italic text-muted">
        {subtitle ??
          `started at ${formatSwedishTime(startTime)} · ${Math.round(elapsed.percentage)}% of the ${targetDuration}h target`}
      </div>
      <div className="track max-w-md mx-auto mt-4">
        <i style={{ width: `${elapsed.percentage}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted mt-2 max-w-md mx-auto">
        <span>Start {formatSwedishTime(startTime)}</span>
        <span>
          {elapsed.hours}h {elapsed.minutes}m in
        </span>
        <span>
          {endTime
            ? `Ended ${formatSwedishTime(endTime)}`
            : `Ends ~${formatSwedishTime(targetEnd)}`}
        </span>
      </div>
      {!isActive && (
        <div className="mt-4 inline-block text-sm font-serif italic text-sage">
          fast completed · {formatSwedishDateTime(endTime!)}
        </div>
      )}
    </div>
  );
};

export default SharedTimerHero;
