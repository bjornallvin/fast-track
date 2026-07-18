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
  email?: string; // Optional email for session recovery
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

// --- Group sessions (spec 001) ---
// One shared fast that several people join and report into. The start time,
// target, and end time live ONLY on the group — never on a participant.

export interface GroupSession {
  id: string;
  name: string;
  startTime: Date; // shared by all participants
  targetDuration: number; // shared, hours
  endTime?: Date | null; // shared — one end for the whole group
  createdAt: Date;
  editToken: string; // organizer edit access
  email?: string; // organizer email, for link recovery/sendout
  participants: GroupParticipant[];
}

export interface GroupParticipant {
  id: string;
  name: string; // display name (disambiguated if colliding)
  color?: string; // assigned chart color
  reportToken: string; // lets this person log their own data
  email?: string; // optional, for report-link sendout/recovery
  joinedAt: Date;
  entries: CheckinEntry[];
  bodyMetrics: BodyMetric[];
  notes?: JournalEntry[];
}

// What the API returns to clients: same shape but with all tokens AND
// emails stripped, plus the caller's resolved role (from the token presented).
export interface GroupSessionPublic {
  id: string;
  name: string;
  startTime: Date;
  targetDuration: number;
  endTime?: Date | null;
  createdAt: Date;
  participants: Omit<GroupParticipant, 'reportToken' | 'email'>[];
  role: 'organizer' | 'participant' | 'viewer';
  participantId?: string; // set when role === 'participant'
}