'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SharedTimerHero from '@/components/SharedTimerHero';
import GroupRoster from '@/components/GroupRoster';
import CheckinForm from '@/components/CheckinForm';
import ShareDialog from '@/components/ShareDialog';
import { useGroupData } from '@/hooks/useGroupData';
import { saveGroupLink } from '@/types/groupLink';
import { generateId } from '@/utils/calculations';
import type { CheckinEntry, BodyMetric } from '@/types';

export default function GroupReportPage() {
  const params = useParams();
  const token = params.token as string;
  const groupId = params.id as string;
  const { group, loading, error, refresh } = useGroupData(groupId, token);
  const [checkinStatus, setCheckinStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [bodyStatus, setBodyStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const me = group?.participants.find(p => p.id === group.participantId);

  // Remember this report link in the browser
  useEffect(() => {
    if (!group || group.role !== 'participant' || !me) return;
    saveGroupLink({
      id: groupId,
      groupName: group.name,
      role: 'participant',
      token,
      participantId: me.id,
      participantName: me.name,
      lastAccessed: new Date(),
      startTime: group.startTime,
      targetDuration: group.targetDuration,
      isActive: !group.endTime,
    });
  }, [group, me, groupId, token]);

  const report = async (payload: { checkin?: CheckinEntry; bodyMetric?: BodyMetric }) => {
    if (!group?.participantId) return false;
    const response = await fetch(
      `/api/groups/${groupId}/participants/${group.participantId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...payload }),
      }
    );
    if (response.ok) {
      await refresh();
      return true;
    }
    return false;
  };

  const handleCheckin = async (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => {
    const ok = await report({
      checkin: { ...entry, id: generateId(), timestamp: new Date() },
    });
    setCheckinStatus(
      ok
        ? { ok: true, text: '✓ Check-in saved — you are on the curve.' }
        : { ok: false, text: 'Failed to save check-in. Please try again.' }
    );
  };

  const handleBodyMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !bodyFat) return;
    const ok = await report({
      bodyMetric: {
        id: generateId(),
        timestamp: new Date(),
        ...(weight ? { weight: Number(weight) } : {}),
        ...(bodyFat ? { bodyFatPercentage: Number(bodyFat) } : {}),
      },
    });
    if (ok) {
      setWeight('');
      setBodyFat('');
    }
    setBodyStatus(
      ok
        ? { ok: true, text: '✓ Body metrics saved.' }
        : { ok: false, text: 'Failed to save body metrics. Please try again.' }
    );
  };

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

  if (group.role !== 'participant' || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="font-serif font-medium text-3xl mb-2">This link isn&apos;t valid</h1>
          <p className="text-muted mb-4">
            Your report link doesn&apos;t match anyone in this group. Ask the organizer for
            the join link, or watch the group instead.
          </p>
          <Link href={`/group/view/${groupId}`} className="text-clay underline">
            View {group.name} read-only →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-7 py-9 pb-20">
      <header className="flex justify-between items-center mb-6">
        <div className="font-serif font-semibold text-[22px]">
          Fast<b className="text-clay">·</b>Track
        </div>
        <span className="text-[13px] text-muted">
          reporting as <b className="text-ink font-semibold">{me.name}</b>
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

      <h3 className="font-serif font-medium text-lg mb-3 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
        Who&apos;s in
      </h3>
      <GroupRoster group={group} highlightId={me.id} />

      {group.endTime ? (
        <div className="bg-card border border-line rounded-2xl p-6 text-center font-serif italic text-muted mb-7">
          the fast has ended — no more check-ins, but the story is saved
        </div>
      ) : (
        <div className="mb-9">
          <CheckinForm
            inline
            onSubmit={handleCheckin}
            heading="How are you, right now?"
            subheading={`reporting into ${group.name}`}
            status={checkinStatus}
          />
        </div>
      )}

      {!group.endTime && (
        <form
          onSubmit={handleBodyMetric}
          className="bg-card border border-line rounded-2xl px-5 py-5 mb-9"
        >
          <h3 className="font-serif font-medium text-lg mb-3">Log body</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm text-muted mb-1" htmlFor="body-weight">
                Weight (kg)
              </label>
              <input
                id="body-weight"
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full px-3 py-2.5 border border-line rounded-xl bg-white"
                placeholder="—"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm text-muted mb-1" htmlFor="body-fat">
                Body fat (%)
              </label>
              <input
                id="body-fat"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
                className="w-full px-3 py-2.5 border border-line rounded-xl bg-white"
                placeholder="—"
              />
            </div>
            <button
              type="submit"
              disabled={!weight && !bodyFat}
              className="px-5 py-2.5 rounded-xl border border-clay text-clay font-semibold cursor-pointer hover:bg-clay hover:text-white disabled:opacity-40 transition-colors"
            >
              Save
            </button>
          </div>
          {bodyStatus && (
            <div
              className={`mt-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                bodyStatus.ok
                  ? 'border-sage text-sage bg-sage/10'
                  : 'border-clay text-clay bg-clay/10'
              }`}
            >
              {bodyStatus.text}
            </div>
          )}
        </form>
      )}

      {group.participantId && (
        <div className="mb-6">
          <ShareDialog
            source={{ kind: 'group', id: groupId }}
            auth={token}
            self={{ participantId: group.participantId }}
            label="Share just my journey…"
            className="w-full px-4 py-3 rounded-xl border border-line text-ink font-medium cursor-pointer hover:border-sage hover:text-sage transition-colors"
          />
        </div>
      )}

      <div className="text-center">
        <Link href={`/group/view/${groupId}`} className="text-clay underline text-sm">
          See how everyone compares →
        </Link>
      </div>

      <div className="text-center mt-10 text-xs text-muted font-serif italic">
        your check-ins land under your own name · the clock is shared
      </div>
    </div>
  );
}
