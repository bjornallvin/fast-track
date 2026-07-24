'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SharedTimerHero from '@/components/SharedTimerHero';
import GroupRoster from '@/components/GroupRoster';
import GroupComparisonChart from '@/components/GroupComparisonChart';
import CheckinForm from '@/components/CheckinForm';
import FastingStageCard from '@/components/FastingStageCard';
import Wordmark from '@/components/Wordmark';
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
  const [bodyStatus, setBodyStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [showCheckin, setShowCheckin] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [scope, setScope] = useState<'me' | 'all'>('me');
  const [editingCheckin, setEditingCheckin] = useState<CheckinEntry | null>(null);
  const [editingBody, setEditingBody] = useState<BodyMetric | null>(null);

  const me = group?.participants.find(p => p.id === group.participantId);
  const myLastCheckin =
    me && me.entries.length > 0
      ? [...me.entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
      : null;

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

  const patch = async (payload: Record<string, unknown>) => {
    if (!group?.participantId) return false;
    const response = await fetch(
      `/api/groups/${groupId}/participants/${group.participantId}`,
      {
        method: 'PATCH',
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
    if (editingCheckin) {
      await patch({
        editCheckin: { ...entry, id: editingCheckin.id, timestamp: editingCheckin.timestamp },
      });
      setEditingCheckin(null);
    } else {
      await report({ checkin: { ...entry, id: generateId(), timestamp: new Date() } });
    }
  };

  const handleBodyMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !bodyFat) return;
    const fields = {
      ...(weight ? { weight: Number(weight) } : {}),
      ...(bodyFat ? { bodyFatPercentage: Number(bodyFat) } : {}),
    };
    const ok = editingBody
      ? await patch({
          editBodyMetric: { id: editingBody.id, timestamp: editingBody.timestamp, ...fields },
        })
      : await report({ bodyMetric: { id: generateId(), timestamp: new Date(), ...fields } });
    if (ok) {
      setWeight('');
      setBodyFat('');
      setShowBody(false);
      setEditingBody(null);
      setBodyStatus(null);
    } else {
      setBodyStatus({ ok: false, text: 'Failed to save. Please try again.' });
    }
  };

  const openEditCheckin = (entry: CheckinEntry) => {
    setEditingCheckin(entry);
    setShowCheckin(true);
  };
  const openEditBody = (metric: BodyMetric) => {
    setEditingBody(metric);
    setWeight(metric.weight != null ? String(metric.weight) : '');
    setBodyFat(metric.bodyFatPercentage != null ? String(metric.bodyFatPercentage) : '');
    setShowBody(true);
  };
  const closeCheckin = () => {
    setShowCheckin(false);
    setEditingCheckin(null);
  };
  const closeBody = () => {
    setShowBody(false);
    setEditingBody(null);
    setWeight('');
    setBodyFat('');
  };
  const deleteCheckin = (id: string) => patch({ deleteCheckinId: id });
  const deleteBody = (id: string) => patch({ deleteBodyMetricId: id });
  const editPoint = (kind: 'checkin' | 'body', id: string) => {
    if (kind === 'checkin') {
      const e = me?.entries.find(x => x.id === id);
      if (e) openEditCheckin(e);
    } else {
      const m = me?.bodyMetrics.find(x => x.id === id);
      if (m) openEditBody(m);
    }
  };
  const deletePoint = (kind: 'checkin' | 'body', id: string) =>
    kind === 'checkin' ? deleteCheckin(id) : deleteBody(id);

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

  const ended = !!group.endTime;
  const notStarted = new Date(group.startTime).getTime() > Date.now();
  // Logging stays open after the fast ends — post-fast check-ins and weight
  // show what happens once eating resumes. Only a not-yet-started fast blocks.
  const canLog = !notStarted;
  const chartGroup =
    scope === 'me'
      ? { ...group, participants: group.participants.filter(p => p.id === me.id) }
      : group;

  const seg = (on: boolean) =>
    `px-3.5 py-1.5 text-sm font-medium cursor-pointer ${
      on ? 'bg-clay text-white' : 'bg-card text-muted hover:text-ink'
    }`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-7 py-9 pb-20">
      <header className="flex justify-between items-center mb-6">
        <Wordmark />
        <span className="text-[13px] text-muted">
          reporting as <b className="text-ink font-semibold">{me.name}</b>
        </span>
      </header>

      <h1 className="font-serif font-medium text-4xl tracking-tight">{group.name}</h1>
      <div className="font-serif italic text-muted mt-0.5 mb-6">
        one fast, {group.participants.length}{' '}
        {group.participants.length === 1 ? 'person' : 'people'} — everyone on the same clock
      </div>

      <div className="mb-6">
        <SharedTimerHero
          eyebrow={group.endTime ? 'The fast has ended' : 'The group is fasting'}
          startTime={group.startTime}
          targetDuration={group.targetDuration}
          endTime={group.endTime}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-3">
        <button
          onClick={() => setShowCheckin(true)}
          disabled={!canLog}
          className="flex-1 min-w-[150px] bg-clay text-white rounded-xl py-3 font-semibold cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ＋ Check in
        </button>
        <button
          onClick={() => setShowBody(true)}
          disabled={!canLog}
          className="flex-1 min-w-[130px] rounded-xl py-3 font-semibold border border-line bg-transparent cursor-pointer hover:border-sage hover:text-sage disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Log weight
        </button>
        {group.participantId && (
          <ShareDialog
            source={{ kind: 'group', id: groupId }}
            auth={token}
            self={{ participantId: group.participantId }}
            label="Share…"
            className="flex-1 min-w-[110px] rounded-xl py-3 font-semibold border border-line bg-transparent cursor-pointer hover:border-sage hover:text-sage transition-colors"
          />
        )}
      </div>
      {notStarted ? (
        <p className="text-sm text-muted font-serif italic mb-6">
          the fast hasn’t started yet — check-ins open when the clock starts
        </p>
      ) : ended ? (
        <p className="text-sm text-muted font-serif italic mb-6">
          the fast has ended — keep checking in and logging weight to see what
          happens after; new entries land in the “after the fast” zone
        </p>
      ) : null}

      <FastingStageCard startTime={group.startTime} endTime={group.endTime} className="mt-3" />

      {/* Charts front and center, filterable */}
      <div className="flex items-center justify-between gap-3 mt-8 mb-4">
        <h3 className="font-serif font-medium text-xl">Progress</h3>
        <div className="inline-flex rounded-xl border border-line overflow-hidden">
          <button onClick={() => setScope('me')} className={seg(scope === 'me')}>
            Just me
          </button>
          <button onClick={() => setScope('all')} className={seg(scope === 'all')}>
            Everyone
          </button>
        </div>
      </div>
      <GroupComparisonChart
        group={chartGroup}
        editableParticipantId={me.id}
        onEditPoint={editPoint}
        onDeletePoint={deletePoint}
      />

      {/* Roster */}
      <h3 className="font-serif font-medium text-lg mt-8 mb-3 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
        Who&apos;s in
      </h3>
      <GroupRoster group={group} highlightId={me.id} />

      <div className="text-center mt-8">
        <Link href={`/group/view/${groupId}`} className="text-clay underline text-sm">
          Open the full read-only view →
        </Link>
      </div>

      {/* Check-in popup — also opens for editing, even before the fast starts */}
      {showCheckin && (canLog || editingCheckin) && (
        <CheckinForm
          onSubmit={handleCheckin}
          onClose={closeCheckin}
          heading={editingCheckin ? 'Edit check-in' : 'How are you, right now?'}
          subheading={
            editingCheckin
              ? 'fix a mistake — this replaces the entry'
              : ended
                ? `after the fast — reporting into ${group.name}`
                : `reporting into ${group.name}`
          }
          previous={editingCheckin ? null : myLastCheckin}
          initial={editingCheckin}
          submitLabel={editingCheckin ? 'Save changes' : undefined}
        />
      )}

      {/* Log weight popup — also opens for editing */}
      {showBody && (canLog || editingBody) && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(44, 38, 32, 0.55)' }}
          onClick={closeBody}
        >
          <form
            onSubmit={handleBodyMetric}
            onClick={e => e.stopPropagation()}
            className="bg-paper rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md"
          >
            <h2 className="font-serif font-medium text-2xl tracking-tight mb-5">
              {editingBody ? 'Edit weight log' : 'Log weight'}
            </h2>
            <div className="flex gap-3 items-end flex-wrap mb-2">
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
                  autoFocus
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
            </div>
            {bodyStatus && !bodyStatus.ok && (
              <div className="mb-3 text-sm text-clay">{bodyStatus.text}</div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={!weight && !bodyFat}
                className="flex-1 bg-clay text-white rounded-xl py-3 font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={closeBody}
                className="px-6 rounded-xl border border-line bg-card text-ink font-semibold cursor-pointer hover:border-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
