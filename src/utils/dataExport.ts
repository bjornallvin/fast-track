import type { FastingSession } from '../types';

/**
 * Export fasting session data to JSON file
 */
export const exportSessionData = (session: FastingSession) => {
  // Create a clean copy of the session with proper date serialization
  const exportData = {
    ...session,
    name: session.name || 'Unnamed Session',
    startTime: session.startTime.toISOString(),
    endTime: session.endTime ? session.endTime.toISOString() : null,
    entries: session.entries.map(entry => ({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    })),
    bodyMetrics: session.bodyMetrics.map(metric => ({
      ...metric,
      timestamp: metric.timestamp.toISOString()
    })),
    notes: session.notes.map(note => ({
      ...note,
      timestamp: note.timestamp.toISOString()
    })),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(exportData, null, 2);

  // Create blob and download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create download link and trigger download
  const link = document.createElement('a');
  const fileName = `fasting-session-${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return fileName;
};

/**
 * Import fasting session data from JSON file
 */
export const importSessionData = async (file: File): Promise<FastingSession> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the data structure
        if (!data.id || !data.startTime || !data.targetDuration) {
          throw new Error('Invalid session data format');
        }

        // Convert ISO strings back to Date objects
        const session: FastingSession = {
          ...data,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : null,
          entries: (data.entries || []).map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          })),
          bodyMetrics: (data.bodyMetrics || []).map((metric: any) => ({
            ...metric,
            timestamp: new Date(metric.timestamp)
          })),
          notes: (data.notes || []).map((note: any) => ({
            ...note,
            timestamp: new Date(note.timestamp)
          }))
        };

        resolve(session);
      } catch (error) {
        reject(new Error(`Failed to parse import file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Export session data as CSV for spreadsheet analysis
 */
export const exportSessionDataAsCSV = (session: FastingSession) => {
  // Create CSV for check-in entries
  const checkinHeaders = ['Timestamp', 'Energy', 'Hunger', 'Mental Clarity', 'Mood', 'Physical Comfort', 'Sleep Quality', 'Water Intake', 'Electrolytes'];
  const checkinRows = session.entries.map(entry => [
    entry.timestamp.toISOString(),
    entry.energy,
    entry.hunger,
    entry.mentalClarity,
    entry.mood,
    entry.physicalComfort,
    entry.sleepQuality || '',
    entry.waterIntake || '',
    entry.electrolytes ? 'Yes' : 'No'
  ]);

  // Create CSV for body metrics
  const metricsHeaders = ['Timestamp', 'Weight (kg)', 'Body Fat (%)'];
  const metricsRows = session.bodyMetrics.map(metric => [
    metric.timestamp.toISOString(),
    metric.weight || '',
    metric.bodyFatPercentage || ''
  ]);

  // Create CSV for journal entries
  const journalHeaders = ['Timestamp', 'Content', 'Tags'];
  const journalRows = session.notes.map(note => [
    note.timestamp.toISOString(),
    `"${note.content.replace(/"/g, '""')}"`, // Escape quotes in content
    note.tags.join('; ')
  ]);

  // Combine all CSVs with section headers
  const fullCSV = [
    '=== CHECK-IN DATA ===',
    checkinHeaders.join(','),
    ...checkinRows.map(row => row.join(',')),
    '',
    '=== BODY METRICS ===',
    metricsHeaders.join(','),
    ...metricsRows.map(row => row.join(',')),
    '',
    '=== JOURNAL ENTRIES ===',
    journalHeaders.join(','),
    ...journalRows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([fullCSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = `fasting-session-${new Date().toISOString().split('T')[0]}.csv`;
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return fileName;
};