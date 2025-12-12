import React, {useState, useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../../theme/colors';
import {ChevronLeft, PlusIcon} from '../../components/icons/SettingsIcons';
import {Friend} from '../../data/mockFriends';
import {friendsService} from '../../services/data';
import {useUserTodayResult, useUserStats} from '../../hooks';
import {useAuth} from '../../contexts/AuthContext';
import {withTimeout, DEFAULT_TIMEOUT} from '../../services/utils/timeout';

import SegmentControl, {Period} from './SegmentControl';
import {Scope} from './ScopeToggle';
import TodayCard from './TodayCard';
import NotPlayedCard from './NotPlayedCard';
import AllTimeCard from './AllTimeCard';
import WeekCard from './WeekCard';
import Leaderboard from './Leaderboard';
import HeadToHeadModal from './HeadToHeadModal';
import AddFriendsModal from './AddFriendsModal';

type Props = {
  onBack: () => void;
  onPlayNow?: () => void;
};

export default function FriendsScreen({
  onBack,
  onPlayNow,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [selectedScope, setSelectedScope] = useState<Scope>('friends');
  const [showH2H, setShowH2H] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false); // Start false - show UI immediately
  const [error, setError] = useState<string | null>(null);

  // Get user from auth context - this avoids calling getSession which can hang
  const {user, accessToken} = useAuth();
  const userId = user?.id;

  // Get actual user data from hooks
  const userTodayResult = useUserTodayResult();
  const userStats = useUserStats();

  // Derive played status from actual result data (single source of truth)
  const userPlayedToday = !!userTodayResult;

  // Load friends on mount or when userId changes
  useEffect(() => {
    if (userId) {
      loadFriends();
    }
  }, [userId]);

  const loadFriends = useCallback(async () => {
    if (!userId) {
      console.log('[FriendsScreen] loadFriends: No userId, skipping');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Use stale-while-revalidate pattern
      // If cached data exists, it returns immediately
      // Fresh data callback updates state when API responds
      // Pass userId and accessToken for direct API calls (bypasses Supabase JS client)
      const friendsData = await withTimeout(
        friendsService.getFriends(freshData => {
          // Called when fresh data arrives (background refresh)
          setFriends(freshData);
        }, userId, accessToken ?? undefined),
        DEFAULT_TIMEOUT,
        'Loading friends timed out',
      );
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to load friends:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load friends',
      );
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken]);

  const handleFriendPress = useCallback((friend: Friend) => {
    setSelectedFriend(friend);
    setShowH2H(true);
  }, []);

  const handleCloseH2H = useCallback(() => {
    setShowH2H(false);
    setSelectedFriend(null);
  }, []);

  // Get friends who played today
  const friendsPlayedToday = friends.filter(f => f.lastPlayed === 'today');
  const friendsWaiting = friends.filter(f => f.lastPlayed !== 'today');

  // Calculate user rank for today (based on guesses - lower is better)
  const userRank =
    userPlayedToday && userTodayResult
      ? friendsPlayedToday.filter(
          f =>
            f.todayResult &&
            f.todayResult.guesses < userTodayResult.guesses,
        ).length + 1
      : 0;

  // Calculate user rank for all-time (based on win rate - higher is better)
  const allTimeRank =
    friends.filter(f => f.stats.winRate > userStats.winRate).length + 1;

  // Always show the UI - loading/error handled inline by child components
  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <ChevronLeft size={22} color={palette.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Compete</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddFriends(true)}>
          <PlusIcon size={18} color={palette.textMuted} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Today Card - Different based on play state */}
        {selectedPeriod === 'today' && userPlayedToday && userTodayResult && (
          <TodayCard
            userRank={userRank}
            totalPlayed={friendsPlayedToday.length + 1}
            guesses={userTodayResult.guesses}
            feedback={userTodayResult.feedback}
            friendsPlayed={friendsPlayedToday}
            friendsWaiting={friendsWaiting}
          />
        )}

        {selectedPeriod === 'today' && !userPlayedToday && (
          <NotPlayedCard
            friendsPlayedCount={friendsPlayedToday.length}
            onPlayNow={onPlayNow}
          />
        )}

        {selectedPeriod === 'alltime' && (
          <AllTimeCard
            userRank={allTimeRank}
            totalFriends={friends.length}
            winRate={userStats.winRate}
            avgGuesses={userStats.avgGuesses}
          />
        )}

        {selectedPeriod === 'week' && (
          <WeekCard userRank={2} totalFriends={friends.length} />
        )}

        {/* Segment Control */}
        <SegmentControl
          selected={selectedPeriod}
          onSelect={setSelectedPeriod}
        />

        {/* Leaderboard */}
        <Leaderboard
          period={selectedPeriod}
          scope={selectedScope}
          onScopeChange={setSelectedScope}
          userPlayedToday={userPlayedToday}
          friends={friends}
          userRank={userRank}
          onFriendPress={handleFriendPress}
          friendsLoading={loading}
          friendsError={error}
          onRetryFriends={loadFriends}
          accessToken={accessToken}
        />
      </View>

      {/* H2H Modal */}
      <HeadToHeadModal
        visible={showH2H}
        friend={selectedFriend}
        onClose={handleCloseH2H}
      />

      {/* Add Friends Modal */}
      <AddFriendsModal
        visible={showAddFriends}
        onClose={() => setShowAddFriends(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  addBtn: {
    width: 36,
    height: 36,
    backgroundColor: palette.card,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
});
