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
import type { GroupSessionPublic } from '@/types';

type MetricKey =
  | 'energy'
  | 'hunger'
  | 'mentalClarity'
  | 'mood'
  | 'physicalComfort'
  | 'weight'
  | 'bodyFatPercentage';

const METRICS: { key: MetricKey; label: string; title: string; body?: boolean }[] = [
  { key: 'hunger', label: 'Hunger', title: 'Hunger — across the fast' },
  { key: 'energy', label: 'Energy', title: 'Energy — across the fast' },
  { key: 'mentalClarity', label: 'Clarity', title: 'Mental clarity — across the fast' },
  { key: 'mood', label: 'Mood', title: 'Mood — across the fast' },
  { key: 'physicalComfort', label: 'Comfort', title: 'Physical comfort — across the fast' },
  { key: 'weight', label: 'Weight', title: 'Weight — across the fast', body: true },
  { key: 'bodyFatPercentage', label: 'Body fat', title: 'Body fat % — across the fast', body: true },
];

interface GroupComparisonChartProps {
  group: GroupSessionPublic;
  // When set, clicking a point on THIS participant's line opens an edit/delete menu.
  editableParticipantId?: string;
  onEditPoint?: (kind: 'checkin' | 'body', id: string) => void;
  onDeletePoint?: (kind: 'checkin' | 'body', id: string) => void;
}

// One shared timeline: everyone's points plot by hours-into-fast against the
// group's single start time. One line per participant for the chosen metric.
const GroupComparisonChart: React.FC<GroupComparisonChartProps> = ({
  group,
  editableParticipantId,
  onEditPoint,
  onDeletePoint,
}) => {
  const [metric, setMetric] = useState<MetricKey>('hunger');
  const [menu, setMenu] = useState<{ x: number; y: number; id: string; kind: 'checkin' | 'body' } | null>(
    null
  );
  const def = METRICS.find(m => m.key === metric)!;
  const start = group.startTime.getTime();
  const kind: 'checkin' | 'body' = def.body ? 'body' : 'checkin';

  const series = useMemo(() => {
    return group.participants.map(p => {
      const source = def.body ? p.bodyMetrics : p.entries;
      const points = source
        .map(item => {
          const value = (item as unknown as Record<string, unknown>)[def.key];
          if (value === undefined || value === null) return null;
          return {
            hour:
              Math.round(((new Date(item.timestamp).getTime() - start) / 3600000) * 10) / 10,
            value: value as number,
            id: (item as { id: string }).id,
          };
        })
        .filter((pt): pt is { hour: number; value: number; id: string } => pt !== null && pt.hour >= 0)
        .sort((a, b) => a.hour - b.hour);
      return { participant: p, points };
    });
  }, [group.participants, def.key, def.body, start]);

  const maxHour = useMemo(() => {
    const end = group.endTime
      ? group.endTime.getTime()
      : Math.max(Date.now(), start);
    return Math.max((end - start) / 3600000, 1);
  }, [group.endTime, start]);

  const hasAnyData = series.some(s => s.points.length > 0);

  // Clickable dot for the editable participant's line — opens the edit/delete
  // menu. Rendered for both `dot` and `activeDot` (the active dot sits on top,
  // so it must carry the handler too), with a large transparent hit target.
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
          setMenu({ x: e.clientX, y: e.clientY, id, kind });
        }}
      >
        <circle cx={cx} cy={cy} r={16} fill="transparent" />
        <circle cx={cx} cy={cy} r={5} fill={fill} stroke="var(--paper)" strokeWidth={1.5} />
      </g>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="inline-flex border border-line rounded-xl overflow-hidden text-sm flex-wrap">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-3.5 py-2 cursor-pointer ${
                metric === m.key
                  ? 'bg-clay text-white font-semibold'
                  : 'bg-card text-muted hover:text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-line rounded-2xl px-5 py-5">
        <h3 className="font-serif font-medium text-lg mb-1">{def.title}</h3>
        {!hasAnyData ? (
          <p className="font-serif italic text-muted text-center py-10">
            no {def.label.toLowerCase()} reported yet — check-ins will appear here
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis
                type="number"
                dataKey="hour"
                domain={[0, Math.ceil(maxHour)]}
                tickFormatter={(h: number) => `${h}h`}
                stroke="var(--muted)"
                fontSize={11}
              />
              <YAxis
                domain={def.body ? ['auto', 'auto'] : [0, 10]}
                stroke="var(--muted)"
                fontSize={11}
                width={40}
              />
              <Tooltip
                labelFormatter={(h) => `${h}h into the fast`}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: 13,
                }}
              />
              {series
                .filter(s => s.points.length > 0)
                .map(s => {
                  const editable = !!onEditPoint && s.participant.id === editableParticipantId;
                  const color = s.participant.color ?? 'var(--ink)';
                  return (
                    <Line
                      key={s.participant.id}
                      data={s.points}
                      dataKey="value"
                      name={s.participant.name}
                      stroke={color}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      dot={
                        editable
                          ? <EditableDot fill={color} />
                          : { r: 3, strokeWidth: 0, fill: color }
                      }
                      activeDot={editable ? <EditableDot fill={color} /> : { r: 4 }}
                      type="monotone"
                      isAnimationActive={false}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted">
          {group.participants.map(p => (
            <span key={p.id} className="inline-flex items-center gap-1.5">
              <i
                className="inline-block w-4 h-[3px] rounded"
                style={{ background: p.color ?? 'var(--ink)' }}
              />
              {p.name}
              {series.find(s => s.participant.id === p.id)?.points.length === 0 && (
                <span className="font-serif italic">— no data yet</span>
              )}
            </span>
          ))}
        </div>
        {onEditPoint && hasAnyData && (
          <p className="text-xs text-muted font-serif italic mt-2">
            tip: tap one of your points to edit or delete it
          </p>
        )}
      </div>

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-paper border border-line rounded-xl shadow-lg overflow-hidden text-sm min-w-[120px]"
            style={{ top: menu.y + 6, left: menu.x + 6 }}
          >
            <button
              onClick={() => {
                onEditPoint?.(menu.kind, menu.id);
                setMenu(null);
              }}
              className="block w-full text-left px-4 py-2.5 hover:bg-card cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDeletePoint?.(menu.kind, menu.id);
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

export default GroupComparisonChart;
