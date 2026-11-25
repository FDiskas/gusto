import { describe, expect, test } from 'bun:test';
import type { GoogleAccess } from '@/services/google-identity';
import { isSessionActive, parseGoogleSession } from '@/services/google-session';

const NOW = 1_000_000;
const MINUTE_MS = 60_000;
const session: GoogleAccess = { accessToken: 'token', expiresAt: NOW + 30 * MINUTE_MS, profile: { name: 'Ieva' } };

describe('isSessionActive', () => {
  test('is active while the token has plenty of time left', () => {
    expect(isSessionActive(session, NOW)).toBe(true);
  });

  test('is inactive inside the last minute before expiry', () => {
    expect(isSessionActive({ ...session, expiresAt: NOW + MINUTE_MS }, NOW)).toBe(false);
  });

  test('is inactive after expiry', () => {
    expect(isSessionActive({ ...session, expiresAt: NOW - 1 }, NOW)).toBe(false);
  });
});

describe('parseGoogleSession', () => {
  test('restores a stored session', () => {
    expect(parseGoogleSession(JSON.stringify(session))).toEqual(session);
  });

  test('returns null when nothing is stored', () => {
    expect(parseGoogleSession(null)).toBeNull();
  });

  test('returns null for corrupt JSON', () => {
    expect(parseGoogleSession('{not json')).toBeNull();
  });

  test('returns null when the token is missing', () => {
    expect(parseGoogleSession(JSON.stringify({ expiresAt: NOW, profile: {} }))).toBeNull();
  });

  test('returns null when the expiry is not a number', () => {
    expect(parseGoogleSession(JSON.stringify({ ...session, expiresAt: 'soon' }))).toBeNull();
  });
});
