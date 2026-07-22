'use client';

import { useEffect, useState } from 'react';
import { getFastingStage } from '../utils/fastingStages';

interface FastingStageCardProps {
  startTime: Date;
  endTime?: Date | null;
  className?: string;
}

// "In your body right now" — where the fast is in the biological arc, plus a
// line of encouragement. Lives OUTSIDE the timer hero so it never pushes the
// primary actions further down the page. Hidden until the fast is running.
const FastingStageCard: React.FC<FastingStageCardProps> = ({
  startTime,
  endTime,
  className = '',
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (endTime || now < startTime.getTime()) return null;

  const totalHours = (now - startTime.getTime()) / 3600000;
  const { stage, next, quote } = getFastingStage(totalHours);

  return (
    <div className={`bg-card border border-line rounded-2xl px-6 py-5 text-center ${className}`}>
      <div className="text-xs tracking-wider text-clay uppercase font-semibold">
        In your body right now
      </div>
      <div className="font-serif font-medium text-xl tracking-tight mt-1">{stage.name}</div>
      <div className="text-sm text-muted mt-1.5 leading-relaxed max-w-md mx-auto">
        {stage.body}
      </div>
      <div className="font-serif italic text-sage mt-3">“{quote}”</div>
      {next && (
        <div className="text-xs text-muted mt-2">
          coming up: {next.name.toLowerCase()} around the {next.from}h mark
        </div>
      )}
    </div>
  );
};

export default FastingStageCard;
