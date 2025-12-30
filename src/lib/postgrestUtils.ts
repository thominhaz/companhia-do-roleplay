/**
 * Utility functions for safely building PostgREST queries.
 * Prevents SQL injection by escaping special characters in user input.
 */

/**
 * Escapes special characters in a string for use in PostgREST ILIKE patterns.
 * Special characters in ILIKE: % (wildcard), _ (single char), \ (escape)
 * 
 * @param value - The user-provided string to escape
 * @returns The escaped string safe for use in ILIKE patterns
 */
export function escapePostgrestLikePattern(value: string): string {
  if (!value || typeof value !== 'string') return '';
  // Escape backslashes first, then % and _
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Validates that a string is a valid UUID v4 format.
 * This prevents injection attacks when using UUIDs in queries.
 * 
 * @param value - The string to validate
 * @returns True if the string is a valid UUID v4, false otherwise
 */
export function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
}

/**
 * Builds a safe ILIKE filter for PostgREST queries.
 * 
 * @param value - The user-provided value to search for
 * @returns A properly escaped pattern with wildcards
 */
export function buildSafeLikePattern(value: string): string {
  return `%${escapePostgrestLikePattern(value)}%`;
}
