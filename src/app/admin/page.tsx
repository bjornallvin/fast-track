'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatSwedishDateTime } from '@/utils/dateFormat';

interface AdminSession {
  id: string;
  name: string;
  startTime: string;
  targetDuration: number;
  isActive: boolean;
  email: string | null;
  editToken: string | null;
  checkins: number;
  bodyMetrics: number;
  notes: number;
}

interface AdminParticipant {
  id: string;
  name: string;
  email: string | null;
  reportToken: string;
  joinedAt: string;
  checkins: number;
  bodyMetrics: number;
}

interface AdminGroup {
  id: string;
  name: string;
  startTime: string;
  targetDuration: number;
  endTime: string | null;
  createdAt: string;
  email: string | null;
  editToken: string;
  participants: AdminParticipant[];
}

const TOKEN_KEY = 'adminToken';

// Click the email (or —) to edit in place; empty save clears it
const EditableEmail: React.FC<{
  value: string | null;
  onSave: (email: string) => Promise<boolean>;
}> = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value ?? '');
          setFailed(false);
          setEditing(true);
        }}
        className={`cursor-pointer underline decoration-dotted underline-offset-2 ${
          value ? 'text-ink' : 'text-muted'
        } hover:text-clay`}
        title="Edit email"
      >
        {value ?? 'add email'}
      </button>
    );
  }

  const save = async () => {
    setBusy(true);
    setFailed(false);
    const ok = await onSave(draft.trim());
    setBusy(false);
    if (ok) setEditing(false);
    else setFailed(true);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="email"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            save();
          }
          if (e.key === 'Escape') setEditing(false);
        }}
        placeholder="empty = remove"
        className={`px-2 py-1 border rounded-lg bg-white text-[13px] w-48 ${
          failed ? 'border-clay' : 'border-line'
        }`}
        autoFocus
      />
      <button
        onClick={save}
        disabled={busy}
        className="text-sage font-semibold cursor-pointer disabled:opacity-50"
        title="Save"
      >
        {busy ? '…' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-muted cursor-pointer"
        title="Cancel"
      >
        ×
      </button>
      {failed && <span className="text-clay text-xs">invalid</span>}
    </span>
  );
};

