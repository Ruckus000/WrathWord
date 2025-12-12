/**
 * Friends Service
 *
 * Handles friend relationships, requests, and leaderboards.
 * Routes to appropriate implementation based on environment mode.
 *
 * PERFORMANCE: Uses stale-while-revalidate caching pattern:
 * - Returns cached data immediately for instant UI
 * - Fetches fresh data in background
 * - Updates cache when fresh data arrives
 */

import {isDevelopment} from '../../config/environment';
import {getSupabase} from '../supabase/client';
import {directRpc, directQuery} from '../supabase/directRpc';
import {Friend} from '../../data/mockFriends';
import {MOCK_FRIENDS} from '../../data/mockFriends';
import {
  MOCK_INCOMING_REQUESTS,
  MOCK_OUTGOING_REQUESTS,
  MOCK_SEARCHABLE_USERS,
  FriendRequest,
} from '../../data/mockFriendRequests';
import {MOCK_GLOBAL_USERS} from '../../data/mockGlobalUsers';
import {
  getCache,
  setCache,
  isCacheStale,
  CACHE_KEYS,
} from '../utils/cache';

/**
 * Safely convert a value to a number, returning fallback for NaN/null/undefined
 */
function safeNumber(val: any, fallback = 0): number {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

/**
 * Callback for stale-while-revalidate pattern
 * Called when fresh data arrives after returning cached data
 */
export type OnFreshData<T> = (data: T) => void;

export interface IFriendsService {
  /**
   * Get friends list with optional cache callback
   * @param onFreshData - Called when fresh data arrives (for stale-while-revalidate)
   * @param userId - Optional user ID to avoid calling getSession (which can hang)
   * @param accessToken - Optional access token for direct API calls (bypasses Supabase JS client)
   */
  getFriends(onFreshData?: OnFreshData<Friend[]>, userId?: string, accessToken?: string): Promise<Friend[]>;
  searchUserByFriendCode(friendCode: string): Promise<Friend | null>;
  sendFriendRequest(toUserId: string): Promise<void>;
  acceptFriendRequest(requestId: string): Promise<void>;
  declineFriendRequest(requestId: string): Promise<void>;
  getIncomingRequests(): Promise<FriendRequest[]>;
  getOutgoingRequests(): Promise<FriendRequest[]>;
  /**
   * Get global leaderboard with optional cache callback
   * @param limit - Max number of users to return
   * @param onFreshData - Called when fresh data arrives (for stale-while-revalidate)
   * @param userId - Optional user ID to avoid calling getSession (which can hang)
   * @param accessToken - Optional access token for direct API calls (bypasses Supabase JS client)
   */
  getGlobalLeaderboard(
    limit?: number,
    onFreshData?: OnFreshData<Friend[]>,
    userId?: string,
    accessToken?: string,
  ): Promise<Friend[]>;
  getFriendsLeaderboard(): Promise<Friend[]>;
  /**
   * Invalidate all caches (call after adding friend, etc.)
   */
  invalidateCache(): void;
}

/**
 * Mock Friends Service (Dev Mode)
 * Returns hardcoded mock data
 */
class MockFriendsService implements IFriendsService {
  async getFriends(_onFreshData?: OnFreshData<Friend[]>, _userId?: string, _accessToken?: string): Promise<Friend[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_FRIENDS;
  }

  invalidateCache(): void {
    // No-op for mock service
  }

  async searchUserByFriendCode(friendCode: string): Promise<Friend | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const found = MOCK_SEARCHABLE_USERS.find(
      u => u.friendCode.toLowerCase() === friendCode.toLowerCase(),
    );
    if (!found) {
      return null;
    }

    // Convert to Friend type
    return {
      id: found.id,
      name: found.name,
      letter: found.letter,
      friendCode: found.friendCode,
      streak: 0,
      lastPlayed: 'inactive',
      stats: {
        played: 0,
        won: 0,
        winRate: 0,
        avgGuesses: 0,
        maxStreak: 0,
      },
      h2h: {yourWins: 0, theirWins: 0},
    } as Friend;
  }

  async sendFriendRequest(toUserId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Mock: Sent friend request to', toUserId);
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Mock: Accepted friend request', requestId);
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Mock: Declined friend request', requestId);
  }

  async getIncomingRequests(): Promise<FriendRequest[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_INCOMING_REQUESTS;
  }

  async getOutgoingRequests(): Promise<FriendRequest[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_OUTGOING_REQUESTS;
  }

  async getGlobalLeaderboard(
    limit = 20,
    _onFreshData?: OnFreshData<Friend[]>,
    _userId?: string,
    _accessToken?: string,
  ): Promise<Friend[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_GLOBAL_USERS.slice(0, limit);
  }

  async getFriendsLeaderboard(): Promise<Friend[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_FRIENDS.filter(f => f.lastPlayed === 'today').sort(
      (a, b) => (a.todayResult?.guesses || 99) - (b.todayResult?.guesses || 99),
    );
  }
}

