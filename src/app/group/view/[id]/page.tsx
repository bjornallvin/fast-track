'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import SharedTimerHero from '@/components/SharedTimerHero';
import FastingStageCard from '@/components/FastingStageCard';
import Wordmark from '@/components/Wordmark';
import GroupRoster from '@/components/GroupRoster';
import GroupComparisonChart from '@/components/GroupComparisonChart';
import { useGroupData } from '@/hooks/useGroupData';
import { saveGroupLink } from '@/types/groupLink';

function timeAgo(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

// Read-only comparison view: one shared timer, everyone overlaid on the same
// timeline. Exposes no tokens and offers no way to modify anything.
export default function GroupViewPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { group, loading, error, lastUpdated, refresh } = useGroupData(groupId, null);

  useEffect(() => {
    if (!group) return;
    saveGroupLink({
      id: groupId,
      groupName: group.name,
      role: 'viewer',
      lastAccessed: new Date(),
      startTime: group.startTime,
      targetDuration: group.targetDuration,
      isActive: !group.endTime,
    });
  }, [group, groupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif italic text-muted">
        loading the fast…
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif font-medium text-3xl mb-2">Group not found</h1>
          <p className="text-muted">This fast may have ended long ago, or the link is wrong.</p>
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

      <h1 className="font-serif font-medium text-4xl tracking-tight">{group.name}</h1>
      <div className="font-serif italic text-muted mt-0.5 mb-6">
        one fast, {group.participants.length}{' '}
        {group.participants.length === 1 ? 'person' : 'people'} — everyone on the same clock
      </div>

      <div className="mb-7">
        <SharedTimerHero
          eyebrow={group.endTime ? 'The fast has ended' : 'The group is fasting'}
          startTime={group.startTime}
          targetDuration={group.targetDuration}
          endTime={group.endTime}
        />
      </div>

      <FastingStageCard startTime={group.startTime} endTime={group.endTime} className="mb-6" />

      <h3 className="font-serif font-medium text-lg mb-3 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
        Who&apos;s in
      </h3>
      <GroupRoster group={group} />

      <div className="flex justify-end items-center mb-3">
        <button
          onClick={refresh}
          className="text-[13px] text-muted font-serif italic cursor-pointer hover:text-ink"
        >
          ↻ updated {lastUpdated ? timeAgo(lastUpdated) : 'just now'}
        </button>
      </div>

      <GroupComparisonChart group={group} />

      <div className="text-center mt-8">
        <a
          href={`/group/join/${groupId}`}
          className="text-clay underline text-sm"
        >
          Join this fast →
        </a>
      </div>

      <div className="text-center mt-8 text-xs text-muted font-serif italic">
        one shared timer · everyone plotted on the same timeline · join by link, report your own check-ins
      </div>
    </div>
  );
}
