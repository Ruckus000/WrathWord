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

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
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
    loading,
    isAuthenticated: session !== null,
    isDevelopmentMode: isDevelopment,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}







