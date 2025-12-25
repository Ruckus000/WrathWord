// __tests__/infrastructure/auth/SessionManager.test.ts

import { SessionManager, getSessionManager, resetSessionManager } from '../../../src/infrastructure/auth/SessionManager';

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
      const payload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
          sub: 'user-123',
        }),
      );
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
      expect(manager.isTokenExpiringSoon('only.two')).toBe(true);
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
      const payload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
          sub: 'user-123',
        }),
      );
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
      const results = await Promise.all([manager.getValidToken(), manager.getValidToken(), manager.getValidToken()]);

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
