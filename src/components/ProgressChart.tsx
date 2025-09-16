import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CheckinEntry } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface ProgressChartProps {
  entries: CheckinEntry[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ entries }) => {
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Progress Trends</h2>
        <p className="text-gray-500 text-center py-8">No check-ins yet. Add your first check-in to see trends!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Progress Trends</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="energy" stroke="#10b981" name="Energy" strokeWidth={2} />
          <Line type="monotone" dataKey="hunger" stroke="#ef4444" name="Hunger" strokeWidth={2} />
          <Line type="monotone" dataKey="mentalClarity" stroke="#3b82f6" name="Mental Clarity" strokeWidth={2} />
          <Line type="monotone" dataKey="mood" stroke="#f59e0b" name="Mood" strokeWidth={2} />
          <Line type="monotone" dataKey="physicalComfort" stroke="#8b5cf6" name="Physical Comfort" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span>Energy</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span>Hunger</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span>Mental Clarity</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 rounded mr-1"></div>
          <span>Mood</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-500 rounded mr-1"></div>
          <span>Physical Comfort</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;