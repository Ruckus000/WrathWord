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
import {authService, AuthSession, AuthUser} from '../services/auth';
import {isDevelopment} from '../config/environment';
import {setCurrentUserId} from '../storage/userScope';
import {friendsService, getProfileService} from '../services/data';

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
        console.log('Background friends pre-fetch failed:', err);
      });

      // Sync local stats to DB on login (fire-and-forget)
      // This pushes any existing local game data to the cloud
      getProfileService().syncStats().catch(err => {
        console.log('[AuthContext] Background stats sync failed:', err);
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
        console.error('Auth initialization failed:', error);
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

  const handleSignOut = async () => {
    await authService.signOut();
    setSession(null);
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












