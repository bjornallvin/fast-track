'use client';

import { useState } from 'react';
import type { CheckinEntry } from '../types';

interface CheckinFormProps {
  onSubmit: (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => void;
  onClose?: () => void;
  inline?: boolean; // render as an in-page card instead of a modal
  heading?: string;
  subheading?: string;
  showSleep?: boolean; // only meaningful on the first check-in of the day
  status?: { ok: boolean; text: string } | null; // shown right at the save button
}

const SCALE_FIELDS: {
  key: 'energy' | 'hunger' | 'mentalClarity' | 'mood' | 'physicalComfort';
  label: string;
  low: string;
  high: string;
  hint: string;
  clay?: boolean;
}[] = [
  {
    key: 'energy',
    label: 'Energy',
    low: 'drained',
    high: 'wired',
    hint: 'Your overall energy level and ability to perform daily activities',
  },
  {
    key: 'hunger',
    label: 'Hunger',
    low: 'satisfied',
    high: 'ravenous',
    clay: true,
    hint: 'How strong your hunger sensations are (1 = none, 10 = extreme)',
  },
  {
    key: 'mentalClarity',
    label: 'Mental clarity',
    low: 'foggy',
    high: 'sharp',
    hint: 'Your ability to think clearly, focus, and concentrate',
  },
  {
    key: 'mood',
    label: 'Mood',
    low: 'low',
    high: 'bright',
    hint: 'Your emotional state and overall feeling of well-being',
  },
  {
    key: 'physicalComfort',
    label: 'Physical comfort',
    low: 'uncomfortable',
    high: 'at ease',
    hint: 'Your physical comfort level — absence of pain or discomfort',
  },
];

// Warm 1–10 button scales per the redesign mock (replaces the old sliders)
const CheckinForm: React.FC<CheckinFormProps> = ({
  onSubmit,
  onClose,
  inline = false,
  heading = 'How are you, right now?',
  subheading,
  showSleep = true,
  status,
}) => {
  const [formData, setFormData] = useState({
    energy: 5,
    hunger: 5,
    mentalClarity: 5,
    mood: 5,
    physicalComfort: 5,
    sleepQuality: undefined as number | undefined,
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { note, ...rest } = formData;
    onSubmit({ ...rest, note: note.trim() || undefined });
    onClose?.();
  };

  const form = (
    <form onSubmit={handleSubmit}>
      <h2 className="font-serif font-medium text-2xl sm:text-3xl tracking-tight">
        {heading}
      </h2>
      <div className="font-serif italic text-muted mt-1">
        {subheading ?? 'a snapshot of this moment — not an average since your last check-in'}
      </div>

      <div className="mt-6 grid gap-y-6 sm:grid-cols-2 sm:gap-x-14 lg:gap-x-20 [&>*:nth-child(even)]:sm:border-l [&>*:nth-child(even)]:sm:border-line [&>*:nth-child(even)]:sm:pl-14 lg:[&>*:nth-child(even)]:pl-20">
        {SCALE_FIELDS.map(field => (
          <div key={field.key}>
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="font-semibold text-[15px] cursor-help" title={field.hint}>
                {field.label}
              </span>
              <span className="font-serif font-medium text-2xl text-clay" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formData[field.key]}
                <span className="text-sm text-muted font-sans">/10</span>
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(value => {
                const on = formData[field.key] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, [field.key]: value })}
                    className={`flex-1 aspect-square max-h-11 rounded-[11px] border-[1.5px] text-[15px] cursor-pointer transition-colors ${
                      on
                        ? field.clay
                          ? 'bg-clay border-clay text-white font-semibold'
                          : 'bg-sage border-sage text-white font-semibold'
                        : 'bg-card border-line text-muted hover:border-muted'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted mt-1.5 font-serif italic">
              <span>{field.low}</span>
              <span>{field.high}</span>
            </div>
          </div>
        ))}
      </div>

      {showSleep && (
        <div className="mt-7 bg-card border border-line rounded-2xl px-5 py-2">
          <div className="flex justify-between items-center py-2.5">
            <label className="font-medium text-[15px]" htmlFor="checkin-sleep">
              Sleep last night (1–10)
            </label>
            <input
              id="checkin-sleep"
              type="number"
              min="1"
              max="10"
              value={formData.sleepQuality ?? ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  sleepQuality: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-[90px] px-2.5 py-2 border border-line rounded-lg text-right bg-white"
              placeholder="—"
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <label className="font-medium text-[15px] block mb-2" htmlFor="checkin-note">
          Anything to note? <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="checkin-note"
          value={formData.note}
          onChange={e => setFormData({ ...formData, note: e.target.value })}
          rows={2}
          placeholder="How's it going? Cravings, wins, how you're feeling…"
          className="w-full px-3.5 py-3 border border-line rounded-xl bg-white resize-y text-[15px]"
        />
      </div>

      <div className="mt-6" />

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-clay text-white rounded-2xl py-4 font-semibold text-base cursor-pointer shadow-[0_6px_18px_rgba(181,100,63,.25)] hover:opacity-90"
        >
          Save check-in
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-6 rounded-2xl border border-line bg-card text-ink font-semibold cursor-pointer hover:border-muted"
          >
            Cancel
          </button>
        )}
      </div>
      {status && (
        <div
          className={`mt-3 px-4 py-3 rounded-xl border text-sm font-medium text-center ${
            status.ok ? 'border-sage text-sage bg-sage/10' : 'border-clay text-clay bg-clay/10'
          }`}
        >
          {status.text}
        </div>
      )}
      <p className="text-center text-xs text-muted font-serif italic mt-4">
        every check-in becomes a point on your curve
      </p>
    </form>
  );

  if (inline) {
    return form;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(44, 38, 32, 0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {form}
      </div>
    </div>
  );
};

export default CheckinForm;
