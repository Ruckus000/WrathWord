// src/utils/formatters.ts

/**
 * Get current UTC date as ISO string (YYYY-MM-DD)
 * Consistent with existing date handling throughout the app
 */
export function getUTCDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the ordinal string for a number (1st, 2nd, 3rd, etc.)
 * @param n - The number to convert to ordinal
 * @returns The ordinal string (e.g., "1st", "2nd", "3rd", "4th")
 */
export const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Formats an ISO date string to a short display format (e.g., "Dec 13")
 * @param dateISO - ISO date string (YYYY-MM-DD)
 * @returns Short formatted date (e.g., "Dec 13")
 */
export function formatShortDate(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
