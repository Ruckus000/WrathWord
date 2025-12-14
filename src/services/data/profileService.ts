/**
 * Profile Service
 * 
 * Handles user profile and game statistics.
 * Routes to appropriate implementation based on environment mode.
 */

import {isDevelopment} from '../../config/environment';
import {VALID_LENGTHS} from '../../config/gameConfig';
import {getSupabase, getCachedSession, getValidAccessToken} from '../supabase/client';
import {directUpsert} from '../supabase/directRpc';
import {
  UserProfile,
  LengthStats,
  getProfile as getLocalProfile,
  saveProfile as saveLocalProfile,
  updatePreferences as updateLocalPreferences,
  recordGameResult as recordLocalGameResult,
  getStatsForLength as getLocalStatsForLength,
  getTotalStats as getLocalTotalStats,
  UserPreferences,
} from '../../storage/profile';
import {setDisplayName as setLocalDisplayName} from '../../storage/friendCode';

export interface IProfileService {
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  updatePreferences(prefs: Partial<UserPreferences>): Promise<void>;
  updateDisplayName(displayName: string): Promise<void>;
  syncStats(): Promise<void>;
  getStatsForLength(length: number): Promise<LengthStats>;
  getTotalStats(): Promise<{
    played: number;
    won: number;
    winRate: number;
    currentStreak: number;
    maxStreak: number;
  }>;
}

/**
 * Mock Profile Service (Dev Mode)
 * Uses local MMKV storage
 */
class MockProfileService implements IProfileService {
  async getProfile(): Promise<UserProfile> {
    return getLocalProfile();
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const profile = getLocalProfile();
    saveLocalProfile({...profile, ...updates});
  }

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
    updateLocalPreferences(prefs);
  }

  async updateDisplayName(displayName: string): Promise<void> {
    // Store locally for dev mode
    setLocalDisplayName(displayName);
  }

  async syncStats(): Promise<void> {
    // No-op in dev mode - everything is already local
  }

  async getStatsForLength(length: number): Promise<LengthStats> {
    return getLocalStatsForLength(length);
  }

  async getTotalStats() {
    return getLocalTotalStats();
  }
}

/**
 * Supabase Profile Service (Prod Mode)
 * Syncs with Supabase backend
 */
class SupabaseProfileService implements IProfileService {
  async getProfile(): Promise<UserProfile> {
    const supabase = getSupabase();
    if (!supabase) {
      return getLocalProfile();
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return getLocalProfile();
      }
      const user = session.user;

      // Try to fetch from Supabase
      const {data: profile, error} = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        return getLocalProfile();
      }

      // Merge with local profile structure
      const localProfile = getLocalProfile();
      return {
        ...localProfile,
        id: profile.user_id,
      };
    } catch {
      return getLocalProfile();
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const profile = getLocalProfile();
    saveLocalProfile({...profile, ...updates});

    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return;
      }
      const user = session.user;

      // Update in Supabase
      await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch {
      // Fail silently - local is source of truth
    }
  }

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
    updateLocalPreferences(prefs);
  }

  async updateDisplayName(displayName: string): Promise<void> {
    // Store locally
    setLocalDisplayName(displayName);

    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Not authenticated');
      }
      const user = session.user;

      // Update in Supabase
      const {error} = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      // Re-throw so UI can handle it
      throw err;
    }
  }

  async syncStats(): Promise<void> {
    console.log('[ProfileService] syncStats called');

    // Get a valid token (refreshes if expiring soon)
    const token = await getValidAccessToken();
    const session = getCachedSession();

    if (!token || !session) {
      console.warn('[ProfileService] No valid token or session - skipping sync');
      return;
    }
    console.log('[ProfileService] Syncing stats for user:', session.user.id);

    const localProfile = getLocalProfile();

    // Sync each valid word length (4-6)
    for (const length of VALID_LENGTHS) {
      const stats = localProfile.stats[length];
      if (!stats) {
        continue;
      }

      // Skip if no games played for this length
      if (stats.gamesPlayed === 0) {
        continue;
      }

      console.log(`[ProfileService] Upserting stats for length ${length}:`, {
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
      });

      // Use directUpsert with timeout (avoids Supabase JS client pipeline)
      const {error} = await directUpsert(
        'game_stats',
        {
          user_id: session.user.id,
          word_length: length,
          games_played: stats.gamesPlayed,
          games_won: stats.gamesWon,
          current_streak: stats.currentStreak,
          max_streak: stats.maxStreak,
          guess_distribution: stats.guessDistribution,
          used_words: stats.usedWords,
          current_cycle: stats.currentCycle,
          last_played_date: stats.lastPlayedDate,
          updated_at: new Date().toISOString(),
        },
        token,
        'user_id,word_length',
      );

      if (error) {
        console.error(`[ProfileService] Upsert failed for length ${length}:`, error.message);
      } else {
        console.log(`[ProfileService] Stats synced for length ${length}`);
      }
    }
  }

  async getStatsForLength(length: number): Promise<LengthStats> {
    return getLocalStatsForLength(length);
  }

  async getTotalStats() {
    return getLocalTotalStats();
  }
}

/**
 * Get the appropriate profile service based on environment
 */
export function getProfileService(): IProfileService {
  return isDevelopment
    ? new MockProfileService()
    : new SupabaseProfileService();
}

export const profileService = getProfileService();













