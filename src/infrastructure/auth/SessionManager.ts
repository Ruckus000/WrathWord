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
