'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSessionId } from '@/utils/sessionId';
import { generateEditToken } from '@/utils/editToken';
import NewSessionDialog from '@/components/NewSessionDialog';
import NewGroupDialog from '@/components/NewGroupDialog';
import type { FastingSession } from '@/types';
import type { SessionLink } from '@/types/sessionLink';
import { loadGroupLinks, saveGroupLink, type GroupLink } from '@/types/groupLink';

export default function Home() {
  const router = useRouter();
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editableSessions, setEditableSessions] = useState<SessionLink[]>([]);
  const [readOnlySessions, setReadOnlySessions] = useState<SessionLink[]>([]);
  const [myGroups, setMyGroups] = useState<GroupLink[]>([]);
  const [followedGroups, setFollowedGroups] = useState<GroupLink[]>([]);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverStatus, setRecoverStatus] = useState<string | null>(null);
  const [recoverBusy, setRecoverBusy] = useState(false);

  useEffect(() => {
    const storedLinks = localStorage.getItem('sessionLinks');
    if (storedLinks) {
      try {
        const links: SessionLink[] = JSON.parse(storedLinks);
        const parsedLinks = links.map(link => ({
          ...link,
          lastAccessed: new Date(link.lastAccessed),
          startTime: new Date(link.startTime),
        }));
        const editable = parsedLinks.filter(link => link.type === 'editable');
        const readOnly = parsedLinks.filter(link => link.type === 'readonly');
        editable.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
        readOnly.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
        setEditableSessions(editable.slice(0, 5));
        setReadOnlySessions(readOnly.slice(0, 5));
      } catch (e) {
        console.error('Error loading session links:', e);
      }
    }

    const groups = loadGroupLinks().sort(
      (a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime()
    );
    setMyGroups(groups.filter(g => g.role !== 'viewer').slice(0, 5));
    setFollowedGroups(groups.filter(g => g.role === 'viewer').slice(0, 5));
  }, []);

  const handleCreateSession = async (
    name: string,
    startTime: Date,
    targetDuration: number,
    email?: string
  ) => {
    const sessionId = generateSessionId();
    const editToken = generateEditToken();
    const newSession: FastingSession = {
      id: sessionId,
      name,
      startTime,
      endTime: null,
      targetDuration,
      isActive: true,
      entries: [],
      bodyMetrics: [],
      notes: [],
      editToken,
      email,
    };

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      });

      const sessionLink: SessionLink = {
        id: sessionId,
        name,
        type: 'editable',
        editToken,
        lastAccessed: new Date(),
        startTime,
        targetDuration,
        isActive: true,
      };
      const storedLinks = localStorage.getItem('sessionLinks');
      const links: SessionLink[] = storedLinks ? JSON.parse(storedLinks) : [];
      links.push(sessionLink);
      localStorage.setItem('sessionLinks', JSON.stringify(links));
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to create session. Please try again.');
      return;
    }

    router.push(`/session/${editToken}/${sessionId}`);
  };

  const handleCreateGroup = async (
    name: string,
    startTime: Date,
    targetDuration: number
  ) => {
    const groupId = generateSessionId();
    const editToken = generateEditToken();
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startTime, targetDuration, editToken }),
      });
      if (!response.ok) throw new Error('Create failed');
      saveGroupLink({
        id: groupId,
        groupName: name,
        role: 'organizer',
        token: editToken,
        lastAccessed: new Date(),
        startTime,
        targetDuration,
        isActive: true,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create the group fast. Please try again.');
      return;
    }
    router.push(`/group/${editToken}/${groupId}`);
  };

  const navigateToSession = (link: SessionLink) => {
    const storedLinks = localStorage.getItem('sessionLinks');
    if (storedLinks) {
      const links: SessionLink[] = JSON.parse(storedLinks);
      const index = links.findIndex(l => l.id === link.id && l.type === link.type);
      if (index !== -1) {
        links[index].lastAccessed = new Date();
        localStorage.setItem('sessionLinks', JSON.stringify(links));
      }
    }
    if (link.type === 'editable' && link.editToken) {
      router.push(`/session/${link.editToken}/${link.id}`);
    } else {
      router.push(`/view/${link.id}`);
    }
  };

  const groupHref = (g: GroupLink) => {
    if (g.role === 'organizer' && g.token) return `/group/${g.token}/${g.id}`;
    if (g.role === 'participant' && g.token) return `/group/report/${g.token}/${g.id}`;
    return `/group/view/${g.id}`;
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverEmail.trim()) return;
    setRecoverBusy(true);
    setRecoverStatus(null);
    try {
      const response = await fetch('/api/email/send-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoverEmail.trim() }),
      });
      if (response.ok) {
        setRecoverStatus('Sent — check your inbox.');
      } else if (response.status === 404) {
        setRecoverStatus('No fasts found for that email.');
      } else {
        setRecoverStatus('Could not send just now. Try again.');
      }
    } catch {
      setRecoverStatus('Could not send just now. Try again.');
    } finally {
      setRecoverBusy(false);
    }
  };

  const badge = (name: string, readonly?: boolean) => (
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center font-serif text-xl shrink-0 ${
        readonly ? 'bg-[#eaeee2] text-sage' : 'bg-[#efe6d3] text-clay'
      }`}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );

  const sectionHeading = (title: string, comment: string) => (
    <h3 className="font-serif font-medium text-[19px] mb-3.5 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
      {title}{' '}
      <span className="text-xs italic text-muted font-serif font-normal">— {comment}</span>
    </h3>
  );

  const hasOwn = editableSessions.length > 0 || myGroups.length > 0;
  const hasShared = readOnlySessions.length > 0 || followedGroups.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-7 pt-10 pb-20">
      <header className="flex justify-between items-center mb-11">
        <div className="font-serif font-semibold text-2xl tracking-tight">
          Fast<b className="text-clay">·</b>Track
        </div>
      </header>

      <div className="text-center mb-9">
        <h1 className="font-serif font-medium text-4xl sm:text-5xl tracking-tight leading-tight">
          Fast with <em className="italic text-clay">intention.</em>
        </h1>
        <p className="font-serif italic text-muted mt-3">
          a quiet place to track how you feel, hour by hour
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <button
          onClick={() => setShowNewSession(true)}
          className="flex-1 bg-clay text-white rounded-2xl py-4 text-base font-semibold cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90"
        >
          ＋ Start a new fast
        </button>
        <button
          onClick={() => setShowNewGroup(true)}
          className="flex-1 border border-clay text-clay rounded-2xl py-4 text-base font-semibold cursor-pointer hover:bg-clay hover:text-white transition-colors"
        >
          Start a group fast
        </button>
      </div>

      {hasOwn && (
        <>
          {sectionHeading('Your fasts', 'stored on this device')}
          <div className="flex flex-col gap-2.5 mb-9">
            {myGroups.map(g => (
              <a
                key={`group-${g.id}-${g.role}`}
                href={groupHref(g)}
                className="flex items-center gap-4 bg-card border border-line rounded-2xl px-4.5 py-4 hover:border-clay"
              >
                {badge(g.groupName)}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">
                    {g.groupName}
                    <span className="text-muted font-normal">
                      {' '}
                      · group{g.role === 'organizer' ? ' · organizer' : g.participantName ? ` · as ${g.participantName}` : ''}
                    </span>
                  </div>
                  <div className="text-[13px] text-muted mt-px">
                    {g.targetDuration}h shared fast
                  </div>
                </div>
                {g.isActive ? (
                  <span className="text-[11px] text-sage font-semibold uppercase tracking-wider flex items-center gap-1.5 before:content-[''] before:w-[7px] before:h-[7px] before:rounded-full before:bg-sage before:shadow-[0_0_0_3px_rgba(124,138,107,.2)]">
                    Fasting
                  </span>
                ) : (
                  <span className="text-muted text-xl">›</span>
                )}
              </a>
            ))}
            {editableSessions.map(session => (
              <button
                key={`${session.id}-editable`}
                onClick={() => navigateToSession(session)}
                className="flex items-center gap-4 bg-card border border-line rounded-2xl px-4.5 py-4 hover:border-clay cursor-pointer text-left"
              >
                {badge(session.name)}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{session.name}</div>
                  <div className="text-[13px] text-muted mt-px">
                    {session.targetDuration}h fast
                  </div>
                </div>
                {session.isActive ? (
                  <span className="text-[11px] text-sage font-semibold uppercase tracking-wider flex items-center gap-1.5 before:content-[''] before:w-[7px] before:h-[7px] before:rounded-full before:bg-sage before:shadow-[0_0_0_3px_rgba(124,138,107,.2)]">
                    Fasting
                  </span>
                ) : (
                  <span className="text-muted text-xl">›</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {hasShared && (
        <>
          {sectionHeading('Shared with you', 'read-only')}
          <div className="flex flex-col gap-2.5 mb-9">
            {followedGroups.map(g => (
              <a
                key={`group-${g.id}-viewer`}
                href={groupHref(g)}
                className="flex items-center gap-4 bg-card border border-line rounded-2xl px-4.5 py-4 hover:border-clay"
              >
                {badge(g.groupName, true)}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">
                    {g.groupName}
                    <span className="text-muted font-normal"> · group</span>
                  </div>
                  <div className="text-[13px] text-muted mt-px">following along</div>
                </div>
                <span className="text-muted text-xl">›</span>
              </a>
            ))}
            {readOnlySessions.map(session => (
              <button
                key={`${session.id}-readonly`}
                onClick={() => navigateToSession(session)}
                className="flex items-center gap-4 bg-card border border-line rounded-2xl px-4.5 py-4 hover:border-clay cursor-pointer text-left"
              >
                {badge(session.name, true)}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{session.name}</div>
                  <div className="text-[13px] text-muted mt-px">
                    {session.targetDuration}h fast · following along
                  </div>
                </div>
                <span className="text-muted text-xl">›</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="bg-card border border-dashed border-line rounded-2xl px-5 py-4.5 text-center">
        <p className="text-sm text-muted mb-3">Lost your links? Recover your fasts by email.</p>
        <form onSubmit={handleRecover} className="flex gap-2.5 max-w-md mx-auto">
          <input
            type="email"
            value={recoverEmail}
            onChange={e => setRecoverEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 px-3.5 py-3 border border-line rounded-xl bg-white text-sm min-w-0"
          />
          <button
            type="submit"
            disabled={recoverBusy || !recoverEmail.trim()}
            className="px-4.5 py-3 rounded-xl border border-clay text-clay font-semibold text-sm cursor-pointer hover:bg-clay hover:text-white transition-colors disabled:opacity-50"
          >
            {recoverBusy ? 'Sending…' : 'Email my links'}
          </button>
        </form>
        {recoverStatus && (
          <p className="text-sm text-muted font-serif italic mt-3">{recoverStatus}</p>
        )}
      </div>

      <div className="mt-12">
        {sectionHeading('Why fast', 'what the research says')}
        <div className="bg-card border border-line rounded-2xl px-6 py-5 mb-9">
          <ul className="space-y-2 text-[15px]">
            <li className="flex gap-2.5"><span className="text-sage">•</span>Better blood sugar control</li>
            <li className="flex gap-2.5"><span className="text-sage">•</span>Lower blood pressure and heart rate</li>
            <li className="flex gap-2.5"><span className="text-sage">•</span>Reduced inflammation in the body</li>
            <li className="flex gap-2.5"><span className="text-sage">•</span>Weight loss and less belly fat</li>
            <li className="flex gap-2.5"><span className="text-sage">•</span>May improve brain function (still being studied)</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-line text-xs">
            <span className="text-muted font-serif italic">learn more: </span>
            <a href="https://www.nejm.org/doi/full/10.1056/NEJMra1905136" target="_blank" rel="noopener noreferrer" className="text-clay underline mr-3">
              NEJM — Effects of Intermittent Fasting
            </a>
            <a href="https://pubmed.ncbi.nlm.nih.gov/31614992/" target="_blank" rel="noopener noreferrer" className="text-clay underline">
              Effects on Health, Aging, and Disease
            </a>
          </div>
        </div>

        {sectionHeading('What happens inside', 'hour by hour')}
        <div className="flex flex-col gap-2.5 mb-4">
          {[
            { hours: '0–4h', title: 'After eating', text: 'Body processes food, stores energy for later use' },
            { hours: '4–16h', title: 'Early fasting', text: 'Body starts using stored sugar, making new energy' },
            { hours: '12–18h', title: 'Sugar stores running low', text: 'Liver sugar mostly used up, body starts burning more fat' },
            { hours: '18–24h', title: 'Fat burning mode', text: 'Body switches to burning fat for energy' },
            { hours: '48–72h', title: 'Extended fasting', text: 'Fat burning peaks, growth hormone rises, cell cleanup increases' },
          ].map(phase => (
            <div key={phase.hours} className="flex items-center gap-4 bg-card border border-line rounded-2xl px-5 py-3.5">
              <span className="font-serif font-medium text-clay text-lg w-16 shrink-0 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {phase.hours}
              </span>
              <div>
                <div className="font-semibold text-[15px]">{phase.title}</div>
                <div className="text-[13px] text-muted">{phase.text}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted font-serif italic mb-4">
          based on scientific literature — individual responses vary ·{' '}
          <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5783752/" target="_blank" rel="noopener noreferrer" className="underline">Anton 2018</a> ·{' '}
          <a href="https://www.cell.com/cell-metabolism/fulltext/S1550-4131(15)00224-7" target="_blank" rel="noopener noreferrer" className="underline">Mattson 2018</a> ·{' '}
          <a href="https://pubmed.ncbi.nlm.nih.gov/30172870/" target="_blank" rel="noopener noreferrer" className="underline">Levine 2017</a> ·{' '}
          <a href="https://www.annualreviews.org/doi/10.1146/annurev-nutr-071816-064634" target="_blank" rel="noopener noreferrer" className="underline">Panda 2016</a>
        </p>
        <div className="bg-card border border-ochre/60 rounded-2xl px-5 py-4 text-[13px] text-muted">
          <b className="text-ink">A word of care:</b> fasting isn&apos;t for everyone. Talk to a healthcare
          provider first — especially with diabetes, medications, pregnancy or nursing, or a history
          of eating disorders.
        </div>
      </div>

      <div className="text-center mt-11 text-xs text-muted font-serif italic">
        No accounts. Your fasts live in this browser and sync by link.
      </div>

      {showNewSession && (
        <NewSessionDialog
          onCreateSession={handleCreateSession}
          onClose={() => setShowNewSession(false)}
        />
      )}

      {showNewGroup && (
        <NewGroupDialog
          onCreateGroup={handleCreateGroup}
          onClose={() => setShowNewGroup(false)}
        />
      )}
    </div>
  );
}
