'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SharedTimerHero from '@/components/SharedTimerHero';
import GroupRoster from '@/components/GroupRoster';
import GroupComparisonChart from '@/components/GroupComparisonChart';
import ShareDialog from '@/components/ShareDialog';
import { useGroupData } from '@/hooks/useGroupData';
import { saveGroupLink } from '@/types/groupLink';
import { formatSwedishDateTime } from '@/utils/dateFormat';

// Organizer page: shared timer, share links, edit shared start/target,
// end the fast for everyone.
export default function GroupOrganizerPage() {
  const params = useParams();
  const token = params.token as string;
  const groupId = params.id as string;
  const { group, loading, error, refresh } = useGroupData(groupId, token);
  const [copied, setCopied] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editClearData, setEditClearData] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!group || group.role !== 'organizer') return;
    saveGroupLink({
      id: groupId,
      groupName: group.name,
      role: 'organizer',
      token,
      lastAccessed: new Date(),
      startTime: group.startTime,
      targetDuration: group.targetDuration,
      isActive: !group.endTime,
    });
  }, [group, groupId, token]);

  const copy = (url: string, label: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  const removeParticipant = async (pid: string, name: string) => {
    if (!confirm(`Remove ${name} from this fast? Their check-ins will be deleted.`)) return;
    try {
      await fetch(
        `/api/groups/${groupId}/participants/${pid}?token=${encodeURIComponent(token)}`,
        { method: 'DELETE' }
      );
      refresh();
    } catch (err) {
      console.error('Failed to remove participant:', err);
    }
  };

  const update = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...fields }),
      });
      if (response.ok) await refresh();
      return response.ok;
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = inviteEmails.split(/[,\s]+/).filter(Boolean);
    if (emails.length === 0) return;
    setInviting(true);
    setInviteStatus(null);
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, emails }),
      });
      const data = await response.json();
      if (response.ok && data.sent > 0) {
        setInviteStatus(
          `Sent ${data.sent} invitation${data.sent === 1 ? '' : 's'}${
            data.failed?.length ? ` — ${data.failed.length} failed` : ''
          }.`
        );
        setInviteEmails('');
      } else {
        setInviteStatus(data.error ?? 'Could not send invitations.');
      }
    } catch {
      setInviteStatus('Could not send invitations.');
    } finally {
      setInviting(false);
    }
  };

  const handleEndFast = async () => {
    if (!confirm('End the fast for the whole group? This sets one shared end time for everyone.')) return;
    await update({ endTime: new Date() });
  };

  const anyCheckins = group?.participants.some(p => p.entries.length > 0) ?? false;

  const openEdit = () => {
    if (!group) return;
    if (anyCheckins) {
      // Allowed but warned — moving the clock shifts everyone's timeline
      if (!confirm('People have already checked in. Changing the start time or target shifts the timeline for everyone. Continue?')) {
        return;
      }
    }
    setEditName(group.name);
    const s = group.startTime;
    const pad = (n: number) => String(n).padStart(2, '0');
    setEditStart(
      `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}T${pad(s.getHours())}:${pad(s.getMinutes())}`
    );
    setEditTarget(String(group.targetDuration));
    setEditClearData(false);
    setShowEdit(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      editClearData &&
      !confirm('Clear ALL check-ins and body data for every participant? This cannot be undone.')
    ) {
      return;
    }
    const ok = await update({
      name: editName.trim() || group?.name,
      startTime: new Date(editStart),
      targetDuration: Number(editTarget),
      clearData: editClearData,
    });
    if (ok) setShowEdit(false);
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

  if (group.role !== 'organizer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="font-serif font-medium text-3xl mb-2">This link isn&apos;t valid</h1>
          <p className="text-muted mb-4">
            The organizer link doesn&apos;t match this group.
          </p>
          <Link href={`/group/view/${groupId}`} className="text-clay underline">
            View {group.name} read-only →
          </Link>
        </div>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = `${origin}/group/join/${groupId}`;
  const viewUrl = `${origin}/group/view/${groupId}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-7 py-9 pb-20">
      <header className="flex justify-between items-center mb-6">
        <a href="/" className="font-serif font-semibold text-[22px] text-ink">
          Fast<b className="text-clay">·</b>Track
        </a>
        <span className="text-[13px] text-muted">
          organizing as <b className="text-ink font-semibold">you</b>
        </span>
      </header>

      <h1 className="font-serif font-medium text-4xl tracking-tight">{group.name}</h1>
      <div className="font-serif italic text-muted mt-0.5 mb-6">
        one fast, {group.participants.length}{' '}
        {group.participants.length === 1 ? 'person' : 'people'} — you hold the clock
      </div>

      <div className="mb-7">
        <SharedTimerHero
          eyebrow={group.endTime ? 'The fast has ended' : 'The group is fasting'}
          startTime={group.startTime}
          targetDuration={group.targetDuration}
          endTime={group.endTime}
        />
      </div>

      {/* Share links */}
      <div className="bg-card border border-line rounded-2xl px-5 py-5 mb-7">
        <h3 className="font-serif font-medium text-lg mb-3">Invite &amp; share</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => copy(joinUrl, 'join')}
            className="flex-1 px-4 py-3 rounded-xl bg-clay text-white font-semibold cursor-pointer hover:opacity-90"
          >
            {copied === 'join' ? 'Join link copied ✓' : 'Copy join link'}
          </button>
          <button
            onClick={() => copy(viewUrl, 'view')}
            className="flex-1 px-4 py-3 rounded-xl border border-clay text-clay font-semibold cursor-pointer hover:bg-clay hover:text-white transition-colors"
          >
            {copied === 'view' ? 'View link copied ✓' : 'Copy read-only link'}
          </button>
        </div>
        <p className="text-xs text-muted font-serif italic mt-3">
          the join link lets people enter the fast and report their own data · the
          read-only link only watches
        </p>
        <div className="mt-3">
          <ShareDialog
            source={{ kind: 'group', id: groupId }}
            auth={token}
            canShareAll
            label="Custom share — pick what's visible…"
            className="w-full px-4 py-3 rounded-xl border border-line text-ink font-medium cursor-pointer hover:border-sage hover:text-sage transition-colors"
          />
        </div>
        {!group.endTime && (
          <form onSubmit={handleInvite} className="mt-4 pt-4 border-t border-line">
            <label className="block font-semibold text-sm mb-2" htmlFor="invite-emails">
              Invite by email
            </label>
            <div className="flex gap-2.5 flex-wrap">
              <input
                id="invite-emails"
                type="text"
                value={inviteEmails}
                onChange={e => setInviteEmails(e.target.value)}
                placeholder="anna@example.com, mattias@example.com"
                className="flex-1 min-w-[200px] px-3.5 py-2.5 border border-line rounded-xl bg-white text-sm"
              />
              <button
                type="submit"
                disabled={inviting || !inviteEmails.trim()}
                className="px-4.5 py-2.5 rounded-xl border border-clay text-clay font-semibold text-sm cursor-pointer hover:bg-clay hover:text-white transition-colors disabled:opacity-50"
              >
                {inviting ? 'Sending…' : 'Send invites'}
              </button>
            </div>
            {inviteStatus && (
              <p className="text-sm text-muted font-serif italic mt-2.5">{inviteStatus}</p>
            )}
          </form>
        )}
      </div>

      <h3 className="font-serif font-medium text-lg mb-3 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
        Who&apos;s in
      </h3>
      <GroupRoster group={group} onRemove={removeParticipant} />

      <GroupComparisonChart group={group} />

      {/* Organizer controls */}
      <div className="flex gap-3 mt-8">
        {!group.endTime && (
          <>
            <button
              onClick={openEdit}
              className="flex-1 px-4 py-3.5 rounded-xl border border-line bg-card font-semibold cursor-pointer hover:border-muted"
            >
              Edit fast
            </button>
            <button
              onClick={handleEndFast}
              disabled={saving}
              className="flex-1 px-4 py-3.5 rounded-xl border border-clay text-clay font-semibold cursor-pointer hover:bg-clay hover:text-white transition-colors disabled:opacity-50"
            >
              End fast for everyone
            </button>
          </>
        )}
      </div>
      {group.endTime && (
        <p className="text-center font-serif italic text-muted mt-4">
          ended {formatSwedishDateTime(group.endTime)} — one shared end for the whole group
        </p>
      )}

      {showEdit && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(44, 38, 32, 0.55)' }}
          onClick={() => setShowEdit(false)}
        >
          <form
            onSubmit={handleEditSave}
            onClick={e => e.stopPropagation()}
            className="bg-paper rounded-2xl shadow-xl p-7 w-full max-w-md"
          >
            <h2 className="font-serif font-medium text-2xl mb-5">Edit the shared fast</h2>
            <label className="block font-semibold text-sm mb-1" htmlFor="edit-name">
              Group name
            </label>
            <input
              id="edit-name"
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
            />
            <label className="block font-semibold text-sm mb-1" htmlFor="edit-start">
              Shared start time
            </label>
            <input
              id="edit-start"
              type="datetime-local"
              value={editStart}
              onChange={e => setEditStart(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
            />
            <label className="block font-semibold text-sm mb-1" htmlFor="edit-target">
              Target (hours)
            </label>
            <input
              id="edit-target"
              type="number"
              min="1"
              max="240"
              value={editTarget}
              onChange={e => setEditTarget(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
            />
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={editClearData}
                onChange={e => setEditClearData(e.target.checked)}
                className="w-4 h-4 accent-clay"
              />
              <span className="text-[15px]">
                Clear all participants&apos; check-ins &amp; body data
              </span>
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-clay text-white rounded-xl py-3 font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-5 rounded-xl border border-line bg-card font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="text-center mt-10 text-xs text-muted font-serif italic">
        one shared timer · you set the clock, everyone reports their own story
      </div>
    </div>
  );
}
