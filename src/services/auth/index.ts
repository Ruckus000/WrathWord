/**
 * Authentication Service Factory
 *
 * Exports the appropriate auth service based on environment mode.
 * Uses lazy loading to avoid importing unnecessary services at startup.
 *
 * In dev mode: uses mock auth (no real authentication)
 * In prod mode: uses Supabase auth (real backend)
 */

import {isDevelopment} from '../../config/environment';
import type {IAuthService} from './types';

// Cached service instance for lazy loading
let _authService: IAuthService | null = null;

/**
 * Get the appropriate auth service based on current mode.
 * Uses lazy loading to only import the service when first accessed.
 */
export function getAuthService(): IAuthService {
  if (!_authService) {
    if (isDevelopment) {
      // Only load mock service in dev mode
      const {mockAuthService} = require('./mockAuthService');
      _authService = mockAuthService;
    } else {
      // Only load Supabase service in prod mode
      const {supabaseAuthService} = require('./supabaseAuthService');
      _authService = supabaseAuthService;
    }
  }
  return _authService!;
}

/**
 * Default export for convenience
 * Note: This triggers lazy loading on first access
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





