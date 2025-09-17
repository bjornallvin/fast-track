import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CheckinEntry } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface ProgressChartProps {
  entries: CheckinEntry[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ entries }) => {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const formatData = () => {
    return entries.map((entry) => ({
      time: formatSwedishDateTime(entry.timestamp),
      energy: entry.energy,
      hunger: entry.hunger,
      mentalClarity: entry.mentalClarity,
      mood: entry.mood,
      physicalComfort: entry.physicalComfort,
    }));
  };

  const data = formatData();

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Progress Trends</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No check-ins yet. Add your first check-in to see trends!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Progress Trends</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#10b981"
            name="Energy"
            strokeWidth={hoveredMetric === 'energy' ? 3 : hoveredMetric && hoveredMetric !== 'energy' ? 1 : 2}
            opacity={hoveredMetric && hoveredMetric !== 'energy' ? 0.2 : 1}
          />
          <Line
            type="monotone"
            dataKey="hunger"
            stroke="#ef4444"
            name="Hunger"
            strokeWidth={hoveredMetric === 'hunger' ? 3 : hoveredMetric && hoveredMetric !== 'hunger' ? 1 : 2}
            opacity={hoveredMetric && hoveredMetric !== 'hunger' ? 0.2 : 1}
          />
          <Line
            type="monotone"
            dataKey="mentalClarity"
            stroke="#3b82f6"
            name="Mental Clarity"
            strokeWidth={hoveredMetric === 'mentalClarity' ? 3 : hoveredMetric && hoveredMetric !== 'mentalClarity' ? 1 : 2}
            opacity={hoveredMetric && hoveredMetric !== 'mentalClarity' ? 0.2 : 1}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#f59e0b"
            name="Mood"
            strokeWidth={hoveredMetric === 'mood' ? 3 : hoveredMetric && hoveredMetric !== 'mood' ? 1 : 2}
            opacity={hoveredMetric && hoveredMetric !== 'mood' ? 0.2 : 1}
          />
          <Line
            type="monotone"
            dataKey="physicalComfort"
            stroke="#8b5cf6"
            name="Physical Comfort"
            strokeWidth={hoveredMetric === 'physicalComfort' ? 3 : hoveredMetric && hoveredMetric !== 'physicalComfort' ? 1 : 2}
            opacity={hoveredMetric && hoveredMetric !== 'physicalComfort' ? 0.2 : 1}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Custom Legend with Tooltips */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div
          className="flex items-center group relative cursor-help"
          onMouseEnter={() => setHoveredMetric('energy')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="dark:text-gray-300">Energy</span>
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Energy Level</div>
            <div>1-3: Very tired</div>
            <div>4-6: Moderate</div>
            <div>7-10: High energy</div>
            <div className="absolute top-full left-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div
          className="flex items-center group relative cursor-help"
          onMouseEnter={() => setHoveredMetric('hunger')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="dark:text-gray-300">Hunger</span>
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Hunger Level</div>
            <div>1-3: Minimal</div>
            <div>4-6: Moderate</div>
            <div>7-10: Strong hunger</div>
            <div className="absolute top-full left-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div
          className="flex items-center group relative cursor-help"
          onMouseEnter={() => setHoveredMetric('mentalClarity')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="dark:text-gray-300">Mental Clarity</span>
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Mental Clarity</div>
            <div>1-3: Brain fog</div>
            <div>4-6: Average</div>
            <div>7-10: Sharp focus</div>
            <div className="absolute top-full left-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div
          className="flex items-center group relative cursor-help"
          onMouseEnter={() => setHoveredMetric('mood')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="w-3 h-3 bg-amber-500 rounded mr-2"></div>
          <span className="dark:text-gray-300">Mood</span>
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Mood</div>
            <div>1-3: Low mood</div>
            <div>4-6: Neutral</div>
            <div>7-10: Positive</div>
            <div className="absolute top-full left-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div
          className="flex items-center group relative cursor-help"
          onMouseEnter={() => setHoveredMetric('physicalComfort')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="w-3 h-3 bg-violet-500 rounded mr-2"></div>
          <span className="dark:text-gray-300">Physical Comfort</span>
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Physical Comfort</div>
            <div>1-3: Discomfort</div>
            <div>4-6: Some issues</div>
            <div>7-10: Comfortable</div>
            <div className="absolute top-full left-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;