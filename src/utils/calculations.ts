export const calculateElapsedTime = (startTime: Date | null | undefined, targetDuration: number = 72): { hours: number; minutes: number; totalHours: number; percentage: number } => {
  if (!startTime) {
    return { hours: 0, minutes: 0, totalHours: 0, percentage: 0 };
  }

  const now = new Date();
  const start = new Date(startTime); // Ensure it's a Date object
  const diff = now.getTime() - start.getTime();
  const totalHours = diff / (1000 * 60 * 60);
  const hours = Math.floor(totalHours);
  const minutes = Math.floor((totalHours - hours) * 60);
  const percentage = Math.min((totalHours / targetDuration) * 100, 100);

  return { hours, minutes, totalHours, percentage };
};

export const formatElapsedTime = (hours: number, minutes: number): string => {
  return `${hours}h ${minutes}m`;
};

export const getMilestoneStatus = (totalHours: number): {
  milestone24: boolean;
  milestone48: boolean;
  milestone72: boolean;
} => {
  return {
    milestone24: totalHours >= 24,
    milestone48: totalHours >= 48,
    milestone72: totalHours >= 72,
  };
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};