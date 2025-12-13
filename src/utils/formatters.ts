// src/utils/formatters.ts

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
