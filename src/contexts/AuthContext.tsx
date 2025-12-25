/**
 * Authentication Context
 * 
 * Provides authentication state throughout the app.
 * Automatically switches between mock and real auth based on environment.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {authService, AuthSession, AuthUser} from '../services/auth';
import {isDevelopment} from '../config/environment';
import {setCurrentUserId} from '../storage/userScope';
import {friendsService, getProfileService} from '../services/data';
import {getSupabase, setCachedSession} from '../services/supabase/client';
import {logger} from '../utils/logger';

// Stable user ID for development mode
const DEV_MODE_USER_ID = 'dev-user';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDevelopmentMode: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({children}: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Update user-scoped storage when session changes
  useEffect(() => {
    if (isDevelopment) {
      // In dev mode, always use a stable user ID
      setCurrentUserId(DEV_MODE_USER_ID);
    } else if (session?.user?.id) {
      // In prod mode, use the authenticated user's ID
      setCurrentUserId(session.user.id);

      // Pre-fetch friends data in background (fire-and-forget)
      // This populates the cache so FriendsScreen loads instantly
      // Pass userId and accessToken for direct API calls (bypasses Supabase JS client)
      friendsService.getFriends(undefined, session.user.id, session.accessToken ?? undefined).catch(err => {
        logger.log('Background friends pre-fetch failed:', err);
      });

      // Sync local stats to DB on login (fire-and-forget)
      // This pushes any existing local game data to the cloud
      getProfileService().syncStats().catch(err => {
        logger.log('[AuthContext] Background stats sync failed:', err);
      });
    } else {
      // No user signed in - clear user ID
      setCurrentUserId(null);
    }
  }, [session]);

  useEffect(() => {
    let isMounted = true;

    // Get initial session with timeout to prevent infinite loading
    const initAuth = async () => {
      try {
        // Add a 3 second timeout - faster UX, show sign-in if slow
        const timeoutPromise = new Promise<null>(resolve =>
          setTimeout(() => resolve(null), 3000),
        );
        const sessionPromise = authService.getSession();

        const initialSession = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]);

        if (isMounted) {
          setSession(initialSession);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Auth initialization failed:', error);
        if (isMounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange(newSession => {
      if (isMounted) {
        setSession(newSession);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Manage Supabase auto-refresh based on app state
  // This ensures tokens are refreshed when app is in foreground
  useEffect(() => {
    if (isDevelopment) {
      return; // Skip in dev mode - no Supabase client
    }

    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    // Start auto refresh when app launches
    supabase.auth.startAutoRefresh();
    logger.log('[AuthContext] Started Supabase auto-refresh');

    // Handle app state changes
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
        logger.log('[AuthContext] App active - started auto-refresh');
      } else {
        supabase.auth.stopAutoRefresh();
        logger.log('[AuthContext] App backgrounded - stopped auto-refresh');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      supabase.auth.stopAutoRefresh();
      subscription.remove();
    };
  }, []);

  const handleSignOut = async () => {
    logger.log('[AuthContext] Signing out - clearing session data');

    // Clear cached session first (prevents stale token usage)
    setCachedSession(null);

    // Clear user-scoped storage (setCurrentUserId(null) is called in useEffect when session becomes null)
    setCurrentUserId(null);

    // Sign out from auth service
    await authService.signOut();

    // Update local state
    setSession(null);

    logger.log('[AuthContext] Sign out complete');
  };

  const value: AuthContextValue = {
    session,
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    loading,
    isAuthenticated: session !== null,
    isDevelopmentMode: isDevelopment,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}













