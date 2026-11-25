import { describe, expect, test } from 'bun:test';
import { nameFromEmail } from '@/lib/email';

describe('nameFromEmail', () => {
  test('returns the part before the @', () => {
    expect(nameFromEmail('ieva@example.com')).toBe('ieva');
  });

  test('returns the whole text when there is no @', () => {
    expect(nameFromEmail('ieva')).toBe('ieva');
  });

  test('returns the whole text when nothing stands before the @', () => {
    expect(nameFromEmail('@example.com')).toBe('@example.com');
  });
});
