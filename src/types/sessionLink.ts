export interface SessionLink {
  id: string;
  name: string;
  type: 'editable' | 'readonly';
  editToken?: string; // Only for editable sessions
  lastAccessed: Date;
  startTime: Date;
  targetDuration: number;
  isActive: boolean;
}