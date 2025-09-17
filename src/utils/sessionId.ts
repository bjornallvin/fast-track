// Generate human-readable session IDs like "fast-eagle-42"

const adjectives = [
  'fast', 'quick', 'steady', 'strong', 'focused', 'mindful', 'determined',
  'patient', 'calm', 'active', 'healthy', 'vibrant', 'energetic', 'peaceful',
  'balanced', 'clear', 'bright', 'fresh', 'happy', 'brave', 'mighty'
];

const nouns = [
  'eagle', 'tiger', 'lion', 'wolf', 'bear', 'hawk', 'falcon', 'dragon',
  'phoenix', 'warrior', 'champion', 'hero', 'tracker', 'journey', 'quest',
  'path', 'mission', 'goal', 'star', 'comet', 'rocket'
];

export function generateSessionId(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}-${noun}-${number}`;
}

export function isValidSessionId(id: string): boolean {
  // Check if ID matches our format: word-word-number
  const pattern = /^[a-z]+-[a-z]+-\d{1,3}$/;
  return pattern.test(id);
}