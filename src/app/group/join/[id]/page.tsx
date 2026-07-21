'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroupData } from '@/hooks/useGroupData';
import { saveGroupLink } from '@/types/groupLink';
import { formatSwedishDateTime } from '@/utils/dateFormat';

export default function GroupJoinPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { group, loading, error } = useGroupData(groupId, null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !group) return;
    setJoining(true);
    setJoinError(null);
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        setJoinError(data.error ?? 'Failed to join');
        setJoining(false);
        return;
      }
      saveGroupLink({
        id: groupId,
        groupName: group.name,
        role: 'participant',
        token: data.reportToken,
        participantId: data.participantId,
        participantName: data.name,
        lastAccessed: new Date(),
        startTime: group.startTime,
        targetDuration: group.targetDuration,
        isActive: !group.endTime,
      });
      router.push(`/group/report/${data.reportToken}/${groupId}`);
    } catch (err) {
      console.error('Error joining group:', err);
      setJoinError('Failed to join. Please try again.');
      setJoining(false);
    }
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

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-7 py-10">
      <header className="mb-8">
        <div className="font-serif font-semibold text-2xl">
          Fast<b className="text-clay">·</b>Track
        </div>
      </header>

      <h1 className="font-serif font-medium text-4xl tracking-tight">
        Join <em className="text-clay">{group.name}</em>
      </h1>
      <p className="font-serif italic text-muted mt-1 mb-8">
        one fast, one clock — started {formatSwedishDateTime(group.startTime)},{' '}
        {group.targetDuration}h target
      </p>

      {group.endTime ? (
        <div className="bg-card border border-line rounded-2xl p-6 text-center font-serif italic text-muted">
          this fast has already ended — you can still{' '}
          <a href={`/group/view/${groupId}`} className="text-clay underline">
            see how it went
          </a>
        </div>
      ) : (
        <form onSubmit={handleJoin} className="bg-card border border-line rounded-2xl p-6">
          <label className="block font-semibold text-[15px] mb-2" htmlFor="join-name">
            Your name
          </label>
          <input
            id="join-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="How should we show you on the charts?"
            className="w-full px-4 py-3 border border-line rounded-xl bg-white mb-4"
            maxLength={40}
            autoFocus
          />
          <label className="block font-semibold text-[15px] mb-2" htmlFor="join-email">
            Email <span className="text-muted font-normal text-sm">(optional — we send you your own link)</span>
          </label>
          <input
            id="join-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-line rounded-xl bg-white mb-4"
          />
          {joinError && (
            <p className="text-clay text-sm mb-4">{joinError}</p>
          )}
          <button
            type="submit"
            disabled={joining || !name.trim()}
            className="w-full bg-clay text-white rounded-2xl py-4 font-semibold cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90 disabled:opacity-50"
          >
            {joining ? 'Joining…' : 'Join the fast'}
          </button>
          <p className="text-center text-xs text-muted font-serif italic mt-4">
            you&apos;ll share the group&apos;s clock and report your own check-ins
          </p>
        </form>
      )}
    </div>
  );
}
