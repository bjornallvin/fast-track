import { useEffect, useState } from 'react';
import { calculateElapsedTime, formatElapsedTime } from '../utils/calculations';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface TimerProps {
  startTime: Date;
  targetDuration: number;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ startTime, targetDuration, isActive }) => {
  const [elapsedTime, setElapsedTime] = useState(() => calculateElapsedTime(startTime));

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime(startTime));
    }, 60000); // Update every minute

    // Initial update
    setElapsedTime(calculateElapsedTime(startTime));

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  // Calculate percentage based on target duration
  const percentage = Math.min((elapsedTime.totalHours / targetDuration) * 100, 100);

  // Calculate end time
  const endTime = new Date(startTime.getTime() + targetDuration * 60 * 60 * 1000);

  // Generate milestones for each day
  const getMilestones = () => {
    const milestones = [];
    const totalDays = Math.ceil(targetDuration / 24);

    if (targetDuration <= 24) {
      // For fasts 24h or less, show hourly milestones
      const hours = [8, 16, targetDuration].filter(h => h <= targetDuration);
      hours.forEach(hour => {
        const prevHour = hours[hours.indexOf(hour) - 1] || 0;
        const segmentHours = hour - prevHour;
        const segmentProgress = Math.max(0, Math.min(elapsedTime.totalHours - prevHour, segmentHours));
        const segmentPercentage = (segmentProgress / segmentHours) * 100;

        milestones.push({
          hours: hour,
          label: `${hour}h`,
          day: null,
          isReached: elapsedTime.totalHours >= hour,
          percentComplete: elapsedTime.totalHours >= hour ? 100 : segmentPercentage
        });
      });
    } else {
      // For longer fasts, show all days
      for (let day = 1; day <= totalDays; day++) {
        const hours = Math.min(day * 24, targetDuration);
        const prevHours = (day - 1) * 24;
        const isLastDay = hours === targetDuration;
        const remainingHours = targetDuration % 24;

        // Calculate progress for this specific day
        const dayHours = isLastDay && remainingHours > 0 ? remainingHours : 24;
        const dayProgress = Math.max(0, Math.min(elapsedTime.totalHours - prevHours, dayHours));
        const dayPercentage = (dayProgress / dayHours) * 100;

        milestones.push({
          hours,
          label: isLastDay && remainingHours > 0
            ? `${Math.floor(targetDuration / 24)}d ${remainingHours}h`
            : day === 1 ? '24h' : `${day}d`,
          day: `Day ${day}`,
          isReached: elapsedTime.totalHours >= hours,
          percentComplete: elapsedTime.totalHours >= hours ? 100 : dayPercentage
        });
      }
    }

    return milestones;
  };

  const milestones = getMilestones();

  // Determine size classes based on number of milestones
  const getSizeClasses = () => {
    const count = milestones.length;
    if (count <= 3) {
      return {
        container: 'w-16 h-16',
        text: 'font-bold text-sm',
        label: 'text-xs'
      };
    } else if (count <= 5) {
      return {
        container: 'w-14 h-14',
        text: 'font-bold text-xs',
        label: 'text-xs'
      };
    } else {
      return {
        container: 'w-12 h-12',
        text: 'font-semibold text-xs',
        label: 'text-xs'
      };
    }
  };

  const sizeClasses = getSizeClasses();

  // Create SVG path for partial circle
  const createCirclePath = (percent: number) => {
    const radius = 22; // Slightly smaller than viewBox to account for stroke width
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return {
      strokeDasharray,
      strokeDashoffset,
      radius
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Fasting Progress</h2>

        <div className="text-5xl font-bold text-indigo-600 mb-2">
          {formatElapsedTime(elapsedTime.hours, elapsedTime.minutes)}
        </div>

        {/* Start and End times */}
        <div className="flex justify-center gap-6 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <span className="font-semibold">Start:</span> {formatSwedishDateTime(startTime)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span>
              <span className="font-semibold">End:</span> {formatSwedishDateTime(endTime)}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {percentage.toFixed(1)}% of {targetDuration} hour goal
          </p>
        </div>

        <div className={`flex ${milestones.length > 5 ? 'flex-wrap justify-center gap-2' : 'justify-around'} mt-6`}>
          {milestones.map((milestone, index) => {
            const circlePath = createCirclePath(milestone.percentComplete);
            const isPartial = milestone.percentComplete > 0 && milestone.percentComplete < 100;
            const isCurrentDay = isPartial; // Current day is the one in progress

            return (
              <div
                key={index}
                className={`text-center ${milestones.length > 5 ? 'flex-shrink-0' : ''} ${
                  milestone.isReached ? 'text-green-600' : isPartial ? 'text-green-500' : 'text-gray-400'
                } transition-transform duration-300`}
              >
                <div className={`${sizeClasses.container} relative mx-auto mb-1`}>
                  {/* SVG for circular progress */}
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 48 48"
                  >
                    {/* Background circle */}
                    <circle
                      cx="24"
                      cy="24"
                      r={circlePath.radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-300"
                    />
                    {/* Progress circle */}
                    {milestone.percentComplete > 0 && (
                      <circle
                        cx="24"
                        cy="24"
                        r={circlePath.radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeDasharray={circlePath.strokeDasharray}
                        strokeDashoffset={circlePath.strokeDashoffset}
                        className={milestone.isReached ? 'text-green-600' : 'text-green-500'}
                        strokeLinecap="round"
                        style={{
                          transition: 'stroke-dashoffset 0.5s ease-in-out'
                        }}
                      />
                    )}
                  </svg>
                  {/* Inner content */}
                  <div className={`${sizeClasses.container} rounded-full flex items-center justify-center relative ${
                    milestone.isReached ? 'bg-green-50' : isPartial ? 'bg-green-50/30' : ''
                  }`}>
                    <span className={sizeClasses.text}>{milestone.label}</span>
                  </div>
                </div>
                <p className={`${sizeClasses.label} ${isCurrentDay ? 'font-semibold' : ''}`}>
                  {milestone.day || ''}
                </p>
              </div>
            );
          })}
        </div>

        {!isActive && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-semibold">Fast Completed!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timer;