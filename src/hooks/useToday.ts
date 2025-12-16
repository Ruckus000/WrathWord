// src/hooks/useToday.ts
import {useState, useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {getUTCDateString} from '../utils/formatters';

/**
 * Hook that returns the current UTC date and updates when:
 * 1. App returns to foreground (primary mechanism)
 * 2. Midnight passes while app is open (backup mechanism)
 *
 * Note: Each component calling useToday() gets its own AppState listener
 * and timeout. With 2-3 components this is acceptable. If usage grows,
 * consider refactoring to a singleton or context.
 */
export function useToday(): string {
  const [today, setToday] = useState(getUTCDateString);

  // AppState listener - never needs re-subscription
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        setToday(prev => {
          const current = getUTCDateString();
          return current !== prev ? current : prev;
        });
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // Midnight timeout - backup for apps left open across midnight
  // (AppState foreground check is the primary mechanism)
  // Note: Very long timeouts may not fire reliably on mobile due to battery optimization,
  // but that's OK since AppState handles the common case of returning from background
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    const ms = tomorrow.getTime() - now.getTime() + 100;
    const timeout = setTimeout(() => setToday(getUTCDateString()), ms);
    return () => clearTimeout(timeout);
  }, [today]);

  return today;
}
