/**
 * Supabase Authentication Service
 * 
 * Real implementation of auth service using Supabase backend.
 * Used in production mode when Supabase is configured.
 */

import {getSupabase} from '../supabase/client';
import {
  IAuthService,
  AuthUser,
  AuthSession,
  AuthResult,
} from './types';
import {getFriendCode} from '../../storage/friendCode';

class SupabaseAuthService implements IAuthService {
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
    const supabase = getSupabase();
    if (!supabase) {
      return {
        data: null,
        error: {message: 'Supabase not configured', code: 'NO_SUPABASE'},
      };
    }

    try {
      const {data: authData, error: authError} =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

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
      const {data: profile} = await supabase
        .from('profiles')
        .select('username, display_name, friend_code')
        .eq('user_id', authData.user.id)
        .single();

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

      return {data: session, error: null};
    } catch (err) {
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
      console.log('[Auth] Supabase not configured');
      return null;
    }

    try {
      console.log('[Auth] Getting session...');
      const {
        data: {session},
      } = await supabase.auth.getSession();

      if (!session) {
        console.log('[Auth] No session found');
        return null;
      }

      console.log('[Auth] Session found, fetching profile...');
      // Get user profile
      const {data: profile} = await supabase
        .from('profiles')
        .select('username, display_name, friend_code')
        .eq('user_id', session.user.id)
        .single();
      console.log('[Auth] Profile fetched:', profile?.username);

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
    const supabase = getSupabase();
    if (!supabase) {
      return () => {};
    }

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        callback(null);
        return;
      }

      // Get user profile (supabase is guaranteed non-null here since we checked above)
      const {data: profile} = await supabase
        .from('profiles')
        .select('username, display_name, friend_code')
        .eq('user_id', session.user.id)
        .single();

      callback({
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
      });
    });

    return () => {
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