// Inline text editor (same interaction as EditableEmail, no validation).
const EditableName: React.FC<{
  value: string;
  onSave: (name: string) => Promise<boolean>;
}> = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="cursor-pointer underline decoration-dotted underline-offset-2 text-ink hover:text-clay"
        title="Edit name"
      >
        {value}
      </button>
    );
  }

  const save = async () => {
    const next = draft.trim();
    if (!next) return;
    setBusy(true);
    const ok = await onSave(next);
    setBusy(false);
    if (ok) setEditing(false);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            save();
          }
          if (e.key === 'Escape') setEditing(false);
        }}
        className="px-2 py-1 border border-line rounded-lg bg-white text-[13px] w-40"
        autoFocus
      />
      <button
        onClick={save}
        disabled={busy}
        className="text-sage font-semibold cursor-pointer disabled:opacity-50"
        title="Save"
      >
        {busy ? '…' : '✓'}
      </button>
      <button onClick={() => setEditing(false)} className="text-muted cursor-pointer" title="Cancel">
        ×
      </button>
    </span>
  );
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [input, setInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [groups, setGroups] = useState<AdminGroup[] | null>(null);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t, action: 'overview' }),
      });
      if (response.status === 403) {
        setAuthError('Wrong admin token.');
        setToken('');
        localStorage.removeItem(TOKEN_KEY);
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setAuthError(data.error ?? 'Failed to load.');
        return;
      }
      const data = await response.json();
      setSessions(data.sessions);
      setGroups(data.groups);
      setToken(t);
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      setAuthError('Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) load(stored);
  }, [load]);

  const setEmail = async (
    kind: 'session' | 'group' | 'participant',
    id: string,
    email: string,
    participantId?: string
  ): Promise<boolean> => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'set-email', kind, id, participantId, email }),
    });
    if (!response.ok) return false;
    const saved = email.trim().toLowerCase() || null;
    if (kind === 'session') {
      setSessions(prev => prev?.map(s => (s.id === id ? { ...s, email: saved } : s)) ?? null);
    } else if (kind === 'group') {
      setGroups(prev => prev?.map(g => (g.id === id ? { ...g, email: saved } : g)) ?? null);
    } else {
      setGroups(
        prev =>
          prev?.map(g =>
            g.id === id
              ? {
                  ...g,
                  participants: g.participants.map(p =>
                    p.id === participantId ? { ...p, email: saved } : p
                  ),
                }
              : g
          ) ?? null
      );
    }
    return true;
  };

  const setParticipantName = async (
    groupId: string,
    participantId: string,
    name: string
  ): Promise<boolean> => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'set-name', kind: 'participant', id: groupId, participantId, name }),
    });
    if (!response.ok) return false;
    setGroups(
      prev =>
        prev?.map(g =>
          g.id === groupId
            ? {
                ...g,
                participants: g.participants.map(p =>
                  p.id === participantId ? { ...p, name } : p
                ),
              }
            : g
        ) ?? null
    );
    return true;
  };

  const clearData = async (kind: 'session' | 'group', id: string, label: string) => {
    if (!confirm(`Clear ALL check-ins and body data for ${kind} "${label}"? This cannot be undone.`))
      return;
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'clear-data', kind, id }),
    });
    if (response.ok) load(token);
    else alert('Clear failed.');
  };

  const remove = async (kind: 'session' | 'group', id: string, label: string) => {
    if (!confirm(`Delete ${kind} "${label}" (${id})? This cannot be undone.`)) return;
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'delete', kind, id }),
    });
    if (response.ok) {
      if (kind === 'session') setSessions(prev => prev?.filter(s => s.id !== id) ?? null);
      else setGroups(prev => prev?.filter(g => g.id !== id) ?? null);
    } else {
      alert('Delete failed.');
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-7 py-16">
        <div className="font-serif font-semibold text-2xl mb-8 text-center">
          Fast<b className="text-clay">·</b>Track <span className="text-muted font-normal">admin</span>
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (input.trim()) load(input.trim());
          }}
          className="bg-card border border-line rounded-2xl p-6"
        >
          <label className="block font-semibold text-sm mb-2" htmlFor="admin-token">
            Admin token
          </label>
          <input
            id="admin-token"
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
            autoFocus
          />
          {authError && <p className="text-clay text-sm mb-4">{authError}</p>}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-clay text-white rounded-xl py-3 font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  const activeSessions = sessions?.filter(s => s.isActive).length ?? 0;
  const activeGroups = groups?.filter(g => !g.endTime).length ?? 0;
  const totalParticipants = groups?.reduce((sum, g) => sum + g.participants.length, 0) ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-7 py-9 pb-20">
      <header className="flex justify-between items-center mb-7">
        <a href="/" className="font-serif font-semibold text-[22px] text-ink">
          Fast<b className="text-clay">·</b>Track <span className="text-muted font-normal">admin</span>
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(token)}
            disabled={loading}
            className="text-[13px] text-muted font-serif italic cursor-pointer hover:text-ink"
          >
            {loading ? 'refreshing…' : '↻ refresh'}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              setToken('');
              setSessions(null);
              setGroups(null);
            }}
            className="text-[13px] text-muted underline cursor-pointer hover:text-ink"
          >
            lock
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="bg-card border border-line rounded-2xl px-4 py-4">
          <div className="text-xs text-muted">Solo fasts</div>
          <div className="font-serif font-medium text-3xl mt-0.5">
            {sessions?.length ?? '—'}
            <span className="text-sm text-muted"> · {activeSessions} live</span>
          </div>
        </div>
        <div className="bg-card border border-line rounded-2xl px-4 py-4">
          <div className="text-xs text-muted">Group fasts</div>
          <div className="font-serif font-medium text-3xl mt-0.5">
            {groups?.length ?? '—'}
            <span className="text-sm text-muted"> · {activeGroups} live</span>
          </div>
        </div>
        <div className="bg-card border border-line rounded-2xl px-4 py-4">
          <div className="text-xs text-muted">Participants</div>
          <div className="font-serif font-medium text-3xl mt-0.5">{totalParticipants}</div>
        </div>
        <div className="bg-card border border-line rounded-2xl px-4 py-4">
          <div className="text-xs text-muted">Check-ins</div>
          <div className="font-serif font-medium text-3xl mt-0.5">
            {(sessions?.reduce((sum, s) => sum + s.checkins, 0) ?? 0) +
              (groups?.reduce(
                (sum, g) => sum + g.participants.reduce((x, p) => x + p.checkins, 0),
                0
              ) ?? 0)}
          </div>
        </div>
      </div>

      <h3 className="font-serif font-medium text-xl mb-3.5 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
        Group fasts
      </h3>
      {!groups || groups.length === 0 ? (
        <p className="font-serif italic text-muted text-sm mb-8">none in the store</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {groups.map(g => (
            <div key={g.id} className="bg-card border border-line rounded-2xl px-5 py-4">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-[15px]">
                    {g.name}{' '}
                    {(() => {
                      const started = new Date(g.startTime).getTime() <= Date.now();
                      const state = g.endTime ? 'ended' : started ? 'live' : 'upcoming';
                      const color = g.endTime
                        ? 'text-muted'
                        : started
                          ? 'text-sage'
                          : 'text-clay';
                      return (
                        <span
                          className={`text-[11px] uppercase tracking-wider font-semibold ${color}`}
                        >
                          {state}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-[13px] text-muted mt-0.5">
                    {g.id} · start {formatSwedishDateTime(new Date(g.startTime))} · {g.targetDuration}h
                    {' · organizer '}
                    <EditableEmail
                      value={g.email}
                      onSave={email => setEmail('group', g.id, email)}
                    />
                  </div>
                </div>
                <div className="flex gap-3 items-center text-sm">
                  <a href={`/group/${g.editToken}/${g.id}`} className="text-clay underline">
                    open
                  </a>
                  <a href={`/group/view/${g.id}`} className="text-muted underline">
                    view
                  </a>
                  <button
                    onClick={() => clearData('group', g.id, g.name)}
                    className="text-muted underline cursor-pointer hover:text-ink"
                  >
                    clear data
                  </button>
                  <button
                    onClick={() => remove('group', g.id, g.name)}
                    className="text-clay underline cursor-pointer hover:text-ink"
                  >
                    delete
                  </button>
                </div>
              </div>
              {g.participants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-line/70 overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="pr-4 font-medium">Participant</th>
                        <th className="pr-4 font-medium">Email</th>
                        <th className="pr-4 font-medium">Check-ins</th>
                        <th className="pr-4 font-medium">Body</th>
                        <th className="font-medium">Report link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.participants.map(p => (
                        <tr key={p.id}>
                          <td className="pr-4 py-1 font-medium">
                            <EditableName
                              value={p.name}
                              onSave={name => setParticipantName(g.id, p.id, name)}
                            />
                          </td>
                          <td className="pr-4 py-1 text-muted">
                            <EditableEmail
                              value={p.email}
                              onSave={email => setEmail('participant', g.id, email, p.id)}
                            />
                          </td>
                          <td className="pr-4 py-1">{p.checkins}</td>
                          <td className="pr-4 py-1">{p.bodyMetrics}</td>
                          <td className="py-1">
                            <a
                              href={`/group/report/${p.reportToken}/${g.id}`}
                              className="text-clay underline"
                            >
                              open
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h3 className="font-serif font-medium text-xl mb-3.5 flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
        Solo fasts
      </h3>
      {!sessions || sessions.length === 0 ? (
        <p className="font-serif italic text-muted text-sm">none in the store</p>
      ) : (
        <div className="bg-card border border-line rounded-2xl px-5 py-4 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-muted">
                <th className="pr-4 font-medium">Name</th>
                <th className="pr-4 font-medium">Start</th>
                <th className="pr-4 font-medium">Target</th>
                <th className="pr-4 font-medium">Check-ins</th>
                <th className="pr-4 font-medium">Email</th>
                <th className="pr-4 font-medium">Status</th>
                <th className="font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-t border-line/60">
                  <td className="pr-4 py-2 font-medium">{s.name}</td>
                  <td className="pr-4 py-2 text-muted">
                    {formatSwedishDateTime(new Date(s.startTime))}
                  </td>
                  <td className="pr-4 py-2">{s.targetDuration}h</td>
                  <td className="pr-4 py-2">
                    {s.checkins} · {s.bodyMetrics}b · {s.notes}j
                  </td>
                  <td className="pr-4 py-2 text-muted">
                    <EditableEmail
                      value={s.email}
                      onSave={email => setEmail('session', s.id, email)}
                    />
                  </td>
                  <td className="pr-4 py-2">
                    {(() => {
                      const started = new Date(s.startTime).getTime() <= Date.now();
                      const state = !s.isActive ? 'ended' : started ? 'live' : 'upcoming';
                      const color = !s.isActive
                        ? 'text-muted'
                        : started
                          ? 'text-sage font-semibold'
                          : 'text-clay font-semibold';
                      return <span className={color}>{state}</span>;
                    })()}
                  </td>
                  <td className="py-2">
                    <span className="flex gap-2.5">
                      {s.editToken && (
                        <a href={`/session/${s.editToken}/${s.id}`} className="text-clay underline">
                          open
                        </a>
                      )}
                      <a href={`/view/${s.id}`} className="text-muted underline">
                        view
                      </a>
                      <button
                        onClick={() => clearData('session', s.id, s.name)}
                        className="text-muted cursor-pointer hover:font-semibold"
                      >
                        clear data
                      </button>
                      <button
                        onClick={() => remove('session', s.id, s.name)}
                        className="text-clay cursor-pointer hover:font-semibold"
                      >
                        delete
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center mt-10 text-xs text-muted font-serif italic">
        admin only · token checked server-side · emails and links visible here are private
      </div>
    </div>
  );
}
