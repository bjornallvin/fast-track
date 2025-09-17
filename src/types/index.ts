export interface FastingSession {
  id: string;
  name: string; // Name to identify the session (e.g., person's name)
  startTime: Date;
  endTime?: Date | null;
  targetDuration: number; // hours
  isActive: boolean;
  entries: CheckinEntry[];
  bodyMetrics: BodyMetric[];
  notes: JournalEntry[];
  editToken?: string; // Random token required for edit access
}

export interface CheckinEntry {
  id: string;
  timestamp: Date;
  energy: number; // 1-10
  hunger: number; // 1-10
  mentalClarity: number; // 1-10
  mood: number; // 1-10
  physicalComfort: number; // 1-10
  sleepQuality?: number; // 1-10, optional
  waterIntake?: number;
  electrolytes?: boolean;
}

export interface BodyMetric {
  id: string;
  timestamp: Date;
  weight?: number;
  bodyFatPercentage?: number;
}

export interface JournalEntry {
  id: string;
  timestamp: Date;
  content: string;
  tags: string[];
}