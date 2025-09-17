// Generate a secure random token for edit access
export function generateEditToken(): string {
  // Generate a random 4-digit number (easier to remember but still provides some security)
  // This will be part of the edit URL path
  const min = 1000; // 4 digits minimum
  const max = 9999; // 4 digits maximum
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

// Validate that an editToken matches the session's stored token
export function validateEditToken(sessionEditToken: string | undefined, providedToken: string | null): boolean {
  if (!sessionEditToken || !providedToken) {
    return false;
  }

  return sessionEditToken === providedToken;
}