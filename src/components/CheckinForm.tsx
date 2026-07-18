'use client';

import { useState } from 'react';
import type { CheckinEntry } from '../types';

interface CheckinFormProps {
  onSubmit: (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => void;
  onClose?: () => void;
  inline?: boolean; // render as an in-page card instead of a modal
  heading?: string;
  subheading?: string;
}

const SCALE_FIELDS: {
  key: 'energy' | 'hunger' | 'mentalClarity' | 'mood' | 'physicalComfort';
  label: string;
  low: string;
  high: string;
  clay?: boolean;
}[] = [
  { key: 'energy', label: 'Energy', low: 'drained', high: 'wired' },
  { key: 'hunger', label: 'Hunger', low: 'satisfied', high: 'ravenous', clay: true },
  { key: 'mentalClarity', label: 'Mental clarity', low: 'foggy', high: 'sharp' },
  { key: 'mood', label: 'Mood', low: 'low', high: 'bright' },
  { key: 'physicalComfort', label: 'Physical comfort', low: 'uncomfortable', high: 'at ease' },
];

// Warm 1–10 button scales per the redesign mock (replaces the old sliders)
const CheckinForm: React.FC<CheckinFormProps> = ({
  onSubmit,
  onClose,
  inline = false,
  heading = 'How are you, right now?',
  subheading,
}) => {
  const [formData, setFormData] = useState({
    energy: 5,
    hunger: 5,
    mentalClarity: 5,
    mood: 5,
    physicalComfort: 5,
    sleepQuality: undefined as number | undefined,
    waterIntake: undefined as number | undefined,
    electrolytes: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose?.();
  };

  const form = (
    <form onSubmit={handleSubmit}>
      <h2 className="font-serif font-medium text-2xl sm:text-3xl tracking-tight">
        {heading}
      </h2>
      {subheading && (
        <div className="font-serif italic text-muted mt-1">{subheading}</div>
      )}

      <div className="mt-6 space-y-6">
        {SCALE_FIELDS.map(field => (
          <div key={field.key}>
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="font-semibold text-[15px]">{field.label}</span>
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

      <div className="bg-card border border-line rounded-2xl px-5 py-2 my-7">
        <div className="flex justify-between items-center py-2.5">
          <label className="font-medium text-[15px]" htmlFor="checkin-water">
            Water so far (glasses)
          </label>
          <input
            id="checkin-water"
            type="number"
            min="0"
            max="30"
            step="0.5"
            value={formData.waterIntake ?? ''}
            onChange={e =>
              setFormData({
                ...formData,
                waterIntake: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-[90px] px-2.5 py-2 border border-line rounded-lg text-right bg-white"
            placeholder="—"
          />
        </div>
        <div className="flex justify-between items-center py-2.5 border-t border-line">
          <label className="font-medium text-[15px]">Electrolytes taken</label>
          <button
            type="button"
            role="switch"
            aria-checked={formData.electrolytes}
            onClick={() =>
              setFormData({ ...formData, electrolytes: !formData.electrolytes })
            }
            className={`w-[46px] h-[26px] rounded-full relative cursor-pointer transition-colors ${
              formData.electrolytes ? 'bg-sage' : 'bg-line'
            }`}
          >
            <span
              className={`absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all ${
                formData.electrolytes ? 'right-[3px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>
        <div className="flex justify-between items-center py-2.5 border-t border-line">
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
        className="bg-paper rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {form}
      </div>
    </div>
  );
};

export default CheckinForm;
