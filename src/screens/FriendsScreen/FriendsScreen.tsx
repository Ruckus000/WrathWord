import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../../theme/colors';
import {ChevronLeft, PlusIcon} from '../../components/icons/SettingsIcons';
import {MOCK_FRIENDS, MOCK_USER, Friend} from '../../data/mockFriends';

import SegmentControl, {Period} from './SegmentControl';
import TodayCard from './TodayCard';
import NotPlayedCard from './NotPlayedCard';
import AllTimeCard from './AllTimeCard';
import WeekCard from './WeekCard';
import Leaderboard from './Leaderboard';
import HeadToHeadModal from './HeadToHeadModal';

type Props = {
  onBack: () => void;
  onPlayNow?: () => void;
  userPlayedToday?: boolean;
};

export default function FriendsScreen({
  onBack,
  onPlayNow,
  userPlayedToday = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [showH2H, setShowH2H] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleFriendPress = useCallback((friend: Friend) => {
    setSelectedFriend(friend);
    setShowH2H(true);
  }, []);

  const handleCloseH2H = useCallback(() => {
    setShowH2H(false);
    setSelectedFriend(null);
  }, []);

  // Get friends who played today
  const friendsPlayedToday = MOCK_FRIENDS.filter(f => f.lastPlayed === 'today');
  const friendsWaiting = MOCK_FRIENDS.filter(f => f.lastPlayed !== 'today');

  // Calculate user rank (based on guesses - lower is better)
  const userRank = userPlayedToday
    ? friendsPlayedToday.filter(
        f =>
          f.todayResult &&
          f.todayResult.guesses < MOCK_USER.todayResult.guesses,
      ).length + 1
    : 0;

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
        <Pressable style={styles.addBtn}>
          <PlusIcon size={18} color={palette.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Today Card - Different based on play state */}
        {selectedPeriod === 'today' && userPlayedToday && (
          <TodayCard
            userRank={userRank}
            totalPlayed={friendsPlayedToday.length + 1}
            guesses={MOCK_USER.todayResult.guesses}
            feedback={MOCK_USER.todayResult.feedback}
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
            totalFriends={MOCK_FRIENDS.length}
            winRate={MOCK_USER.stats.winRate}
            avgGuesses={MOCK_USER.stats.avgGuesses}
          />
        )}

        {selectedPeriod === 'week' && (
          <WeekCard userRank={2} totalFriends={MOCK_FRIENDS.length} />
        )}

        {/* Segment Control */}
        <SegmentControl
          selected={selectedPeriod}
          onSelect={setSelectedPeriod}
        />

        {/* Leaderboard */}
        <Leaderboard
          period={selectedPeriod}
          userPlayedToday={userPlayedToday}
          friends={MOCK_FRIENDS}
          userRank={userRank}
          onFriendPress={handleFriendPress}
        />
      </ScrollView>

      {/* H2H Modal */}
      <HeadToHeadModal
        visible={showH2H}
        friend={selectedFriend}
        onClose={handleCloseH2H}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollView: {
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
});
