'use client';

import { useState } from 'react';
import type { FastingSession } from '@/types';

interface ResetFastDialogProps {
  startTime: Date;
  targetDuration: number;
  onClose: () => void;
  onSave: (updates: Partial<FastingSession>) => void;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Reset the fast: pick a new start time and length, optionally wiping logged data.
const ResetFastDialog: React.FC<ResetFastDialogProps> = ({
  startTime,
  targetDuration,
  onClose,
  onSave,
}) => {
  const [start, setStart] = useState(toLocalInput(new Date(startTime)));
  const [hours, setHours] = useState(targetDuration);
  const [clearData, setClearData] = useState(false);

  const save = () => {
    const parsed = new Date(start);
    if (isNaN(parsed.getTime()) || !hours || hours <= 0) return;
    onSave({
      startTime: parsed,
      targetDuration: hours,
      isActive: true,
      endTime: null,
      ...(clearData ? { entries: [], bodyMetrics: [], notes: [] } : {}),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(44, 38, 32, 0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-serif font-medium text-2xl tracking-tight mb-1">Reset this fast</h2>
        <p className="text-muted text-sm mb-5">Set a new start time and length for the fast.</p>

        <label className="block font-medium text-[15px] mb-2" htmlFor="reset-start">
          Start time
        </label>
        <input
          id="reset-start"
          type="datetime-local"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="w-full px-3.5 py-3 border border-line rounded-xl bg-white mb-4"
        />

        <label className="block font-medium text-[15px] mb-2" htmlFor="reset-hours">
          Target length (hours)
        </label>
        <input
          id="reset-hours"
          type="number"
          min="1"
          max="1000"
          value={hours}
          onChange={e => setHours(Number(e.target.value))}
          className="w-full px-3.5 py-3 border border-line rounded-xl bg-white mb-4"
        />

        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={clearData}
            onChange={e => setClearData(e.target.checked)}
            className="w-4 h-4 accent-clay"
          />
          <span className="text-[15px]">
            Also clear all check-ins, body metrics and notes
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={save}
            className="flex-1 bg-clay text-white rounded-xl py-3 font-semibold cursor-pointer hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-6 rounded-xl border border-line bg-card text-ink font-semibold cursor-pointer hover:border-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetFastDialog;
