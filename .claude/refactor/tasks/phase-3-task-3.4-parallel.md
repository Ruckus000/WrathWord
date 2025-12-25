# Task 3.4: SessionManager Refactor (PARALLEL)

## Agent Assignment
This task can run in parallel with Tasks 3.1, 3.2, and 3.3.

## Objective
Extract session management logic from `client.ts` into a clean `SessionManager` class following the repository pattern.

## Files to Create
- `src/infrastructure/auth/SessionManager.ts`
- `__tests__/infrastructure/auth/SessionManager.test.ts`

## Context
The existing `src/services/supabase/client.ts` has session management logic scattered throughout:
- `getCachedSession()` / `setCachedSession()`
- `getValidAccessToken()` with mutex
- `isTokenExpiringSoon()` JWT parsing

We need to extract this into a clean `SessionManager` that can be:
1. Mocked for testing
2. Used by infrastructure repositories
3. Potentially swapped for different auth providers

## Implementation

```typescript
// src/infrastructure/auth/SessionManager.ts

import { logger } from '../../utils/logger';

/**
 * Cached session data for synchronous access
 */
export interface CachedSession {
  userId: string;
  accessToken: string;
}

/**
 * Session state listener callback
 */
export type SessionListener = (session: CachedSession | null) => void;

/**
 * SessionManager handles authentication session caching and token refresh.
 * Provides synchronous access to session data and async token validation.
 */
export class SessionManager {
  private cachedSession: CachedSession | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private listeners: Set<SessionListener> = new Set();
  private refreshTokenFn: (() => Promise<{ accessToken: string; userId: string } | null>) | null = null;

  /**
   * Set the token refresh function.
   * This decouples SessionManager from Supabase specifics.
   */
  setRefreshFunction(fn: () => Promise<{ accessToken: string; userId: string } | null>): void {
    this.refreshTokenFn = fn;
  }

  /**
   * Get the current cached session synchronously.
   * Returns null if no session is cached.
   */
  getSession(): CachedSession | null {
    return this.cachedSession;
  }

  /**
   * Get the current user ID synchronously.
   * Returns null if no session is cached.
   */
  getUserId(): string | null {
    return this.cachedSession?.userId ?? null;
  }

  /**
   * Update the cached session.
   * Call this when auth state changes (sign in, sign out, token refresh).
   */
  setSession(session: { userId: string; accessToken: string } | null): void {
    if (session) {
      this.cachedSession = {
        userId: session.userId,
        accessToken: session.accessToken,
      };
      logger.log('[SessionManager] Session cached for user:', session.userId);
    } else {
      this.cachedSession = null;
      logger.log('[SessionManager] Session cleared');
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(this.cachedSession));
  }

  /**
   * Check if there's an active session.
   */
  hasSession(): boolean {
    return this.cachedSession !== null;
  }

  /**
   * Get a valid access token, refreshing if necessary.
   * Uses mutex to prevent concurrent refresh attempts.
   */
  async getValidToken(): Promise<string | null> {
    const cached = this.cachedSession;

    // No cached session
    if (!cached?.accessToken) {
      logger.log('[SessionManager] No cached session for token validation');
      return null;
    }

    // Token is still valid
    if (!this.isTokenExpiringSoon(cached.accessToken)) {
      return cached.accessToken;
    }

    // Token expiring soon - need to refresh
    // If refresh already in progress, wait for it (mutex)
    if (this.refreshPromise) {
      logger.log('[SessionManager] Token refresh in progress, waiting...');
      return this.refreshPromise;
    }

    // No refresh function configured
    if (!this.refreshTokenFn) {
      logger.warn('[SessionManager] No refresh function configured');
      return null;
    }

    // Start refresh with mutex
    this.refreshPromise = this.performRefresh();
    return this.refreshPromise;
  }

  /**
   * Perform the actual token refresh.
   */
  private async performRefresh(): Promise<string | null> {
    try {
      logger.log('[SessionManager] Token expiring soon, refreshing...');

      const result = await this.refreshTokenFn!();
      
      if (!result) {
        logger.error('[SessionManager] Token refresh returned null');
        return null;
      }

      // Update cache with new token
      this.setSession({
        userId: result.userId,
        accessToken: result.accessToken,
      });

      logger.log('[SessionManager] Token refreshed successfully');
      return result.accessToken;
    } catch (err) {
      logger.error('[SessionManager] Token refresh exception:', err);
      return null;
    } finally {
      this.refreshPromise = null; // Release mutex
    }
  }

  /**
   * Check if a JWT token is expiring soon.
   * @param token JWT token string
   * @param thresholdMs Time threshold in milliseconds (default 5 minutes)
   */
  isTokenExpiringSoon(token: string, thresholdMs = 5 * 60 * 1000): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // Invalid JWT format
      }

      // Decode base64 payload (handle URL-safe base64)
      const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64Payload));

      if (typeof payload.exp !== 'number') {
        return true; // No expiry claim
      }

      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      return expiresAt - now < thresholdMs;
    } catch {
      return true; // If we can't parse, assume expired
    }
  }

  /**
   * Add a listener for session changes.
   */
  addListener(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all state (for testing or logout).
   */
  clear(): void {
    this.cachedSession = null;
    this.refreshPromise = null;
    this.listeners.forEach(listener => listener(null));
  }
}

// Singleton instance
let _instance: SessionManager | null = null;

/**
 * Get the SessionManager singleton.
 */
export function getSessionManager(): SessionManager {
  if (!_instance) {
    _instance = new SessionManager();
  }
  return _instance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetSessionManager(): void {
  _instance?.clear();
  _instance = null;
}
```

