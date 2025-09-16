import { useState } from 'react';
import type { CheckinEntry } from '../types';

interface CheckinFormProps {
  onSubmit: (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => void;
  onClose: () => void;
}

const CheckinForm: React.FC<CheckinFormProps> = ({ onSubmit, onClose }) => {
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
    onClose();
  };

  // Descriptive text for each metric level
  const metricDescriptions = {
    energy: {
      1: "Completely exhausted, can barely move",
      2: "Very tired, struggling with basic tasks",
      3: "Fatigued, low energy",
      4: "Below normal energy",
      5: "Moderate energy, functional",
      6: "Good energy for most activities",
      7: "Above average energy",
      8: "High energy, feeling strong",
      9: "Very energetic and motivated",
      10: "Peak energy, unstoppable"
    },
    hunger: {
      1: "No hunger at all",
      2: "Barely noticeable hunger",
      3: "Mild hunger, easy to ignore",
      4: "Light hunger, manageable",
      5: "Moderate hunger, aware but controlled",
      6: "Noticeable hunger, some cravings",
      7: "Strong hunger, thinking about food",
      8: "Very hungry, difficult to ignore",
      9: "Intense hunger, very challenging",
      10: "Extreme hunger, overwhelming"
    },
    mentalClarity: {
      1: "Complete brain fog, can't think",
      2: "Very foggy, difficult to focus",
      3: "Cloudy thinking, poor concentration",
      4: "Below normal clarity",
      5: "Average clarity, functional",
      6: "Good clarity, able to focus",
      7: "Clear thinking, productive",
      8: "Very clear, sharp focus",
      9: "Excellent clarity, highly focused",
      10: "Peak mental performance"
    },
    mood: {
      1: "Severely depressed/irritable",
      2: "Very low mood, struggling",
      3: "Low mood, negative",
      4: "Below average mood",
      5: "Neutral mood, stable",
      6: "Good mood, positive",
      7: "Happy and content",
      8: "Very positive, optimistic",
      9: "Excellent mood, joyful",
      10: "Euphoric, best possible mood"
    },
    physicalComfort: {
      1: "Severe discomfort/pain",
      2: "Very uncomfortable, multiple issues",
      3: "Uncomfortable, bothered",
      4: "Minor discomfort",
      5: "Neutral, no issues",
      6: "Comfortable, feeling okay",
      7: "Good physical state",
      8: "Very comfortable, feeling great",
      9: "Excellent physical comfort",
      10: "Perfect comfort, no issues at all"
    }
  };

  const RatingSlider = ({
    label,
    value,
    onChange,
    metricKey
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    metricKey: keyof typeof metricDescriptions;
  }) => (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}: <span className="font-bold text-indigo-600 text-lg">{value}/10</span>
      </label>

      {/* Description for current value */}
      <div className="mb-2 p-2 bg-indigo-50 rounded-md">
        <p className="text-xs text-indigo-700 font-medium">
          {metricDescriptions[metricKey][value as keyof typeof metricDescriptions[typeof metricKey]]}
        </p>
      </div>

      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />

      {/* Scale markers */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
        <span>6</span>
        <span>7</span>
        <span>8</span>
        <span>9</span>
        <span>10</span>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{metricKey === 'hunger' ? 'None' : 'Worst'}</span>
        <span className="text-center">Moderate</span>
        <span>{metricKey === 'hunger' ? 'Extreme' : 'Best'}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Check-in</h2>

        <form onSubmit={handleSubmit}>
          <RatingSlider
            label="Energy Level"
            value={formData.energy}
            onChange={(val) => setFormData({ ...formData, energy: val })}
            metricKey="energy"
          />

          <RatingSlider
            label="Hunger Level"
            value={formData.hunger}
            onChange={(val) => setFormData({ ...formData, hunger: val })}
            metricKey="hunger"
          />

          <RatingSlider
            label="Mental Clarity"
            value={formData.mentalClarity}
            onChange={(val) => setFormData({ ...formData, mentalClarity: val })}
            metricKey="mentalClarity"
          />

          <RatingSlider
            label="Mood"
            value={formData.mood}
            onChange={(val) => setFormData({ ...formData, mood: val })}
            metricKey="mood"
          />

          <RatingSlider
            label="Physical Comfort"
            value={formData.physicalComfort}
            onChange={(val) => setFormData({ ...formData, physicalComfort: val })}
            metricKey="physicalComfort"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep Quality (last night)
            </label>
            <select
              value={formData.sleepQuality || ''}
              onChange={(e) => setFormData({ ...formData, sleepQuality: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Not tracked</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <option key={val} value={val}>
                  {val} - {val <= 3 ? 'Poor' : val <= 6 ? 'Fair' : val <= 8 ? 'Good' : 'Excellent'}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Water Intake (glasses)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={formData.waterIntake || ''}
              onChange={(e) => setFormData({ ...formData, waterIntake: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Optional"
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.electrolytes}
                onChange={(e) => setFormData({ ...formData, electrolytes: e.target.checked })}
                className="mr-2 h-4 w-4 text-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Electrolytes taken</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
            >
              Save Check-in
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckinForm;