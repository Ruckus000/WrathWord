/**
 * Timeout Utility
 *
 * Wraps promises with a timeout to prevent infinite loading states.
 */

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve within the specified time.
 *
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @param message - Optional custom error message
 * @returns The original promise result or throws on timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Request timeout',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
}

/**
 * Default timeout for service calls (10 seconds)
 */
export const DEFAULT_TIMEOUT = 10000;
