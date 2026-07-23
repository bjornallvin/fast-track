'use client';

import { useState } from 'react';
import type { BodyMetric } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface BodyMetricsProps {
  metrics: BodyMetric[];
  onAddMetric: (metric: Omit<BodyMetric, 'id' | 'timestamp'>) => void;
  onEditMetric?: (id: string, metric: Omit<BodyMetric, 'id' | 'timestamp'>) => void;
  onDeleteMetric?: (id: string) => void;
}

const BodyMetrics: React.FC<BodyMetricsProps> = ({
  metrics,
  onAddMetric,
  onEditMetric,
  onDeleteMetric,
}) => {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metric: Omit<BodyMetric, 'id' | 'timestamp'> = {};
    if (weight) metric.weight = Number(weight);
    if (bodyFat) metric.bodyFatPercentage = Number(bodyFat);
    if (metric.weight || metric.bodyFatPercentage) {
      if (editingId && onEditMetric) {
        onEditMetric(editingId, metric);
        setEditingId(null);
      } else {
        onAddMetric(metric);
      }
      setWeight('');
      setBodyFat('');
    }
  };

  const startEdit = (m: BodyMetric) => {
    setEditingId(m.id);
    setWeight(m.weight != null ? String(m.weight) : '');
    setBodyFat(m.bodyFatPercentage != null ? String(m.bodyFatPercentage) : '');
  };

  const history = [...metrics].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="bg-card border border-line rounded-2xl px-5 py-5">
      <h3 className="font-serif font-medium text-lg mb-3">Log body</h3>
      <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap mb-4">
        <div className="flex-1 min-w-[110px]">
          <label className="block text-sm text-muted mb-1" htmlFor="solo-weight">
            Weight (kg)
          </label>
          <input
            id="solo-weight"
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="w-full px-3 py-2.5 border border-line rounded-xl bg-white"
            placeholder="—"
          />
        </div>
        <div className="flex-1 min-w-[110px]">
          <label className="block text-sm text-muted mb-1" htmlFor="solo-fat">
            Body fat (%)
          </label>
          <input
            id="solo-fat"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={bodyFat}
            onChange={e => setBodyFat(e.target.value)}
            className="w-full px-3 py-2.5 border border-line rounded-xl bg-white"
            placeholder="—"
          />
        </div>
        <button
          type="submit"
          disabled={!weight && !bodyFat}
          className="px-5 py-2.5 rounded-xl border border-clay text-clay font-semibold cursor-pointer hover:bg-clay hover:text-white disabled:opacity-40 transition-colors"
        >
          {editingId ? 'Update' : 'Save'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setWeight('');
              setBodyFat('');
            }}
            className="px-4 py-2.5 rounded-xl border border-line text-muted font-semibold cursor-pointer hover:border-muted"
          >
            Cancel
          </button>
        )}
      </form>

      {history.length === 0 ? (
        <p className="font-serif italic text-muted text-sm">no measurements yet</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {history.map(metric => (
            <div
              key={metric.id}
              className="flex justify-between items-center gap-3 text-sm px-3 py-2 rounded-lg bg-paper border border-line/60"
            >
              <span className="text-muted">{formatSwedishDateTime(metric.timestamp)}</span>
              <div className="flex items-center gap-4">
                {metric.weight !== undefined && <span>{metric.weight} kg</span>}
                {metric.bodyFatPercentage !== undefined && (
                  <span>{metric.bodyFatPercentage}%</span>
                )}
                {(onEditMetric || onDeleteMetric) && (
                  <span className="flex gap-2.5 text-xs">
                    {onEditMetric && (
                      <button
                        onClick={() => startEdit(metric)}
                        className="text-muted underline cursor-pointer hover:text-ink"
                      >
                        edit
                      </button>
                    )}
                    {onDeleteMetric && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this weight log? This cannot be undone.'))
                            onDeleteMetric(metric.id);
                        }}
                        className="text-clay underline cursor-pointer hover:text-ink"
                      >
                        delete
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BodyMetrics;