## Test File

```typescript
// __tests__/infrastructure/auth/SessionManager.test.ts

import { SessionManager, getSessionManager, resetSessionManager, CachedSession } from '../../../src/infrastructure/auth/SessionManager';

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    resetSessionManager();
    manager = new SessionManager();
  });

  describe('session management', () => {
    it('starts with no session', () => {
      expect(manager.getSession()).toBeNull();
      expect(manager.hasSession()).toBe(false);
      expect(manager.getUserId()).toBeNull();
    });

    it('caches session when set', () => {
      manager.setSession({ userId: 'user-123', accessToken: 'token-abc' });

      expect(manager.hasSession()).toBe(true);
      expect(manager.getUserId()).toBe('user-123');
      expect(manager.getSession()).toEqual({
        userId: 'user-123',
        accessToken: 'token-abc',
      });
    });

    it('clears session when set to null', () => {
      manager.setSession({ userId: 'user-123', accessToken: 'token-abc' });
      manager.setSession(null);

      expect(manager.hasSession()).toBe(false);
      expect(manager.getSession()).toBeNull();
    });
  });

  describe('session listeners', () => {
    it('notifies listeners on session change', () => {
      const listener = jest.fn();
      manager.addListener(listener);

      manager.setSession({ userId: 'user-123', accessToken: 'token-abc' });

      expect(listener).toHaveBeenCalledWith({
        userId: 'user-123',
        accessToken: 'token-abc',
      });
    });

    it('notifies listeners on session clear', () => {
      const listener = jest.fn();
      manager.setSession({ userId: 'user-123', accessToken: 'token-abc' });
      manager.addListener(listener);

      manager.setSession(null);

      expect(listener).toHaveBeenCalledWith(null);
    });

    it('unsubscribes listener correctly', () => {
      const listener = jest.fn();
      const unsubscribe = manager.addListener(listener);

      unsubscribe();
      manager.setSession({ userId: 'user-123', accessToken: 'token-abc' });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('token expiry check', () => {
    // Create a valid JWT with specific expiry
    function createTestJwt(expiresInSeconds: number): string {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        sub: 'user-123',
      }));
      const signature = 'test-signature';
      return `${header}.${payload}.${signature}`;
    }

    it('returns false for token expiring far in future', () => {
      const token = createTestJwt(3600); // 1 hour
      expect(manager.isTokenExpiringSoon(token)).toBe(false);
    });

    it('returns true for token expiring within threshold', () => {
      const token = createTestJwt(60); // 1 minute (less than 5 min threshold)
      expect(manager.isTokenExpiringSoon(token)).toBe(true);
    });

    it('returns true for already expired token', () => {
      const token = createTestJwt(-60); // Expired 1 minute ago
      expect(manager.isTokenExpiringSoon(token)).toBe(true);
    });

    it('returns true for invalid JWT format', () => {
      expect(manager.isTokenExpiringSoon('not-a-jwt')).toBe(true);
      expect(manager.isTokenExpiringSoon('only.two.parts')).toBe(true);
    });

    it('respects custom threshold', () => {
      const token = createTestJwt(120); // 2 minutes
      
      // With 1 minute threshold, should not be expiring
      expect(manager.isTokenExpiringSoon(token, 60 * 1000)).toBe(false);
      
      // With 3 minute threshold, should be expiring
      expect(manager.isTokenExpiringSoon(token, 180 * 1000)).toBe(true);
    });
  });

  describe('getValidToken', () => {
    function createTestJwt(expiresInSeconds: number): string {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        sub: 'user-123',
      }));
      return `${header}.${payload}.test-signature`;
    }

    it('returns null when no session', async () => {
      expect(await manager.getValidToken()).toBeNull();
    });

    it('returns cached token when not expiring', async () => {
      const token = createTestJwt(3600);
      manager.setSession({ userId: 'user-123', accessToken: token });

      expect(await manager.getValidToken()).toBe(token);
    });

    it('refreshes token when expiring soon', async () => {
      const oldToken = createTestJwt(60); // Expiring soon
      const newToken = createTestJwt(3600);
      
      manager.setSession({ userId: 'user-123', accessToken: oldToken });
      manager.setRefreshFunction(async () => ({
        userId: 'user-123',
        accessToken: newToken,
      }));

      const result = await manager.getValidToken();
      expect(result).toBe(newToken);
    });

    it('returns null when refresh fails', async () => {
      const oldToken = createTestJwt(60);
      manager.setSession({ userId: 'user-123', accessToken: oldToken });
      manager.setRefreshFunction(async () => null);

      expect(await manager.getValidToken()).toBeNull();
    });

    it('uses mutex for concurrent refresh calls', async () => {
      const oldToken = createTestJwt(60);
      let refreshCount = 0;
      const newToken = createTestJwt(3600);

      manager.setSession({ userId: 'user-123', accessToken: oldToken });
      manager.setRefreshFunction(async () => {
        refreshCount++;
        await new Promise(r => setTimeout(r, 50)); // Simulate delay
        return { userId: 'user-123', accessToken: newToken };
      });

      // Call getValidToken multiple times concurrently
      const results = await Promise.all([
        manager.getValidToken(),
        manager.getValidToken(),
        manager.getValidToken(),
      ]);

      // All should get the same token
      expect(results).toEqual([newToken, newToken, newToken]);
      // But refresh should only be called once
      expect(refreshCount).toBe(1);
    });

    it('returns null when no refresh function configured', async () => {
      const oldToken = createTestJwt(60);
      manager.setSession({ userId: 'user-123', accessToken: oldToken });
      // No refresh function set

      expect(await manager.getValidToken()).toBeNull();
    });
  });

  describe('clear', () => {
    it('clears all state', () => {
      manager.setSession({ userId: 'user-123', accessToken: 'token' });
      expect(manager.hasSession()).toBe(true);

      manager.clear();

      expect(manager.hasSession()).toBe(false);
      expect(manager.getSession()).toBeNull();
    });

    it('notifies listeners when cleared', () => {
      const listener = jest.fn();
      manager.setSession({ userId: 'user-123', accessToken: 'token' });
      manager.addListener(listener);

      manager.clear();

      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('getSessionManager singleton', () => {
    it('returns same instance', () => {
      const instance1 = getSessionManager();
      const instance2 = getSessionManager();
      expect(instance1).toBe(instance2);
    });

    it('resets with resetSessionManager', () => {
      const instance1 = getSessionManager();
      instance1.setSession({ userId: 'user-123', accessToken: 'token' });

      resetSessionManager();

      const instance2 = getSessionManager();
      expect(instance2).not.toBe(instance1);
      expect(instance2.hasSession()).toBe(false);
    });
  });
});
```

## Verification

```bash
# Create directory
mkdir -p src/infrastructure/auth
mkdir -p __tests__/infrastructure/auth

# Run tests
npm test -- --testPathPattern="SessionManager"

# Type check
npx tsc --noEmit
```

## Integration Note

After this task, the existing `client.ts` should be updated to use `SessionManager`:
```typescript
// In client.ts, replace direct session caching with:
import { getSessionManager } from '../../infrastructure/auth/SessionManager';

export function setCachedSession(session: {...} | null) {
  getSessionManager().setSession(session ? {
    userId: session.user.id,
    accessToken: session.access_token,
  } : null);
}

export function getCachedSession() {
  return getSessionManager().getSession();
}

export async function getValidAccessToken() {
  return getSessionManager().getValidToken();
}
```

This integration will be done in Phase 5 (cleanup).

## Completion Criteria
- [ ] `SessionManager` class with session caching
- [ ] Token expiry checking with JWT parsing
- [ ] Mutex-protected token refresh
- [ ] Session change listeners
- [ ] Factory function `getSessionManager()` returns singleton
- [ ] All tests pass
- [ ] No TypeScript errors

## Commit Message
```
feat(infrastructure): add SessionManager for auth session management
```
