import React, {useState, useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, Pressable, ActivityIndicator} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../../theme/colors';
import {ChevronLeft, PlusIcon} from '../../components/icons/SettingsIcons';
import {Friend} from '../../data/mockFriends';
import {friendsService} from '../../services/data';
import {useUserTodayResult, useUserStats} from '../../hooks';

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
  userPlayedToday?: boolean;
};

export default function FriendsScreen({
  onBack,
  onPlayNow,
  userPlayedToday = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [selectedScope, setSelectedScope] = useState<Scope>('global');
  const [showH2H, setShowH2H] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // Get actual user data from hooks
  const userTodayResult = useUserTodayResult();
  const userStats = useUserStats();

  // Load friends on mount
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const friendsData = await friendsService.getFriends();
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Calculate user rank (based on guesses - lower is better)
  const userRank =
    userPlayedToday && userTodayResult
      ? friendsPlayedToday.filter(
          f =>
            f.todayResult &&
            f.todayResult.guesses < userTodayResult.guesses,
        ).length + 1
      : 0;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={22} color={palette.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Compete</Text>
          <View style={styles.addBtn} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

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
            userRank={3}
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
});
