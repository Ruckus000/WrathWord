/**
 * Friends Service
 * 
 * Handles friend relationships, requests, and leaderboards.
 * Routes to appropriate implementation based on environment mode.
 */

import {isDevelopment} from '../../config/environment';
import {getSupabase} from '../supabase/client';
import {Friend} from '../../data/mockFriends';
import {MOCK_FRIENDS} from '../../data/mockFriends';
import {
  MOCK_INCOMING_REQUESTS,
  MOCK_OUTGOING_REQUESTS,
  MOCK_SEARCHABLE_USERS,
  FriendRequest,
} from '../../data/mockFriendRequests';
import {MOCK_GLOBAL_USERS} from '../../data/mockGlobalUsers';

export interface IFriendsService {
  getFriends(): Promise<Friend[]>;
  searchUserByFriendCode(friendCode: string): Promise<Friend | null>;
  sendFriendRequest(toUserId: string): Promise<void>;
  acceptFriendRequest(requestId: string): Promise<void>;
  declineFriendRequest(requestId: string): Promise<void>;
  getIncomingRequests(): Promise<FriendRequest[]>;
  getOutgoingRequests(): Promise<FriendRequest[]>;
  getGlobalLeaderboard(limit?: number): Promise<Friend[]>;
  getFriendsLeaderboard(): Promise<Friend[]>;
}

/**
 * Mock Friends Service (Dev Mode)
 * Returns hardcoded mock data
 */
class MockFriendsService implements IFriendsService {
  async getFriends(): Promise<Friend[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_FRIENDS;
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

  async getGlobalLeaderboard(limit = 20): Promise<Friend[]> {
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
 * Fetches from Supabase backend
 */
class SupabaseFriendsService implements IFriendsService {
  /**
   * Fetch today's game results for a list of users
   */
  private async getTodayResults(
    userIds: string[],
  ): Promise<Map<string, {won: boolean; guesses: number; feedback?: any}>> {
    const supabase = getSupabase();
    if (!supabase || userIds.length === 0) {
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
  async getFriends(): Promise<Friend[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      // Use the leaderboard function with friends_only to get all friend data
      // This gives us both the friend list and their stats in one query
      const {data, error} = await supabase.rpc('get_leaderboard', {
        p_user_id: user.id,
        p_friends_only: true,
        p_period: 'alltime',
        p_limit: 100, // Get all friends
      });

      if (error || !data) {
        return [];
      }

      // Fetch today's results for these friends
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
            winRate: parseFloat(row.win_rate) || 0,
            avgGuesses: parseFloat(row.avg_guesses) || 0,
            maxStreak: row.max_streak || 0,
          },
          h2h: {yourWins: 0, theirWins: 0}, // Will be populated separately if needed
        };
      });
    } catch (err) {
      console.error('Failed to fetch friends:', err);
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
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return;
      }

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
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

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
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

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

  async getGlobalLeaderboard(limit = 20): Promise<Friend[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      // Call the leaderboard function
      const {data, error} = await supabase.rpc('get_leaderboard', {
        p_user_id: user.id,
        p_friends_only: false,
        p_period: 'alltime',
        p_limit: limit,
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
            winRate: parseFloat(row.win_rate) || 0,
            avgGuesses: parseFloat(row.avg_guesses) || 0,
            maxStreak: row.max_streak || 0,
          },
          h2h: {yourWins: 0, theirWins: 0}, // Will be populated separately
        };
      });
    } catch (err) {
      console.error('Failed to fetch global leaderboard:', err);
      return [];
    }
  }

  async getFriendsLeaderboard(): Promise<Friend[]> {
    const supabase = getSupabase();
    if (!supabase) {
      return [];
    }

    try {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

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
            winRate: parseFloat(row.win_rate) || 0,
            avgGuesses: parseFloat(row.avg_guesses) || 0,
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



