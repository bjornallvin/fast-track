import { useState } from 'react';
import type { BodyMetric } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface BodyMetricsProps {
  metrics: BodyMetric[];
  onAddMetric: (metric: Omit<BodyMetric, 'id' | 'timestamp'>) => void;
}

const BodyMetrics: React.FC<BodyMetricsProps> = ({ metrics, onAddMetric }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metric: Omit<BodyMetric, 'id' | 'timestamp'> = {};

    if (weight) metric.weight = Number(weight);
    if (bodyFat) metric.bodyFatPercentage = Number(bodyFat);

    if (metric.weight || metric.bodyFatPercentage) {
      onAddMetric(metric);
      setWeight('');
      setBodyFat('');
      setIsAdding(false);
    }
  };


  const getLatestMetrics = () => {
    if (metrics.length === 0) return null;
    const sorted = [...metrics].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return sorted[0];
  };

  const getMetricChange = (current?: number, previous?: number) => {
    if (!current || !previous) return null;
    const change = current - previous;
    return {
      value: Math.abs(change),
      isDecrease: change < 0,
    };
  };

  const latest = getLatestMetrics();
  const previous = metrics.length > 1 ? [...metrics].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[1] : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Body Metrics</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          Add Metrics
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Optional"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body Fat %</label>
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="Optional"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setWeight('');
                setBodyFat('');
              }}
              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {latest ? (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Weight</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {latest.weight ? `${latest.weight} kg` : 'Not recorded'}
              </p>
              {previous && latest.weight && previous.weight && (
                <p className={`text-sm mt-1 ${getMetricChange(latest.weight, previous.weight)?.isDecrease ? 'text-green-600' : 'text-red-600'}`}>
                  {getMetricChange(latest.weight, previous.weight)?.isDecrease ? '↓' : '↑'} {getMetricChange(latest.weight, previous.weight)?.value.toFixed(1)} kg
                </p>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Body Fat</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {latest.bodyFatPercentage ? `${latest.bodyFatPercentage}%` : 'Not recorded'}
              </p>
              {previous && latest.bodyFatPercentage && previous.bodyFatPercentage && (
                <p className={`text-sm mt-1 ${getMetricChange(latest.bodyFatPercentage, previous.bodyFatPercentage)?.isDecrease ? 'text-green-600' : 'text-red-600'}`}>
                  {getMetricChange(latest.bodyFatPercentage, previous.bodyFatPercentage)?.isDecrease ? '↓' : '↑'} {getMetricChange(latest.bodyFatPercentage, previous.bodyFatPercentage)?.value.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {formatSwedishDateTime(latest.timestamp)}</p>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No measurements recorded yet</p>
      )}

      {metrics.length > 1 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">History</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...metrics].sort((a, b) =>
              b.timestamp.getTime() - a.timestamp.getTime()
            ).map((metric) => (
              <div key={metric.id} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-gray-600 dark:text-gray-400">{formatSwedishDateTime(metric.timestamp)}</span>
                <div className="flex gap-4">
                  {metric.weight && <span className="dark:text-gray-300">Weight: {metric.weight} kg</span>}
                  {metric.bodyFatPercentage && <span className="dark:text-gray-300">Body Fat: {metric.bodyFatPercentage}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyMetrics;