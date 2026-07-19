'use client';

import { useState } from 'react';

interface ShareDialogProps {
  source: { kind: 'session' | 'group'; id: string };
  auth: string;
  canShareAll?: boolean; // group organizer: may share the whole group
  self?: { participantId: string }; // viewer is a participant: may share "just me"
  label?: string;
  className?: string;
}

const pill = (on: boolean) =>
  `flex-1 rounded-xl py-2.5 px-3 text-sm font-medium border transition-colors ${
    on ? 'bg-clay text-white border-clay' : 'bg-card text-muted border-line hover:text-ink'
  }`;

const Toggle: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  hint,
  checked,
  onChange,
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left"
  >
    <span>
      <span className="font-medium text-ink">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </span>
    <span
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-sage' : 'bg-line'}`}
    >
      <span
        className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </span>
  </button>
);

const ShareDialog: React.FC<ShareDialogProps> = ({
  source,
  auth,
  canShareAll,
  self,
  label = 'Share',
  className,
}) => {
  const isGroup = source.kind === 'group';
  const bothScopes = isGroup && canShareAll && !!self;
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'all' | 'participant'>(canShareAll ? 'all' : 'participant');
  const [show, setShow] = useState({ checkins: true, bodyMetrics: true, journal: false });
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const reset = () => {
    setLink(null);
    setError(false);
    setCopied(false);
  };

  const create = async () => {
    setBusy(true);
    setError(false);
    try {
      const body: Record<string, unknown> = { source, show, auth };
      if (isGroup) {
        body.scope = scope;
        if (scope === 'participant') body.participantId = self?.participantId;
      }
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const { shareId } = await res.json();
      setLink(`${window.location.origin}/s/${shareId}`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className={
          className ??
          'flex-1 min-w-[110px] rounded-xl py-3.5 px-4 font-semibold border border-line bg-transparent cursor-pointer hover:border-sage hover:text-sage transition-colors'
        }
        title="Create a read-only share"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-line bg-paper p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-serif font-medium text-2xl mb-1">Share this fast</h2>
            <p className="text-muted text-sm mb-4">
              Choose what people can see — the link is read-only and shows only what you pick.
            </p>

            {bothScopes && (
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Who to show</div>
                <div className="flex gap-2">
                  <button onClick={() => { setScope('all'); reset(); }} className={pill(scope === 'all')}>
                    Everyone
                  </button>
                  <button
                    onClick={() => { setScope('participant'); reset(); }}
                    className={pill(scope === 'participant')}
                  >
                    Just me
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-5">
              <Toggle
                label="Wellbeing check-ins"
                checked={show.checkins}
                onChange={v => { setShow(s => ({ ...s, checkins: v })); reset(); }}
              />
              <Toggle
                label="Weight & body fat"
                checked={show.bodyMetrics}
                onChange={v => { setShow(s => ({ ...s, bodyMetrics: v })); reset(); }}
              />
              <Toggle
                label="Journal notes"
                checked={show.journal}
                onChange={v => { setShow(s => ({ ...s, journal: v })); reset(); }}
              />
            </div>

            {!link ? (
              <button
                onClick={create}
                disabled={busy}
                className="w-full rounded-xl bg-clay text-white py-3 font-semibold disabled:opacity-60"
              >
                {busy ? 'Creating…' : 'Create link'}
              </button>
            ) : (
              <div>
                <div className="rounded-xl border border-line bg-card p-3 text-sm break-all mb-2">{link}</div>
                <button onClick={copy} className="w-full rounded-xl bg-clay text-white py-3 font-semibold">
                  {copied ? 'Copied ✓' : 'Copy link'}
                </button>
              </div>
            )}

            {error && <p className="text-clay text-sm mt-2">Couldn&apos;t create the link. Try again.</p>}

            <button onClick={() => setOpen(false)} className="w-full text-muted text-sm mt-3 hover:text-ink">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareDialog;
