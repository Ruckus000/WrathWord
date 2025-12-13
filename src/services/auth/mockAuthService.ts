/**
 * Mock Authentication Service
 * 
 * Mock implementation for development mode.
 * Always returns a fake "logged in" user with no actual authentication.
 */

import {
  IAuthService,
  AuthUser,
  AuthSession,
  AuthResult,
} from './types';
import {getJSON, setJSON} from '../../storage/mmkv';
import {getFriendCode, getDisplayName} from '../../storage/friendCode';
import {getProfile} from '../../storage/profile';

const MOCK_SESSION_KEY = 'mock.auth.session';

// Mock dev user
const createMockUser = (username?: string): AuthUser => {
  const profile = getProfile();
  const displayName = getDisplayName();
  const friendCode = getFriendCode();
  return {
    id: profile.id,
    email: 'dev@wrathword.local',
    username: username || 'DevUser',
    displayName: displayName !== 'Player' ? displayName : username || 'DevUser',
    friendCode,
    createdAt: new Date(profile.createdAt).toISOString(),
  };
};

const createMockSession = (user: AuthUser): AuthSession => ({
  user,
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
});

class MockAuthService implements IAuthService {
  private authStateCallbacks: Array<
    (session: AuthSession | null) => void
  > = [];

  async signUp(
    email: string,
    password: string,
    username: string,
  ): Promise<AuthResult<AuthSession>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = createMockUser(username);
    const session = createMockSession(user);

    // Store mock session
    setJSON(MOCK_SESSION_KEY, session);

    // Notify listeners
    this.authStateCallbacks.forEach(cb => cb(session));

    return {data: session, error: null};
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResult<AuthSession>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if there's an existing mock session
    let session = getJSON<AuthSession>(MOCK_SESSION_KEY, null);

    if (!session) {
      // Create new mock session
      const user = createMockUser();
      session = createMockSession(user);
      setJSON(MOCK_SESSION_KEY, session);
    }

    // Notify listeners
    this.authStateCallbacks.forEach(cb => cb(session));

    return {data: session, error: null};
  }

  async signOut(): Promise<AuthResult<void>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clear mock session
    setJSON(MOCK_SESSION_KEY, null);

    // Notify listeners
    this.authStateCallbacks.forEach(cb => cb(null));

    return {data: undefined, error: null};
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = getJSON<AuthSession>(MOCK_SESSION_KEY, null);
    return session?.user || null;
  }

  async getSession(): Promise<AuthSession | null> {
    // In dev mode, always return a mock session (auto-login)
    let session = getJSON<AuthSession>(MOCK_SESSION_KEY, null);

    if (!session) {
      // Auto-create session for dev mode
      const user = createMockUser();
      session = createMockSession(user);
      setJSON(MOCK_SESSION_KEY, session);
    }

    return session;
  }

  onAuthStateChange(
    callback: (session: AuthSession | null) => void,
  ): () => void {
    // Add callback to list
    this.authStateCallbacks.push(callback);

    // Immediately call with current session
    const session = getJSON<AuthSession>(MOCK_SESSION_KEY, null);
    callback(session);

    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }

  async resetPassword(): Promise<AuthResult<{message: string}>> {
    return {
      data: null,
      error: {message: 'Password reset not available in dev mode'},
    };
  }
}

export const mockAuthService = new MockAuthService();













