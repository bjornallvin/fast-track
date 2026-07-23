'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CheckinEntry } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface ProgressChartProps {
  entries: CheckinEntry[];
  startTime?: Date; // when given, plot by hours into the fast
  // When set, clicking a point opens an edit/delete menu for that check-in.
  onEditPoint?: (id: string) => void;
  onDeletePoint?: (id: string) => void;
}

const METRICS = [
  { key: 'energy', label: 'Energy', color: '#7c8a6b' },
  { key: 'hunger', label: 'Hunger', color: '#b5643f' },
  { key: 'mentalClarity', label: 'Clarity', color: '#c9954a' },
  { key: 'mood', label: 'Mood', color: '#8a5a6b' },
  { key: 'physicalComfort', label: 'Comfort', color: '#4a6b8a' },
] as const;

const ProgressChart: React.FC<ProgressChartProps> = ({
  entries,
  startTime,
  onEditPoint,
  onDeletePoint,
}) => {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);

  const data = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return sorted.map(entry => ({
      id: entry.id,
      time: startTime
        ? Math.round(
            ((new Date(entry.timestamp).getTime() - startTime.getTime()) / 3600000) * 10
          ) / 10
        : formatSwedishDateTime(new Date(entry.timestamp)),
      energy: entry.energy,
      hunger: entry.hunger,
      mentalClarity: entry.mentalClarity,
      mood: entry.mood,
      physicalComfort: entry.physicalComfort,
    }));
  }, [entries, startTime]);

  const EditableDot = (props: {
    cx?: number;
    cy?: number;
    fill?: string;
    payload?: { id: string };
  }) => {
    const { cx, cy, fill, payload } = props;
    if (cx == null || cy == null || !payload) return <g />;
    const id = payload.id;
    return (
      <g
        style={{ cursor: 'pointer' }}
        onClick={e => {
          e.stopPropagation();
          setMenu({ x: e.clientX, y: e.clientY, id });
        }}
      >
        <circle cx={cx} cy={cy} r={16} fill="transparent" />
        <circle cx={cx} cy={cy} r={5} fill={fill} stroke="var(--paper)" strokeWidth={1.5} />
      </g>
    );
  };

  return (
    <div className="bg-card border border-line rounded-2xl px-5 py-5">
      <div className="flex justify-between items-baseline mb-1 flex-wrap gap-2">
        <h3 className="font-serif font-medium text-lg">Wellbeing over time</h3>
        <div className="flex gap-3.5 text-xs text-muted flex-wrap">
          {METRICS.map(m => (
            <span
              key={m.key}
              className="inline-flex items-center gap-1.5 cursor-pointer"
              onMouseEnter={() => setHoveredMetric(m.key)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <i className="inline-block w-4 h-[3px] rounded" style={{ background: m.color }} />
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="font-serif italic text-muted text-center py-10">
          no check-ins yet — your first one starts the curve
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            {startTime ? (
              <XAxis
                type="number"
                dataKey="time"
                domain={[0, 'dataMax']}
                tickFormatter={(h: number) => `${h}h`}
                stroke="var(--muted)"
                fontSize={11}
              />
            ) : (
              <XAxis dataKey="time" stroke="var(--muted)" fontSize={11} />
            )}
            <YAxis domain={[0, 10]} stroke="var(--muted)" fontSize={11} width={40} />
            <Tooltip
              labelFormatter={label =>
                startTime ? `${label}h into the fast` : String(label)
              }
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: 13,
              }}
            />
            {METRICS.map(m => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                name={m.label}
                strokeWidth={hoveredMetric === m.key ? 4 : 3}
                opacity={hoveredMetric && hoveredMetric !== m.key ? 0.25 : 1}
                dot={onEditPoint ? <EditableDot fill={m.color} /> : { r: 3, strokeWidth: 0, fill: m.color }}
                activeDot={onEditPoint ? <EditableDot fill={m.color} /> : { r: 4 }}
                strokeLinejoin="round"
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      {onEditPoint && entries.length > 0 && (
        <p className="text-xs text-muted font-serif italic mt-2">
          tip: tap a point to edit or delete that check-in
        </p>
      )}

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-paper border border-line rounded-xl shadow-lg overflow-hidden text-sm min-w-[120px]"
            style={{ top: menu.y + 6, left: menu.x + 6 }}
          >
            <button
              onClick={() => {
                onEditPoint?.(menu.id);
                setMenu(null);
              }}
              className="block w-full text-left px-4 py-2.5 hover:bg-card cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDeletePoint?.(menu.id);
                setMenu(null);
              }}
              className="block w-full text-left px-4 py-2.5 text-clay hover:bg-card cursor-pointer border-t border-line"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressChart;
