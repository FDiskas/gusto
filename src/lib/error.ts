/** Readable text of anything that was thrown, for showing the real cause to the user */
export function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return '';
}
