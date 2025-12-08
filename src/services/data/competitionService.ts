/**
 * Competition Service
 *
 * Provides data for the CompeteCard component in StatsScreen.
 * Routes to appropriate implementation based on environment mode.
 */

import {isDevelopment} from '../../config/environment';
import {friendsService} from './friendsService';
import {getUserTodayResult} from '../../hooks/useUserTodayResult';

export interface FriendAvatar {
  id: string;
  name: string;
  letter: string;
  isFirst?: boolean;
  isYou?: boolean;
}

export interface CompetitionData {
  userRank: number;
  totalPlayed: number;
  waitingCount: number;
  topFriends: FriendAvatar[];
  userPlayedToday: boolean;
}

export interface ICompetitionService {
  getTodayCompetition(): Promise<CompetitionData>;
}

/**
 * Mock Competition Service (Dev Mode)
 * Uses mock friends data + real user's today result
 */
class MockCompetitionService implements ICompetitionService {
  async getTodayCompetition(): Promise<CompetitionData> {
    // Get friends from friendsService (which returns MOCK_FRIENDS in dev mode)
    const friends = await friendsService.getFriends();

    // Get real user's today result
    const userResult = getUserTodayResult();
    const userPlayedToday = userResult !== null;

    // Filter friends who played today
    const friendsPlayedToday = friends.filter(f => f.lastPlayed === 'today');
    const friendsWaiting = friends.filter(f => f.lastPlayed !== 'today');

    // Calculate user rank (based on guesses - lower is better)
    let userRank = 0;
    if (userPlayedToday && userResult) {
      userRank =
        friendsPlayedToday.filter(
          f => f.todayResult && f.todayResult.guesses < userResult.guesses,
        ).length + 1;
    }

    // Total played = friends who played + user (if played)
    const totalPlayed = friendsPlayedToday.length + (userPlayedToday ? 1 : 0);

    // Build top friends list (top 3 + user)
    const sortedFriends = [...friendsPlayedToday].sort((a, b) => {
      const aGuesses = a.todayResult?.guesses ?? 999;
      const bGuesses = b.todayResult?.guesses ?? 999;
      return aGuesses - bGuesses;
    });

    const topFriends: FriendAvatar[] = [];

    // Add top 3 friends, inserting user at correct position
    let userInserted = false;
    let friendIndex = 0;

    for (let i = 0; i < 3 && (friendIndex < sortedFriends.length || !userInserted); i++) {
      const currentFriend = sortedFriends[friendIndex];

      // Check if user should be inserted here
      if (
        userPlayedToday &&
        !userInserted &&
        userResult &&
        (!currentFriend ||
          userResult.guesses < (currentFriend.todayResult?.guesses ?? 999))
      ) {
        topFriends.push({
          id: 'you',
          name: 'You',
          letter: 'Y', // Will be replaced by actual user letter in component
          isYou: true,
          isFirst: topFriends.length === 0,
        });
        userInserted = true;
      } else if (currentFriend) {
        topFriends.push({
          id: currentFriend.id,
          name: currentFriend.name,
          letter: currentFriend.letter,
          isFirst: topFriends.length === 0,
        });
        friendIndex++;
      }
    }

    return {
      userRank,
      totalPlayed,
      waitingCount: friendsWaiting.length,
      topFriends,
      userPlayedToday,
    };
  }
}

/**
 * Supabase Competition Service (Prod Mode)
 * Uses real friends data from Supabase
 */
class SupabaseCompetitionService implements ICompetitionService {
  async getTodayCompetition(): Promise<CompetitionData> {
    // In prod mode, friendsService.getFriends() returns real data from Supabase
    // The logic is the same as mock, just with real data
    const friends = await friendsService.getFriends();

    const userResult = getUserTodayResult();
    const userPlayedToday = userResult !== null;

    const friendsPlayedToday = friends.filter(f => f.lastPlayed === 'today');
    const friendsWaiting = friends.filter(f => f.lastPlayed !== 'today');

    let userRank = 0;
    if (userPlayedToday && userResult) {
      userRank =
        friendsPlayedToday.filter(
          f => f.todayResult && f.todayResult.guesses < userResult.guesses,
        ).length + 1;
    }

    const totalPlayed = friendsPlayedToday.length + (userPlayedToday ? 1 : 0);

    const sortedFriends = [...friendsPlayedToday].sort((a, b) => {
      const aGuesses = a.todayResult?.guesses ?? 999;
      const bGuesses = b.todayResult?.guesses ?? 999;
      return aGuesses - bGuesses;
    });

    const topFriends: FriendAvatar[] = [];
    let userInserted = false;
    let friendIndex = 0;

    for (let i = 0; i < 3 && (friendIndex < sortedFriends.length || !userInserted); i++) {
      const currentFriend = sortedFriends[friendIndex];

      if (
        userPlayedToday &&
        !userInserted &&
        userResult &&
        (!currentFriend ||
          userResult.guesses < (currentFriend.todayResult?.guesses ?? 999))
      ) {
        topFriends.push({
          id: 'you',
          name: 'You',
          letter: 'Y',
          isYou: true,
          isFirst: topFriends.length === 0,
        });
        userInserted = true;
      } else if (currentFriend) {
        topFriends.push({
          id: currentFriend.id,
          name: currentFriend.name,
          letter: currentFriend.letter,
          isFirst: topFriends.length === 0,
        });
        friendIndex++;
      }
    }

    return {
      userRank,
      totalPlayed,
      waitingCount: friendsWaiting.length,
      topFriends,
      userPlayedToday,
    };
  }
}

/**
 * Get the appropriate competition service based on environment
 */
export function getCompetitionService(): ICompetitionService {
  return isDevelopment
    ? new MockCompetitionService()
    : new SupabaseCompetitionService();
}

export const competitionService = getCompetitionService();
