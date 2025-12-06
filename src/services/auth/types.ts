/**
 * Authentication Service Interface
 * 
 * Defines the contract for authentication operations.
 * Implemented by both real (Supabase) and mock (dev) auth services.
 */

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  friendCode?: string;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResult<T> {
  data: T | null;
  error: AuthError | null;
}

export interface IAuthService {
  /**
   * Sign up a new user with email and password
   */
  signUp(
    email: string,
    password: string,
    username: string,
  ): Promise<AuthResult<AuthSession>>;

  /**
   * Sign in an existing user with email and password
   */
  signIn(email: string, password: string): Promise<AuthResult<AuthSession>>;

  /**
   * Sign out the current user
   */
  signOut(): Promise<AuthResult<void>>;

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Get the current session
   */
  getSession(): Promise<AuthSession | null>;

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(
    callback: (session: AuthSession | null) => void,
  ): () => void;
}







