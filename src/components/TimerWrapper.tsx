import React, { memo } from 'react';
import Timer from './Timer';

interface TimerWrapperProps {
  startTime: Date;
  targetDuration: number;
  isActive: boolean;
}

// Memoize the Timer to prevent rerenders when props haven't changed
const TimerWrapper = memo<TimerWrapperProps>(({ startTime, targetDuration, isActive }) => {
  return (
    <Timer
      startTime={startTime}
      targetDuration={targetDuration}
      isActive={isActive}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  // Only rerender if these specific values change
  return (
    prevProps.startTime.getTime() === nextProps.startTime.getTime() &&
    prevProps.targetDuration === nextProps.targetDuration &&
    prevProps.isActive === nextProps.isActive
  );
});

TimerWrapper.displayName = 'TimerWrapper';

export default TimerWrapper;