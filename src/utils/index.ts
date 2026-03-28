/**
 * Formats a byte count into a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extracts a user-friendly message from an unknown error value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * Strips characters that could be used for XSS from a plain-text string.
 * Use this before storing user-supplied text in Firestore.
 */
export function sanitizeText(value: string): string {
  return value.replace(/[<>"'`]/g, '');
}
