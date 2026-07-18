// Group links remembered in this browser (mirrors SessionLink for solo fasts)
export interface GroupLink {
  id: string; // group id
  groupName: string;
  role: 'organizer' | 'participant' | 'viewer';
  token?: string; // editToken (organizer) or reportToken (participant)
  participantId?: string;
  participantName?: string;
  lastAccessed: Date;
  startTime: Date;
  targetDuration: number;
  isActive: boolean;
}

const STORAGE_KEY = 'groupLinks';

export function loadGroupLinks(): GroupLink[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return (JSON.parse(stored) as GroupLink[]).map(link => ({
      ...link,
      lastAccessed: new Date(link.lastAccessed),
      startTime: new Date(link.startTime),
    }));
  } catch (e) {
    console.error('Error loading group links:', e);
    return [];
  }
}

export function saveGroupLink(link: GroupLink): void {
  const links = loadGroupLinks();
  const index = links.findIndex(l => l.id === link.id && l.role === link.role);
  if (index !== -1) {
    links[index] = { ...links[index], ...link, lastAccessed: new Date() };
  } else {
    links.push({ ...link, lastAccessed: new Date() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}
