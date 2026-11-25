import type { GoogleAccess } from '@/services/google-identity';

const SESSION_STORAGE_KEY = 'gusto_google_session_v1';
const EXPIRY_MARGIN_MS = 60_000;

/** True while the access token still has a safe margin before it expires */
export function isSessionActive(session: GoogleAccess, now = Date.now()): boolean {
  return session.expiresAt - EXPIRY_MARGIN_MS > now;
}

export function parseGoogleSession(raw: string | null): GoogleAccess | null {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    const isValid =
      typeof session?.accessToken === 'string' && typeof session?.expiresAt === 'number' && session.profile;
    return isValid ? session : null;
  } catch {
    return null;
  }
}

export function loadGoogleSession(): GoogleAccess | null {
  try {
    return parseGoogleSession(localStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveGoogleSession(session: GoogleAccess): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the user signs in again after a reload
  }
}

export function clearGoogleSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing was stored
  }
}
