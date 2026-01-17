export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Format a date as a short, human-readable string.
 * Example: "Mon, Jan 15"
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date as a full, human-readable string.
 * Example: "Monday, January 15, 2025"
 */
export function formatDateFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a time in 12-hour format.
 * Example: "10:30 AM"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
