/** Part of an email address before the `@`, used as a display name when Google gives none */
export function nameFromEmail(email: string): string {
  return email.split('@')[0] || email;
}
