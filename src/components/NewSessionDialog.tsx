'use client';

import { useState } from 'react';

interface NewSessionDialogProps {
  onCreateSession: (name: string, startTime: Date, targetDuration: number, email?: string) => void;
  onClose: () => void;
}

const NewSessionDialog: React.FC<NewSessionDialogProps> = ({ onCreateSession, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [startNow, setStartNow] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [targetDuration, setTargetDuration] = useState('72');

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please give your fast a name');
      return;
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      alert('Please enter a valid email address');
      return;
    }
    const sessionStartTime = startNow ? new Date() : new Date(`${startDate}T${startTime}`);
    onCreateSession(name.trim(), sessionStartTime, parseInt(targetDuration), email.trim() || undefined);
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
        className="bg-paper rounded-2xl shadow-xl p-7 w-full max-w-md max-h-[92vh] overflow-y-auto"
      >
        <h2 className="font-serif font-medium text-2xl">Start a new fast</h2>
        <p className="font-serif italic text-muted text-sm mt-1 mb-5">
          name it, set the clock, and begin
        </p>

        <label className="block font-semibold text-sm mb-1" htmlFor="session-name">
          Name
        </label>
        <input
          id="session-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Björn · Weekend 36-hour"
          className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
          autoFocus
        />

        <label className="block font-semibold text-sm mb-1" htmlFor="session-email">
          Email <span className="text-muted font-normal">(optional, for link recovery)</span>
        </label>
        <input
          id="session-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-4"
        />

        <span className="block font-semibold text-sm mb-2">Start time</span>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setStartNow(true)}
            className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer ${
              startNow ? 'bg-sage border-sage text-white' : 'bg-card border-line text-muted'
            }`}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => setStartNow(false)}
            className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer ${
              !startNow ? 'bg-sage border-sage text-white' : 'bg-card border-line text-muted'
            }`}
          >
            Pick a time
          </button>
        </div>
        {!startNow && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2.5 border border-line rounded-xl bg-white"
            />
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="px-3 py-2.5 border border-line rounded-xl bg-white"
            />
          </div>
        )}

        <label className="block font-semibold text-sm mb-1 mt-1" htmlFor="session-target">
          Target
        </label>
        <select
          id="session-target"
          value={targetDuration}
          onChange={e => setTargetDuration(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-6"
        >
          <option value="16">16 hours</option>
          <option value="18">18 hours</option>
          <option value="24">24 hours (1 day)</option>
          <option value="36">36 hours</option>
          <option value="48">48 hours (2 days)</option>
          <option value="72">72 hours (3 days)</option>
          <option value="96">96 hours (4 days)</option>
          <option value="120">120 hours (5 days)</option>
        </select>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-clay text-white rounded-xl py-3 font-semibold cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90"
          >
            Begin
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

export default NewSessionDialog;
