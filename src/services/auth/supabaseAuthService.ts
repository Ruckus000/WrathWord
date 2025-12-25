/**
 * Supabase Authentication Service
 * 
 * Real implementation of auth service using Supabase backend.
 * Used in production mode when Supabase is configured.
 */

import {getSupabase, setCachedSession} from '../supabase/client';
import {
  IAuthService,
  AuthUser,
  AuthSession,
  AuthResult,
} from './types';
import {getFriendCode} from '../../storage/friendCode';
import {logger} from '../../utils/logger';

class SupabaseAuthService implements IAuthService {
  private authStateCallbacks: Array<(session: AuthSession | null) => void> = [];

  async signUp(
    email: string,
    password: string,
    username: string,
  ): Promise<AuthResult<AuthSession>> {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        data: null,
        error: {message: 'Supabase not configured', code: 'NO_SUPABASE'},
      };
    }

    try {
      // Sign up with Supabase Auth
      // Pass username in metadata - database trigger will use it to create profile
      const {data: authData, error: authError} = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (authError) {
        return {data: null, error: {message: authError.message}};
      }

      if (!authData.user) {
        return {
          data: null,
          error: {message: 'Failed to create user'},
        };
      }

      // Profile is created automatically by database trigger (handle_new_user)
      // Check if email confirmation is required (no session means confirmation needed)
      if (!authData.session) {
        return {
          data: null,
          error: {
            message: 'Please check your email to confirm your account',
            code: 'EMAIL_CONFIRMATION_REQUIRED',
          },
        };
      }

      // Session exists - user can proceed immediately
      const session: AuthSession = {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username,
          createdAt: authData.user.created_at,
        },
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      };

      // Cache session for sync access by other services
      setCachedSession({
        user: {id: authData.user.id},
        access_token: authData.session.access_token,
      });

      // Notify all registered listeners (like mockAuthService does)
      this.authStateCallbacks.forEach(cb => cb(session));

      return {data: session, error: null};
    } catch (err) {
      return {
        data: null,
        error: {message: err instanceof Error ? err.message : 'Unknown error'},
      };
    }
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResult<AuthSession>> {
    logger.log('[Auth] signIn() called');
    const supabase = getSupabase();

    if (!supabase) {
      logger.log('[Auth] No Supabase client - returning error');
      return {
        data: null,
        error: {message: 'Supabase not configured', code: 'NO_SUPABASE'},
      };
    }

    try {
      logger.log('[Auth] Calling signInWithPassword...');
      const {data: authData, error: authError} =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      logger.log(
        '[Auth] signInWithPassword returned',
        authError ? 'error: ' + authError.message : 'success',
      );

      if (authError) {
        return {data: null, error: {message: authError.message}};
      }

      if (!authData.user) {
        return {
          data: null,
          error: {message: 'Failed to sign in'},
        };
      }

      // Get user profile
      logger.log('[Auth] Fetching user profile...');
      const {data: profile} = await supabase
        .from('profiles')
        .select('username, display_name, friend_code')
        .eq('user_id', authData.user.id)
        .single();
      logger.log('[Auth] Profile fetched:', profile?.username);

      const session: AuthSession = {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: profile?.username,
          displayName: profile?.display_name,
          friendCode: profile?.friend_code,
          createdAt: authData.user.created_at,
        },
        accessToken: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token,
      };

      // Cache session for sync access by other services
      if (authData.session?.access_token) {
        setCachedSession({
          user: {id: authData.user.id},
          access_token: authData.session.access_token,
        });
      }

      // Notify all registered listeners (like mockAuthService does)
      logger.log(
        '[Auth] signIn success, notifying',
        this.authStateCallbacks.length,
        'callbacks',
      );
      this.authStateCallbacks.forEach(cb => cb(session));

      return {data: session, error: null};
    } catch (err) {
      logger.log('[Auth] signIn caught error:', err);
      return {
        data: null,
        error: {message: err instanceof Error ? err.message : 'Unknown error'},
      };
    }
  }

  async signOut(): Promise<AuthResult<void>> {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        data: null,
        error: {message: 'Supabase not configured', code: 'NO_SUPABASE'},
      };
    }

    try {
      const {error} = await supabase.auth.signOut();
      if (error) {
        return {data: null, error: {message: error.message}};
      }

      // Clear cached session
      setCachedSession(null);

      // Notify all registered listeners (like mockAuthService does)
      this.authStateCallbacks.forEach(cb => cb(null));

      return {data: undefined, error: null};
    } catch (err) {
      return {
        data: null,
        error: {message: err instanceof Error ? err.message : 'Unknown error'},
      };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = getSupabase();
    if (!supabase) {
      return null;
    }

    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      // Get user profile
      const {data: profile} = await supabase
        .from('profiles')
        .select('username, display_name, friend_code')
        .eq('user_id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        username: profile?.username,
        displayName: profile?.display_name,
        friendCode: profile?.friend_code,
        createdAt: user.created_at,
      };
    } catch {
      return null;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const supabase = getSupabase();
    if (!supabase) {
      logger.log('[Auth] Supabase not configured');
      return null;
    }

    try {
      logger.log('[Auth] Getting session...');
      const {
        data: {session},
      } = await supabase.auth.getSession();

      if (!session) {
        logger.log('[Auth] No session found');
        return null;
      }

      logger.log('[Auth] Session found, fetching profile...');
      // Get user profile
      const {data: profile} = await supabase
        .from('profiles')
        .select('username, display_name, friend_code')
        .eq('user_id', session.user.id)
        .single();
      logger.log('[Auth] Profile fetched:', profile?.username);

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          username: profile?.username,
          displayName: profile?.display_name,
          friendCode: profile?.friend_code,
          createdAt: session.user.created_at,
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      };
    } catch {
      return null;
    }
  }

  onAuthStateChange(
    callback: (session: AuthSession | null) => void,
  ): () => void {
    logger.log('[Auth] onAuthStateChange() called');
    const supabase = getSupabase();

    if (!supabase) {
      logger.log('[Auth] WARNING: Not registering callback - Supabase is null');
      return () => {};
    }

    // Store callback locally (like mockAuthService does)
    this.authStateCallbacks.push(callback);
    logger.log(
      '[Auth] Callback registered, total:',
      this.authStateCallbacks.length,
    );

    // Immediately call with current session (like mockAuthService does)
    this.getSession().then(session => {
      callback(session);
    });

    // Keep Supabase listener for external changes (token refresh, logout from other device, etc.)
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log('[Auth] NATIVE onAuthStateChange fired:', event, !!session);

      // Cache session for sync access by other services (handles TOKEN_REFRESHED too)
      setCachedSession(
        session
          ? {
              user: {id: session.user.id},
              access_token: session.access_token,
            }
          : null,
      );

      if (!session) {
        callback(null);
        return;
      }

      // IMPORTANT: Call callback IMMEDIATELY with basic session info
      // Don't wait for profile fetch - it might hang and block navigation
      logger.log('[Auth] Calling callback immediately with basic session');
      callback({
        user: {
          id: session.user.id,
          email: session.user.email,
          createdAt: session.user.created_at,
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });

      // Then try to fetch profile and update with full info (non-blocking)
      try {
        const {data: profile} = await supabase
          .from('profiles')
          .select('username, display_name, friend_code')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          logger.log('[Auth] Profile fetched, updating session');
          callback({
            user: {
              id: session.user.id,
              email: session.user.email,
              username: profile.username,
              displayName: profile.display_name,
              friendCode: profile.friend_code,
              createdAt: session.user.created_at,
            },
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          });
        }
      } catch (error) {
        logger.error('[Auth] Profile fetch failed (non-blocking):', error);
      }
    });

    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
      subscription.unsubscribe();
    };
  }

  async resetPassword(email: string): Promise<AuthResult<{message: string}>> {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        data: null,
        error: {message: 'Supabase not configured', code: 'NO_SUPABASE'},
      };
    }

    try {
      const {error} = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return {data: null, error: {message: error.message, code: error.code}};
      }

      return {
        data: {message: 'Check your email for reset instructions'},
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: {message: err instanceof Error ? err.message : 'Unknown error'},
      };
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();













