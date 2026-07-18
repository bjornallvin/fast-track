'use client';

import { useState } from 'react';

interface NewGroupDialogProps {
  onCreateGroup: (name: string, startTime: Date, targetDuration: number) => void;
  onClose: () => void;
}

// Create one shared fast: a single start time and target for everyone.
const NewGroupDialog: React.FC<NewGroupDialogProps> = ({ onCreateGroup, onClose }) => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
  const [targetDuration, setTargetDuration] = useState('24');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateGroup(name.trim(), new Date(startTime), Number(targetDuration));
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(44, 38, 32, 0.55)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="bg-paper rounded-2xl shadow-xl p-7 w-full max-w-md"
      >
        <h2 className="font-serif font-medium text-2xl">Start a group fast</h2>
        <p className="font-serif italic text-muted text-sm mt-1 mb-5">
          one clock, one target — friends join by link and report their own check-ins
        </p>

        <label className="block font-semibold text-sm mb-1" htmlFor="group-name">
          Group name
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="January Reset Crew"
          className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
          maxLength={60}
          autoFocus
        />

        <label className="block font-semibold text-sm mb-1" htmlFor="group-start">
          Shared start time
        </label>
        <input
          id="group-start"
          type="datetime-local"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
        />

        <label className="block font-semibold text-sm mb-1" htmlFor="group-target">
          Target (hours)
        </label>
        <input
          id="group-target"
          type="number"
          min="1"
          max="240"
          value={targetDuration}
          onChange={e => setTargetDuration(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-6"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 bg-clay text-white rounded-xl py-3 font-semibold cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90 disabled:opacity-50"
          >
            Create group fast
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 rounded-xl border border-line bg-card font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewGroupDialog;
