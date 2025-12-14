/**
 * Tests for useHomeScreenData hook
 *
 * Tests the aggregation of HomeScreen data including:
 * - Screen state derivation (loading, not_started, in_progress, completed)
 * - Leaderboard type selection (friends vs global)
 * - Leaderboard entry building and ranking
 * - Error handling and offline detection
 * - Refresh and abandon game actions
 */

// Mock all dependencies BEFORE imports
jest.mock('../../storage/mmkv', () => ({
  kv: {
    getString: jest.fn(),
    set: jest.fn(),
  },
  getJSON: jest.fn(),
  setJSON: jest.fn(),
}));

jest.mock('../../storage/userScope', () => ({
  getScopedKey: jest.fn(),
  getCurrentUserId: jest.fn(),
}));

jest.mock('../../contexts/AuthContext');
jest.mock('../useUserStats');
jest.mock('../../services/data/friendsService');
jest.mock('../../services/data/homeService');
jest.mock('../../storage/dailyCompletion');

import {renderHook, waitFor} from '@testing-library/react-native';
import {useHomeScreenData} from '../useHomeScreenData';
import {useAuth} from '../../contexts/AuthContext';
import {useUserStats} from '../useUserStats';
import {friendsService} from '../../services/data/friendsService';
import {
  getHomeGameSummary,
  abandonGame as abandonGameService,
} from '../../services/data/homeService';
import {isDailyCompleted} from '../../storage/dailyCompletion';
import {HomeGameSummary} from '../../screens/HomeScreen/types';
import {Friend} from '../../data/mockFriends';
import {TileState} from '../../logic/evaluateGuess';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUserStats = useUserStats as jest.MockedFunction<typeof useUserStats>;
const mockGetFriends = friendsService.getFriends as jest.MockedFunction<
  typeof friendsService.getFriends
>;
const mockGetGlobalLeaderboard =
  friendsService.getGlobalLeaderboard as jest.MockedFunction<
    typeof friendsService.getGlobalLeaderboard
  >;
const mockGetHomeGameSummary = getHomeGameSummary as jest.MockedFunction<
  typeof getHomeGameSummary
>;
const mockIsDailyCompleted = isDailyCompleted as jest.MockedFunction<
  typeof isDailyCompleted
>;
const mockAbandonGameService = abandonGameService as jest.MockedFunction<
  typeof abandonGameService
>;

