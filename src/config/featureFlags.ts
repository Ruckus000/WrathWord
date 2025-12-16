// src/config/featureFlags.ts
// Feature flags for gradual rollout and rollback capability

export const FEATURE_FLAGS = {
  /**
   * When true, app opens to HomeScreen instead of GameScreen.
   * Set to false for instant rollback without code changes.
   */
  HOME_SCREEN_ENABLED: true,
};