/**
 * Supabase Friends Service (Prod Mode)
 * Fetches from Supabase backend with caching
 */
class SupabaseFriendsService implements IFriendsService {
  /**
   * Invalidate all cached data
   * Call this after adding/removing friends
   */
  invalidateCache(): void {
    setCache(CACHE_KEYS.FRIENDS, null);
    setCache(CACHE_KEYS.GLOBAL_LEADERBOARD, null);
    setCache(CACHE_KEYS.FRIENDS_LEADERBOARD, null);
  }

  /**
   * Fetch today's game results for a list of users
   * Uses direct PostgREST query to bypass Supabase JS client
   */
  private async getTodayResults(
    userIds: string[],
    accessToken?: string,
  ): Promise<Map<string, {won: boolean; guesses: number; feedback?: any}>> {
    if (userIds.length === 0) {
      return new Map();
    }

    // If we have accessToken, use direct query (fast path)
    if (accessToken) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const {data, error} = await directQuery<{
          user_id: string;
          won: boolean;
          guesses: number;
          feedback: any;
        }>({
          table: 'game_results',
          select: 'user_id,won,guesses,feedback',
          filters: {
            date: `eq.${today}`,
            user_id: `in.(${userIds.join(',')})`,
          },
          accessToken,
          timeoutMs: 5000,
        });

        if (error || !data) {
          console.log('[FriendsService] getTodayResults direct query failed:', error?.message);
          return new Map();
        }

        const resultsMap = new Map();
        data.forEach(result => {
          resultsMap.set(result.user_id, {
            won: result.won,
            guesses: result.guesses,
            feedback: result.feedback,
          });
        });
        return resultsMap;
      } catch {
        return new Map();
      }
    }

    // Fallback to Supabase JS client (slower path)
    const supabase = getSupabase();
    if (!supabase) {
      return new Map();
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const {data, error} = await supabase
        .from('game_results')
        .select('user_id, won, guesses, feedback')
        .eq('date', today)
        .in('user_id', userIds);

      if (error || !data) {
        return new Map();
      }

      const resultsMap = new Map();
      data.forEach(result => {
        resultsMap.set(result.user_id, {
          won: result.won,
          guesses: result.guesses,
          feedback: result.feedback,
        });
      });

      return resultsMap;
    } catch {
      return new Map();
    }
  }

  /**
   * Calculate last played status based on game results
   */
  private async getLastPlayedStatus(
    userId: string,
  ): Promise<'today' | 'yesterday' | 'inactive'> {
    const supabase = getSupabase();
    if (!supabase) {
      return 'inactive';
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split('T')[0];

      const {data, error} = await supabase
        .from('game_results')
        .select('date')
        .eq('user_id', userId)
        .order('date', {ascending: false})
        .limit(1)
        .single();

      if (error || !data) {
        return 'inactive';
      }

      if (data.date === today) {
        return 'today';
      } else if (data.date === yesterday) {
        return 'yesterday';
      }
      return 'inactive';
    } catch {
      return 'inactive';
    }
  }
  /**
   * Helper to get session with timeout to prevent hangs during token refresh
   */
  private async getSessionWithTimeout(supabase: any, timeoutMs = 5000): Promise<{user: {id: string}} | null> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log('[FriendsService] getSession timed out after', timeoutMs, 'ms');
        resolve(null);
      }, timeoutMs);

      supabase.auth.getSession()
        .then(({data}: {data: {session: any}}) => {
          clearTimeout(timeoutId);
          resolve(data.session);
        })
        .catch((err: any) => {
          clearTimeout(timeoutId);
          console.error('[FriendsService] getSession error:', err);
          resolve(null);
        });
    });
  }

  /**
   * Internal method to fetch friends from API (no caching)
   * Uses directRpc to bypass Supabase JS client's blocking auth handling
   * @param userId - Optional user ID to avoid calling getSession (which can hang during token refresh)
   * @param accessToken - Optional access token for direct API calls (fast path)
   */
  private async fetchFriendsFromApi(userId?: string, accessToken?: string): Promise<Friend[]> {
    console.log('[FriendsService] fetchFriendsFromApi: Starting... userId:', !!userId, 'accessToken:', !!accessToken);

    // FAST PATH: Use directRpc if we have both userId and accessToken
    if (userId && accessToken) {
      console.log('[FriendsService] fetchFriendsFromApi: Using direct RPC (fast path)...');
      const {data, error} = await directRpc<any[]>({
        functionName: 'get_leaderboard',
        params: {
          p_user_id: userId,
          p_friends_only: true,
          p_period: 'alltime',
          p_limit: 100,
        },
        accessToken,
        timeoutMs: 8000,
      });

      if (error) {
        console.error('[FriendsService] fetchFriendsFromApi: Direct RPC error:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('[FriendsService] fetchFriendsFromApi: No friends data returned');
        return [];
      }

      console.log(`[FriendsService] fetchFriendsFromApi: Got ${data.length} friends`);

      // Fetch today's results using direct query
      const userIds = data.map((row: any) => row.user_id);
      const todayResults = await this.getTodayResults(userIds, accessToken);

      // Transform to Friend type
      return data.map((row: any) => {
        const todayResult = todayResults.get(row.user_id);
        return {
          id: row.user_id,
          name: row.display_name || row.username,
          letter: (row.display_name || row.username).charAt(0).toUpperCase(),
          friendCode: row.friend_code,
          streak: row.current_streak || 0,
          lastPlayed: todayResult ? 'today' : 'inactive',
          todayResult: todayResult
            ? {
                won: todayResult.won,
                guesses: todayResult.guesses,
                feedback: todayResult.feedback,
              }
            : undefined,
          stats: {
            played: row.games_played || 0,
            won: row.games_won || 0,
            winRate: safeNumber(row.win_rate),
            avgGuesses: safeNumber(row.avg_guesses),
            maxStreak: row.max_streak || 0,
          },
          h2h: {yourWins: 0, theirWins: 0},
        };
      });
    }

    // SLOW PATH: Fall back to Supabase JS client (may hang)
    console.log('[FriendsService] fetchFriendsFromApi: Using Supabase JS client (slow fallback)...');
    const supabase = getSupabase();
    if (!supabase) {
      console.log('[FriendsService] fetchFriendsFromApi: No supabase client');
      return [];
    }

    // If userId was passed, use it directly (avoids getSession which can hang)
    let finalUserId = userId;
    if (!finalUserId) {
      console.log('[FriendsService] fetchFriendsFromApi: No userId passed, getting session...');
      const session = await this.getSessionWithTimeout(supabase);
      if (!session?.user) {
        console.log('[FriendsService] fetchFriendsFromApi: No session/user (timed out or not signed in)');
        return [];
      }
      finalUserId = session.user.id;
    }

    console.log('[FriendsService] fetchFriendsFromApi: Calling supabase.rpc (may hang)...');
    const {data, error} = await supabase.rpc('get_leaderboard', {
      p_user_id: finalUserId,
      p_friends_only: true,
      p_period: 'alltime',
      p_limit: 100,
    });

    if (error) {
      console.error('[FriendsService] fetchFriendsFromApi: RPC error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[FriendsService] fetchFriendsFromApi: No data returned');
      return [];
    }

    console.log(`[FriendsService] fetchFriendsFromApi: Got ${data.length} friends`);

    const userIds = data.map((row: any) => row.user_id);
    const todayResults = await this.getTodayResults(userIds);

    return data.map((row: any) => {
      const todayResult = todayResults.get(row.user_id);
      return {
        id: row.user_id,
        name: row.display_name || row.username,
        letter: (row.display_name || row.username).charAt(0).toUpperCase(),
        friendCode: row.friend_code,
        streak: row.current_streak || 0,
        lastPlayed: todayResult ? 'today' : 'inactive',
        todayResult: todayResult
          ? {
              won: todayResult.won,
              guesses: todayResult.guesses,
              feedback: todayResult.feedback,
            }
          : undefined,
        stats: {
          played: row.games_played || 0,
          won: row.games_won || 0,
          winRate: safeNumber(row.win_rate),
          avgGuesses: safeNumber(row.avg_guesses),
          maxStreak: row.max_streak || 0,
        },
        h2h: {yourWins: 0, theirWins: 0},
      };
    });
  }

  /**
   * Get friends with stale-while-revalidate caching
   *
   * @param onFreshData - Optional callback for when fresh data arrives
   * @param userId - Optional user ID to avoid calling getSession (which can hang)
   * @param accessToken - Optional access token for direct API calls (bypasses Supabase JS client)
   * @returns Cached data immediately if available, otherwise fetches from API
   */
  async getFriends(onFreshData?: OnFreshData<Friend[]>, userId?: string, accessToken?: string): Promise<Friend[]> {
    console.log('[FriendsService] getFriends: Starting... userId:', !!userId, 'accessToken:', !!accessToken);
    // Check cache first
    const cached = getCache<Friend[]>(CACHE_KEYS.FRIENDS);
    const isStale = isCacheStale(CACHE_KEYS.FRIENDS);
    console.log(`[FriendsService] getFriends: Cache status - cached: ${cached !== null}, stale: ${isStale}`);

    // If we have cached data
    if (cached !== null) {
      console.log(`[FriendsService] getFriends: Returning cached data (${cached.length} friends)`);
      // If stale, trigger background refresh
      if (isStale && onFreshData) {
        this.fetchFriendsFromApi(userId, accessToken)
          .then(freshData => {
            setCache(CACHE_KEYS.FRIENDS, freshData);
            onFreshData(freshData);
          })
          .catch(err => {
            console.error('Background friends refresh failed:', err);
          });
      }
      // Return cached data immediately
      return cached;
    }

    // No cache - fetch from API
    console.log('[FriendsService] getFriends: No cache, fetching from API...');
    try {
      const friends = await this.fetchFriendsFromApi(userId, accessToken);
      console.log(`[FriendsService] getFriends: Fetched ${friends.length} friends, caching...`);
      setCache(CACHE_KEYS.FRIENDS, friends);
      return friends;
    } catch (err) {
      console.error('[FriendsService] getFriends: Failed to fetch:', err);
      return [];
    }
  }

  async searchUserByFriendCode(friendCode: string): Promise<Friend | null> {
    const supabase = getSupabase();
    if (!supabase) {
      return null;
    }

    try {
      const {data: profile, error} = await supabase
        .from('profiles')
        .select('*')
        .eq('friend_code', friendCode.toUpperCase())
        .single();

      if (error || !profile) {
        return null;
      }

      // Transform to Friend type (simplified)
      return {
        id: profile.user_id,
        name: profile.display_name,
        letter: profile.display_name.charAt(0).toUpperCase(),
        friendCode: profile.friend_code,
        streak: 0,
        lastPlayed: 'inactive',
        stats: {
          played: 0,
          won: 0,
          winRate: 0,
          avgGuesses: 0,
          maxStreak: 0,
        },
        h2h: {yourWins: 0, theirWins: 0},
      } as Friend;
    } catch {
      return null;
    }
  }

  async sendFriendRequest(toUserId: string): Promise<void> {
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

      await supabase.from('friend_requests').insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        status: 'pending',
      });
    } catch (err) {
      console.error('Failed to send friend request:', err);
    }
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    try {
      // Call the helper function
      await supabase.rpc('accept_friend_request', {p_request_id: requestId});
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    }
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    try {
      await supabase
        .from('friend_requests')
        .update({status: 'declined'})
        .eq('id', requestId);
    } catch (err) {
      console.error('Failed to decline friend request:', err);
    }
  }

  async getIncomingRequests(): Promise<FriendRequest[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const user = session.user;

      const {data: requests, error} = await supabase
        .from('friend_requests')
        .select('*, profiles!friend_requests_from_user_id_fkey(*)')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');

      if (error || !requests) {
        return [];
      }

      // Transform to FriendRequest type (simplified)
      return [];
    } catch {
      return [];
    }
  }

  async getOutgoingRequests(): Promise<FriendRequest[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const user = session.user;

      const {data: requests, error} = await supabase
        .from('friend_requests')
        .select('*, profiles!friend_requests_to_user_id_fkey(*)')
        .eq('from_user_id', user.id)
        .eq('status', 'pending');

      if (error || !requests) {
        return [];
      }

      // Transform to FriendRequest type (simplified)
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Internal method to fetch global leaderboard from API (no caching)
   * Uses directRpc to bypass Supabase JS client's blocking auth handling
   * @param userId - Optional user ID to avoid calling getSession (which can hang during token refresh)
   * @param accessToken - Optional access token for direct API calls (fast path)
   */
  private async fetchGlobalLeaderboardFromApi(limit: number, userId?: string, accessToken?: string): Promise<Friend[]> {
    console.log('[FriendsService] fetchGlobalLeaderboardFromApi: Starting... userId:', !!userId, 'accessToken:', !!accessToken);

    // FAST PATH: Use directRpc if we have both userId and accessToken
    if (userId && accessToken) {
      console.log('[FriendsService] fetchGlobalLeaderboardFromApi: Using direct RPC (fast path)...');
      const {data, error} = await directRpc<any[]>({
        functionName: 'get_leaderboard',
        params: {
          p_user_id: userId,
          p_friends_only: false,
          p_period: 'alltime',
          p_limit: limit,
        },
        accessToken,
        timeoutMs: 8000,
      });

      if (error) {
        console.error('[FriendsService] fetchGlobalLeaderboardFromApi: Direct RPC error:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('[FriendsService] fetchGlobalLeaderboardFromApi: No leaderboard data returned');
        return [];
      }

      console.log(`[FriendsService] fetchGlobalLeaderboardFromApi: Got ${data.length} users`);

      // Fetch today's results using direct query
      const userIds = data.map((row: any) => row.user_id);
      const todayResults = await this.getTodayResults(userIds, accessToken);

      // Transform to Friend type
      return data.map((row: any) => {
        const todayResult = todayResults.get(row.user_id);
        return {
          id: row.user_id,
          name: row.display_name || row.username,
          letter: (row.display_name || row.username).charAt(0).toUpperCase(),
          friendCode: row.friend_code,
          streak: row.current_streak || 0,
          lastPlayed: todayResult ? 'today' : 'inactive',
          todayResult: todayResult
            ? {
                won: todayResult.won,
                guesses: todayResult.guesses,
                feedback: todayResult.feedback,
              }
            : undefined,
          stats: {
            played: row.games_played || 0,
            won: row.games_won || 0,
            winRate: safeNumber(row.win_rate),
            avgGuesses: safeNumber(row.avg_guesses),
            maxStreak: row.max_streak || 0,
          },
          h2h: {yourWins: 0, theirWins: 0},
        };
      });
    }

    // SLOW PATH: Fall back to Supabase JS client (may hang)
    console.log('[FriendsService] fetchGlobalLeaderboardFromApi: Using Supabase JS client (slow fallback)...');
    const supabase = getSupabase();
    if (!supabase) {
      console.log('[FriendsService] fetchGlobalLeaderboardFromApi: No supabase client');
      return [];
    }

    // If userId was passed, use it directly (avoids getSession which can hang)
    let finalUserId = userId;
    if (!finalUserId) {
      console.log('[FriendsService] fetchGlobalLeaderboardFromApi: No userId passed, getting session...');
      const session = await this.getSessionWithTimeout(supabase);
      if (!session?.user) {
        console.log('[FriendsService] fetchGlobalLeaderboardFromApi: No session/user (timed out or not signed in)');
        return [];
      }
      finalUserId = session.user.id;
    }

    console.log('[FriendsService] fetchGlobalLeaderboardFromApi: Calling supabase.rpc (may hang)...');
    const {data, error} = await supabase.rpc('get_leaderboard', {
      p_user_id: finalUserId,
      p_friends_only: false,
      p_period: 'alltime',
      p_limit: limit,
    });

    if (error) {
      console.error('[FriendsService] fetchGlobalLeaderboardFromApi: RPC error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[FriendsService] fetchGlobalLeaderboardFromApi: No data returned');
      return [];
    }

    console.log(`[FriendsService] fetchGlobalLeaderboardFromApi: Got ${data.length} users`);

    const userIds = data.map((row: any) => row.user_id);
    const todayResults = await this.getTodayResults(userIds);

    return data.map((row: any) => {
      const todayResult = todayResults.get(row.user_id);
      return {
        id: row.user_id,
        name: row.display_name || row.username,
        letter: (row.display_name || row.username).charAt(0).toUpperCase(),
        friendCode: row.friend_code,
        streak: row.current_streak || 0,
        lastPlayed: todayResult ? 'today' : 'inactive',
        todayResult: todayResult
          ? {
              won: todayResult.won,
              guesses: todayResult.guesses,
              feedback: todayResult.feedback,
            }
          : undefined,
        stats: {
          played: row.games_played || 0,
          won: row.games_won || 0,
          winRate: safeNumber(row.win_rate),
          avgGuesses: safeNumber(row.avg_guesses),
          maxStreak: row.max_streak || 0,
        },
        h2h: {yourWins: 0, theirWins: 0},
      };
    });
  }

  /**
   * Get global leaderboard with stale-while-revalidate caching
   *
   * @param limit - Max number of users to return
   * @param onFreshData - Optional callback for when fresh data arrives
   * @param userId - Optional user ID to avoid calling getSession (which can hang)
   * @param accessToken - Optional access token for direct API calls (bypasses Supabase JS client)
   * @returns Cached data immediately if available, otherwise fetches from API
   */
  async getGlobalLeaderboard(
    limit = 20,
    onFreshData?: OnFreshData<Friend[]>,
    userId?: string,
    accessToken?: string,
  ): Promise<Friend[]> {
    console.log('[FriendsService] getGlobalLeaderboard: Starting... userId:', !!userId, 'accessToken:', !!accessToken);
    // Check cache first
    const cached = getCache<Friend[]>(CACHE_KEYS.GLOBAL_LEADERBOARD);
    const isStale = isCacheStale(CACHE_KEYS.GLOBAL_LEADERBOARD);
    console.log(`[FriendsService] getGlobalLeaderboard: Cache status - cached: ${cached !== null}, stale: ${isStale}`);

    // If we have cached data
    if (cached !== null) {
      console.log(`[FriendsService] getGlobalLeaderboard: Returning cached data (${cached.length} users)`);
      // If stale, trigger background refresh
      if (isStale && onFreshData) {
        this.fetchGlobalLeaderboardFromApi(limit, userId, accessToken)
          .then(freshData => {
            setCache(CACHE_KEYS.GLOBAL_LEADERBOARD, freshData);
            onFreshData(freshData);
          })
          .catch(err => {
            console.error('Background global leaderboard refresh failed:', err);
          });
      }
      // Return cached data immediately (sliced to limit)
      return cached.slice(0, limit);
    }

    // No cache - fetch from API
    console.log('[FriendsService] getGlobalLeaderboard: No cache, fetching from API...');
    try {
      const leaderboard = await this.fetchGlobalLeaderboardFromApi(limit, userId, accessToken);
      console.log(`[FriendsService] getGlobalLeaderboard: Fetched ${leaderboard.length} users, caching...`);
      setCache(CACHE_KEYS.GLOBAL_LEADERBOARD, leaderboard);
      return leaderboard;
    } catch (err) {
      console.error('[FriendsService] getGlobalLeaderboard: Failed to fetch:', err);
      return [];
    }
  }

  async getFriendsLeaderboard(): Promise<Friend[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      // Use getSession() - cached locally, no network call
      const {data: {session}} = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const user = session.user;

      const {data, error} = await supabase.rpc('get_leaderboard', {
        p_user_id: user.id,
        p_friends_only: true,
        p_period: 'today',
        p_limit: 50,
      });

      if (error || !data) {
        return [];
      }

      // Fetch today's results for these users
      const userIds = data.map((row: any) => row.user_id);
      const todayResults = await this.getTodayResults(userIds);

      // Transform to Friend type
      return data.map((row: any) => {
        const todayResult = todayResults.get(row.user_id);
        return {
          id: row.user_id,
          name: row.display_name || row.username,
          letter: (row.display_name || row.username).charAt(0).toUpperCase(),
          friendCode: row.friend_code,
          streak: row.current_streak || 0,
          lastPlayed: todayResult ? 'today' : 'inactive',
          todayResult: todayResult
            ? {
                won: todayResult.won,
                guesses: todayResult.guesses,
                feedback: todayResult.feedback,
              }
            : undefined,
          stats: {
            played: row.games_played || 0,
            won: row.games_won || 0,
            winRate: safeNumber(row.win_rate),
            avgGuesses: safeNumber(row.avg_guesses),
            maxStreak: row.max_streak || 0,
          },
          h2h: {yourWins: 0, theirWins: 0}, // Will be populated separately
        };
      });
    } catch (err) {
      console.error('Failed to fetch friends leaderboard:', err);
      return [];
    }
  }
}

/**
 * Get the appropriate friends service based on environment
 */
export function getFriendsService(): IFriendsService {
  return isDevelopment
    ? new MockFriendsService()
    : new SupabaseFriendsService();
}

export const friendsService = getFriendsService();