describe('useHomeScreenData', () => {
  // Test data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'TestUser',
  };

  const mockAccessToken = 'mock-token-123';

  const mockUserStats = {
    played: 50,
    won: 40,
    winRate: 80,
    currentStreak: 5,
    maxStreak: 10,
    avgGuesses: 3.5,
  };

  const mockFriends: Friend[] = [
    {
      id: 'friend-1',
      name: 'Alice',
      letter: 'A',
      friendCode: 'AAAA-1111',
      streak: 10,
      lastPlayed: 'today',
      todayResult: {won: true, guesses: 3},
      stats: {played: 100, won: 80, winRate: 80, avgGuesses: 3.2, maxStreak: 15},
      h2h: {yourWins: 10, theirWins: 8},
    },
    {
      id: 'friend-2',
      name: 'Bob',
      letter: 'B',
      friendCode: 'BBBB-2222',
      streak: 5,
      lastPlayed: 'today',
      todayResult: {won: true, guesses: 4},
      stats: {played: 80, won: 60, winRate: 75, avgGuesses: 3.8, maxStreak: 12},
      h2h: {yourWins: 5, theirWins: 7},
    },
    {
      id: 'friend-3',
      name: 'Charlie',
      letter: 'C',
      friendCode: 'CCCC-3333',
      streak: 8,
      lastPlayed: 'today',
      todayResult: {won: true, guesses: 5},
      stats: {played: 120, won: 100, winRate: 83, avgGuesses: 3.4, maxStreak: 20},
      h2h: {yourWins: 15, theirWins: 10},
    },
  ];

  const mockGlobalUsers: Friend[] = [
    {
      id: 'global-1',
      name: 'GlobalUser1',
      letter: 'G',
      friendCode: 'GGGG-1111',
      streak: 15,
      lastPlayed: 'today',
      todayResult: {won: true, guesses: 2},
      stats: {played: 200, won: 180, winRate: 90, avgGuesses: 3.0, maxStreak: 30},
      h2h: {yourWins: 0, theirWins: 0},
    },
    {
      id: 'global-2',
      name: 'GlobalUser2',
      letter: 'G',
      friendCode: 'GGGG-2222',
      streak: 12,
      lastPlayed: 'today',
      todayResult: {won: true, guesses: 4},
      stats: {played: 150, won: 130, winRate: 87, avgGuesses: 3.3, maxStreak: 25},
      h2h: {yourWins: 0, theirWins: 0},
    },
  ];

  const mockGameSummaryInProgress: HomeGameSummary = {
    mode: 'daily',
    status: 'playing',
    length: 5,
    maxRows: 6,
    dateISO: '2025-01-15',
    guessesUsed: 2,
    feedback: [
      ['absent', 'present', 'absent', 'absent', 'correct'] as TileState[],
      ['correct', 'absent', 'present', 'absent', 'absent'] as TileState[],
    ],
  };

  const mockGameSummaryWon: HomeGameSummary = {
    mode: 'daily',
    status: 'won',
    length: 5,
    maxRows: 6,
    dateISO: '2025-01-15',
    guessesUsed: 3,
    feedback: [
      ['absent', 'present', 'absent', 'absent', 'correct'] as TileState[],
      ['correct', 'absent', 'present', 'absent', 'absent'] as TileState[],
      ['correct', 'correct', 'correct', 'correct', 'correct'] as TileState[],
    ],
  };

  const mockGameSummaryLost: HomeGameSummary = {
    mode: 'daily',
    status: 'lost',
    length: 5,
    maxRows: 6,
    dateISO: '2025-01-15',
    guessesUsed: 6,
    feedback: [
      ['absent', 'present', 'absent', 'absent', 'correct'] as TileState[],
      ['correct', 'absent', 'present', 'absent', 'absent'] as TileState[],
      ['absent', 'correct', 'absent', 'present', 'absent'] as TileState[],
      ['present', 'absent', 'correct', 'absent', 'absent'] as TileState[],
      ['absent', 'present', 'absent', 'correct', 'absent'] as TileState[],
      ['correct', 'absent', 'absent', 'absent', 'present'] as TileState[],
    ],
  };

  // Helper to get today's date in ISO format
  const getTodayISO = () => new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      session: null,
      user: mockUser,
      accessToken: mockAccessToken,
      loading: false,
      isAuthenticated: true,
      isDevelopmentMode: false,
      signOut: jest.fn(),
    });

    mockUseUserStats.mockReturnValue(mockUserStats);

    mockGetFriends.mockResolvedValue(mockFriends);
    mockGetGlobalLeaderboard.mockResolvedValue(mockGlobalUsers);
    mockGetHomeGameSummary.mockReturnValue(null);
    mockIsDailyCompleted.mockReturnValue(false);
    mockAbandonGameService.mockResolvedValue(undefined);
  });

  describe('Screen State Derivation', () => {
    it('should return loading state initially', () => {
      const {result} = renderHook(() => useHomeScreenData());

      expect(result.current.screenState).toBe('loading');
    });

    it('should return not_started when no game summary and daily not completed', async () => {
      mockGetHomeGameSummary.mockReturnValue(null);
      mockIsDailyCompleted.mockReturnValue(false);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).toBe('not_started');
      });
    });

    it('should return in_progress when game summary has status playing', async () => {
      mockGetHomeGameSummary.mockReturnValue(mockGameSummaryInProgress);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).toBe('in_progress');
      });
    });

    it('should return completed when daily is completed via storage', async () => {
      mockGetHomeGameSummary.mockReturnValue(null);
      mockIsDailyCompleted.mockReturnValue(true);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).toBe('completed');
      });

      // Verify isDailyCompleted was called with correct params
      expect(mockIsDailyCompleted).toHaveBeenCalledWith(5, 6, getTodayISO());
    });

    it('should return completed when game summary shows won for today', async () => {
      const todayISO = getTodayISO();
      const wonToday: HomeGameSummary = {
        ...mockGameSummaryWon,
        dateISO: todayISO,
      };

      mockGetHomeGameSummary.mockReturnValue(wonToday);
      mockIsDailyCompleted.mockReturnValue(false);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).toBe('completed');
      });
    });

    it('should return completed when game summary shows lost for today', async () => {
      const todayISO = getTodayISO();
      const lostToday: HomeGameSummary = {
        ...mockGameSummaryLost,
        dateISO: todayISO,
      };

      mockGetHomeGameSummary.mockReturnValue(lostToday);
      mockIsDailyCompleted.mockReturnValue(false);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).toBe('completed');
      });
    });

    it('should return not_started for won game from previous day', async () => {
      const yesterdayISO = '2025-01-14';
      const wonYesterday: HomeGameSummary = {
        ...mockGameSummaryWon,
        dateISO: yesterdayISO,
      };

      mockGetHomeGameSummary.mockReturnValue(wonYesterday);
      mockIsDailyCompleted.mockReturnValue(false);

      const {result} = renderHook(() => useHomeScreenData());

      // Won game from yesterday doesn't count as today's completion
      // So state should be not_started (can start new daily)
      await waitFor(() => {
        expect(result.current.screenState).toBe('not_started');
      });
    });
  });

  describe('Leaderboard Type Selection', () => {
    it('should use friends leaderboard when >= 3 friends', async () => {
      mockGetFriends.mockResolvedValue(mockFriends); // 3 friends

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardType).toBe('friends');
      });

      // Should not fetch global leaderboard
      expect(mockGetGlobalLeaderboard).not.toHaveBeenCalled();
    });

    it('should use global leaderboard when < 3 friends', async () => {
      const twoFriends = mockFriends.slice(0, 2);
      mockGetFriends.mockResolvedValue(twoFriends);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardType).toBe('global');
      });

      // Should fetch global leaderboard
      expect(mockGetGlobalLeaderboard).toHaveBeenCalledWith(
        10,
        undefined,
        mockUser.id,
        mockAccessToken,
      );
    });

    it('should use global leaderboard when 0 friends', async () => {
      mockGetFriends.mockResolvedValue([]);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardType).toBe('global');
      });

      expect(mockGetGlobalLeaderboard).toHaveBeenCalled();
    });
  });

  describe('Leaderboard Entries', () => {
    it('should build entries from friends when leaderboardType is friends', async () => {
      mockGetFriends.mockResolvedValue(mockFriends);
      mockGetHomeGameSummary.mockReturnValue(mockGameSummaryWon);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toHaveLength(3);
      });

      const entries = result.current.leaderboardEntries;

      // User with 3 guesses ties with Alice (3 guesses)
      // User ranks based on their position among all players
      // Top scorers: Alice (3), Bob (4), Charlie (5)
      // User with 3 guesses ties for rank 1 with Alice
      expect(entries[0]).toMatchObject({
        id: 'current-user',
        name: 'You',
        guesses: 3,
        isUser: true,
        rank: 1,
      });

      expect(entries[1]).toMatchObject({
        id: 'friend-1',
        name: 'Alice',
        guesses: 3,
        isUser: false,
        rank: 2,
      });

      expect(entries[2]).toMatchObject({
        id: 'friend-2',
        name: 'Bob',
        guesses: 4,
        isUser: false,
        rank: 3,
      });
    });

    it('should build entries from global users when leaderboardType is global', async () => {
      mockGetFriends.mockResolvedValue([]); // 0 friends
      mockGetGlobalLeaderboard.mockResolvedValue(mockGlobalUsers);
      mockGetHomeGameSummary.mockReturnValue(mockGameSummaryWon);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardType).toBe('global');
      });

      const entries = result.current.leaderboardEntries;

      // Should use global users
      // GlobalUser1 (2 guesses), User (3 guesses), GlobalUser2 (4 guesses)
      expect(entries[0]).toMatchObject({
        id: 'global-1',
        name: 'GlobalUser1',
        guesses: 2,
      });

      expect(entries[1]).toMatchObject({
        id: 'current-user',
        name: 'You',
        guesses: 3,
      });

      expect(entries[2]).toMatchObject({
        id: 'global-2',
        name: 'GlobalUser2',
        guesses: 4,
      });
    });

    it('should include user in top 2 if they rank there', async () => {
      mockGetFriends.mockResolvedValue(mockFriends);
      // User with 2 guesses (better than all friends)
      const wonWithTwoGuesses: HomeGameSummary = {
        ...mockGameSummaryWon,
        guessesUsed: 2,
      };
      mockGetHomeGameSummary.mockReturnValue(wonWithTwoGuesses);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toHaveLength(3);
      });

      const entries = result.current.leaderboardEntries;

      // User should be rank 1
      expect(entries[0]).toMatchObject({
        id: 'current-user',
        name: 'You',
        guesses: 2,
        isUser: true,
        rank: 1,
      });

      // Alice should be rank 2
      expect(entries[1]).toMatchObject({
        id: 'friend-1',
        name: 'Alice',
        guesses: 3,
        rank: 2,
      });

      // Bob should be rank 3
      expect(entries[2]).toMatchObject({
        id: 'friend-2',
        name: 'Bob',
        guesses: 4,
        rank: 3,
      });
    });

    it('should show user with null guesses when they have not played', async () => {
      mockGetFriends.mockResolvedValue(mockFriends);
      mockGetHomeGameSummary.mockReturnValue(null); // No game played

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toHaveLength(3);
      });

      const userEntry = result.current.leaderboardEntries.find(e => e.isUser);

      expect(userEntry).toMatchObject({
        id: 'current-user',
        name: 'You',
        guesses: null,
        isUser: true,
        rank: 3, // After top 2
      });
    });

    it('should show user with null guesses when game is in progress', async () => {
      mockGetFriends.mockResolvedValue(mockFriends);
      mockGetHomeGameSummary.mockReturnValue(mockGameSummaryInProgress);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toHaveLength(3);
      });

      const userEntry = result.current.leaderboardEntries.find(e => e.isUser);

      expect(userEntry).toMatchObject({
        guesses: null, // In-progress game doesn't count
        isUser: true,
      });
    });

    it('should filter out friends who have not played today', async () => {
      const friendsWithInactive: Friend[] = [
        ...mockFriends,
        {
          id: 'friend-4',
          name: 'Dave',
          letter: 'D',
          friendCode: 'DDDD-4444',
          streak: 0,
          lastPlayed: 'inactive',
          // No todayResult
          stats: {played: 10, won: 5, winRate: 50, avgGuesses: 4.0, maxStreak: 3},
          h2h: {yourWins: 2, theirWins: 3},
        },
      ];

      mockGetFriends.mockResolvedValue(friendsWithInactive);
      mockGetHomeGameSummary.mockReturnValue(null);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toBeDefined();
      });

      const entries = result.current.leaderboardEntries;

      // Should only have the 3 friends who played + user
      // But limited to top 2 + user = 3 total
      expect(entries).toHaveLength(3);

      // Dave should not be in the list
      expect(entries.find(e => e.name === 'Dave')).toBeUndefined();
    });

    it('should use first letter of display name for user letter', async () => {
      mockGetFriends.mockResolvedValue([]);
      mockGetGlobalLeaderboard.mockResolvedValue([]);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toBeDefined();
      });

      const userEntry = result.current.leaderboardEntries.find(e => e.isUser);

      expect(userEntry?.letter).toBe('T'); // First letter of 'TestUser'
    });

    it('should use Y as default letter when displayName is undefined', async () => {
      mockUseAuth.mockReturnValue({
        session: null,
        user: {...mockUser, displayName: undefined},
        accessToken: mockAccessToken,
        loading: false,
        isAuthenticated: true,
        isDevelopmentMode: false,
        signOut: jest.fn(),
      });

      mockGetFriends.mockResolvedValue([]);
      mockGetGlobalLeaderboard.mockResolvedValue([]);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toBeDefined();
      });

      const userEntry = result.current.leaderboardEntries.find(e => e.isUser);

      expect(userEntry?.letter).toBe('Y');
    });
  });

  describe('User Stats Integration', () => {
    it('should expose stats from useUserStats', async () => {
      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).not.toBe('loading');
      });

      expect(result.current.streak).toBe(mockUserStats.currentStreak);
      expect(result.current.winRate).toBe(mockUserStats.winRate);
      expect(result.current.avgGuesses).toBe(mockUserStats.avgGuesses);
      expect(result.current.gamesPlayed).toBe(mockUserStats.played);
    });
  });

  describe('Error Handling', () => {
    it('should set error when getFriends fails', async () => {
      const testError = new Error('Failed to fetch friends');
      mockGetFriends.mockRejectedValue(testError);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.error).toEqual(testError);
      });
    });

    it('should set isOffline true on network errors', async () => {
      const networkError = new Error('Network request failed');
      mockGetFriends.mockRejectedValue(networkError);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });
    });

    it('should set isOffline true on fetch errors', async () => {
      const fetchError = new Error('Fetch timeout exceeded');
      mockGetFriends.mockRejectedValue(fetchError);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });
    });

    it('should set isOffline true on timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockGetFriends.mockRejectedValue(timeoutError);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });
    });

    it('should set isOffline false for non-network errors', async () => {
      const otherError = new Error('Invalid data format');
      mockGetFriends.mockRejectedValue(otherError);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });
    });

    it('should still return valid data when getGlobalLeaderboard fails', async () => {
      mockGetFriends.mockResolvedValue([]); // < 3 friends
      mockGetGlobalLeaderboard.mockRejectedValue(
        new Error('Global leaderboard unavailable'),
      );

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Should still have valid state
      expect(result.current.screenState).toBeDefined();
      expect(result.current.leaderboardType).toBe('global');
    });
  });

  describe('Refresh Action', () => {
    it('should re-fetch data when refresh is called', async () => {
      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).not.toBe('loading');
      });

      // Initial fetch
      expect(mockGetFriends).toHaveBeenCalledTimes(1);

      // Clear and update mocks
      mockGetFriends.mockClear();
      mockGetFriends.mockResolvedValue([...mockFriends]);

      // Call refresh
      await result.current.refresh();

      // Should trigger new fetch
      await waitFor(() => {
        expect(mockGetFriends).toHaveBeenCalledTimes(1);
      });
    });

    it('should update game summary after refresh', async () => {
      mockGetHomeGameSummary.mockReturnValue(null);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.gameSummary).toBeNull();
      });

      // Update mock to return a game summary
      mockGetHomeGameSummary.mockReturnValue(mockGameSummaryInProgress);

      // Refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.gameSummary).toEqual(mockGameSummaryInProgress);
      });
    });

    it('should clear previous errors on refresh', async () => {
      const testError = new Error('Initial error');
      mockGetFriends.mockRejectedValueOnce(testError);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.error).toEqual(testError);
      });

      // Next fetch succeeds
      mockGetFriends.mockResolvedValue(mockFriends);

      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Abandon Game Action', () => {
    it('should call abandonGameService when abandonGame is invoked', async () => {
      mockGetHomeGameSummary.mockReturnValue(mockGameSummaryInProgress);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.gameSummary).toEqual(mockGameSummaryInProgress);
      });

      await result.current.abandonGame();

      expect(mockAbandonGameService).toHaveBeenCalledWith(
        mockGameSummaryInProgress,
      );
    });

    it('should refresh data after abandoning game', async () => {
      mockGetHomeGameSummary.mockReturnValue(mockGameSummaryInProgress);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).toBe('in_progress');
      });

      // Clear the game summary after abandon
      mockGetHomeGameSummary.mockReturnValue(null);
      mockGetFriends.mockClear();

      await result.current.abandonGame();

      // Should re-fetch friends
      await waitFor(() => {
        expect(mockGetFriends).toHaveBeenCalledTimes(1);
      });

      // Game summary should be cleared
      expect(result.current.gameSummary).toBeNull();
    });

    it('should do nothing when abandonGame is called with no game summary', async () => {
      mockGetHomeGameSummary.mockReturnValue(null);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.gameSummary).toBeNull();
      });

      await result.current.abandonGame();

      expect(mockAbandonGameService).not.toHaveBeenCalled();
    });

    it('should update screen state after abandoning', async () => {
      mockGetHomeGameSummary.mockReturnValueOnce(mockGameSummaryInProgress);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).toBe('in_progress');
      });

      // After abandon, no game exists
      mockGetHomeGameSummary.mockReturnValue(null);
      mockIsDailyCompleted.mockReturnValue(false);

      await result.current.abandonGame();

      await waitFor(() => {
        expect(result.current.screenState).toBe('not_started');
      });
    });
  });

  describe('Auth Integration', () => {
    it('should pass user id and access token to friendsService', async () => {
      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).not.toBe('loading');
      });

      expect(mockGetFriends).toHaveBeenCalledWith(
        undefined,
        mockUser.id,
        mockAccessToken,
      );
    });

    it('should handle undefined user gracefully', async () => {
      mockUseAuth.mockReturnValue({
        session: null,
        user: null,
        accessToken: null,
        loading: false,
        isAuthenticated: false,
        isDevelopmentMode: false,
        signOut: jest.fn(),
      });

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.screenState).not.toBe('loading');
      });

      expect(mockGetFriends).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty leaderboard source', async () => {
      mockGetFriends.mockResolvedValue([]);
      mockGetGlobalLeaderboard.mockResolvedValue([]);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardEntries).toBeDefined();
      });

      // Should only have user entry
      expect(result.current.leaderboardEntries).toHaveLength(1);
      expect(result.current.leaderboardEntries[0].isUser).toBe(true);
    });

    it('should handle exactly 3 friends', async () => {
      mockGetFriends.mockResolvedValue(mockFriends); // Exactly 3

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.leaderboardType).toBe('friends');
      });

      expect(mockGetGlobalLeaderboard).not.toHaveBeenCalled();
    });

    it('should handle game summary with missing feedback', async () => {
      const summaryNoFeedback: HomeGameSummary = {
        ...mockGameSummaryWon,
        feedback: [],
      };

      mockGetHomeGameSummary.mockReturnValue(summaryNoFeedback);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        expect(result.current.gameSummary).toEqual(summaryNoFeedback);
      });

      // Should not crash
      expect(result.current.screenState).toBeDefined();
    });

    it('should handle free play game (not daily)', async () => {
      const freePlayGame: HomeGameSummary = {
        mode: 'free',
        status: 'playing',
        length: 6,
        maxRows: 8,
        dateISO: getTodayISO(),
        guessesUsed: 3,
        feedback: [],
      };

      mockGetHomeGameSummary.mockReturnValue(freePlayGame);

      const {result} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        // Free play in progress should show as in_progress
        expect(result.current.screenState).toBe('in_progress');
      });

      // Free play won/lost doesn't mark as completed for daily purposes
      const freePlayWon: HomeGameSummary = {
        ...freePlayGame,
        status: 'won',
      };

      mockGetHomeGameSummary.mockReturnValue(freePlayWon);

      const {result: result2} = renderHook(() => useHomeScreenData());

      await waitFor(() => {
        // Free play won shows as not_started because it's not a daily completion
        // The screen is asking "has today's daily been completed?" - answer is no
        expect(result2.current.screenState).toBe('not_started');
      });
    });
  });
});
