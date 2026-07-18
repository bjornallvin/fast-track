'use client';

import type { GroupSessionPublic } from '@/types';

function timeAgo(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// "Who's in" — every participant is shown, including those with no
// check-ins yet (present, dimmed), per requirement 7.
const GroupRoster: React.FC<{ group: GroupSessionPublic; highlightId?: string }> = ({
  group,
  highlightId,
}) => {
  if (group.participants.length === 0) {
    return (
      <p className="font-serif italic text-muted text-sm mb-7">
        no one has joined yet — share the join link below
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2.5 mb-7">
      {group.participants.map(p => {
        const lastEntry = [...p.entries].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        )[0];
        return (
          <div
            key={p.id}
            className={`flex items-center gap-2.5 bg-card border rounded-xl px-3.5 py-2.5 ${
              p.id === highlightId ? 'border-clay' : 'border-line'
            } ${lastEntry ? '' : 'opacity-60'}`}
          >
            <i
              className="w-[11px] h-[11px] rounded-full shrink-0"
              style={{ background: p.color ?? 'var(--ink)' }}
            />
            <div>
              <div className="font-semibold text-sm leading-tight">
                {p.name}
                {p.id === highlightId && (
                  <span className="text-muted font-normal"> · you</span>
                )}
              </div>
              <div className="text-xs text-muted">
                {lastEntry
                  ? `last check-in ${timeAgo(lastEntry.timestamp)}`
                  : 'no check-ins yet'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupRoster;
