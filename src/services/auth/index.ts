/**
 * Authentication Service Factory
 * 
 * Exports the appropriate auth service based on environment mode.
 * In dev mode: uses mock auth (no real authentication)
 * In prod mode: uses Supabase auth (real backend)
 */

import {isDevelopment} from '../../config/environment';
import {supabaseAuthService} from './supabaseAuthService';
import {mockAuthService} from './mockAuthService';
import {IAuthService} from './types';

/**
 * Get the appropriate auth service based on current mode
 */
export function getAuthService(): IAuthService {
  return isDevelopment ? mockAuthService : supabaseAuthService;
}

/**
 * Default export for convenience
 */
export const authService = getAuthService();

// Re-export types
export type {
  IAuthService,
  AuthUser,
  AuthSession,
  AuthError,
  AuthResult,
} from './types';







