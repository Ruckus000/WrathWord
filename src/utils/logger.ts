/**
 * Development-only logger utility.
 * Wraps console methods to only output in __DEV__ mode.
 * This prevents debug logs from appearing in production builds.
 */

type LogArgs = Parameters<typeof console.log>;

export const logger = {
  /**
   * Log debug information (dev only)
   */
  log: (...args: LogArgs): void => {
    if (__DEV__) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (dev only)
   */
  warn: (...args: LogArgs): void => {
    if (__DEV__) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (kept in production for crash reporting)
   */
  error: (...args: LogArgs): void => {
    // Errors are always logged for debugging production issues
    console.error(...args);
  },
};

export default logger;
