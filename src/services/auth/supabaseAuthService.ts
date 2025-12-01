/**
 * Supabase Authentication Service
 * 
 * Real implementation of auth service using Supabase backend.
 * Used in production mode when Supabase is configured.
 */

import {supabase} from '../supabase/client';
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
    if (!supabase) {
      return {
        data: null,
        error: {message: 'Supabase not configured', code: 'NO_SUPABASE'},
      };
    }

    try {
      // Sign up with Supabase Auth
      const {data: authData, error: authError} = await supabase.auth.signUp({
        email,
        password,
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

      // Generate friend code for this user
      const friendCode = getFriendCode();

      // Create profile in database
      const {error: profileError} = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        username,
        display_name: username,
        friend_code: friendCode,
      });

      if (profileError) {
        return {
          data: null,
          error: {message: `Failed to create profile: ${profileError.message}`},
        };
      }

      const session: AuthSession = {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username,
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

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResult<AuthSession>> {
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
        .select('username')
        .eq('user_id', authData.user.id)
        .single();

      const session: AuthSession = {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: profile?.username,
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

      // Get user profile for username
      const {data: profile} = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        username: profile?.username,
        createdAt: user.created_at,
      };
    } catch {
      return null;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    if (!supabase) {
      return null;
    }

    try {
      const {
        data: {session},
      } = await supabase.auth.getSession();

      if (!session) {
        return null;
      }

      // Get user profile
      const {data: profile} = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', session.user.id)
        .single();

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          username: profile?.username,
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

      // Get user profile
      const {data: profile} = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', session.user.id)
        .single();

      callback({
        user: {
          id: session.user.id,
          email: session.user.email,
          username: profile?.username,
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
}

export const supabaseAuthService = new SupabaseAuthService();



