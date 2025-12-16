import React, {useCallback, useState} from 'react';
import {View, ScrollView, RefreshControl, Alert, StyleSheet, Pressable, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHomeScreenData} from '../../hooks/useHomeScreenData';
import {useAuth} from '../../contexts/AuthContext';
import {palette} from '../../theme/colors';
import {HomeScreenProps} from './types';

// Components
import {HomeScreenHeader} from './components/HomeScreenHeader';
import {HeroCard} from './components/HeroCard';
import {StatCards} from './components/StatCards';
import {FreePlayButton} from './components/FreePlayButton';
import {HomeScreenSkeleton} from './components/HomeScreenSkeleton';
import {ErrorCard} from './components/ErrorCard';

export function HomeScreen({
  onPlayDaily,
  onContinueGame,
  onFreePlay,
  onNavigateToStats,
  onNavigateToFriends,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  const data = useHomeScreenData();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await data.refresh();
    setIsRefreshing(false);
  }, [data]);

  // Abandon game with confirmation
  const handleAbandon = useCallback(() => {
    Alert.alert(
      'Abandon Game?',
      'Your progress will be lost and counted as a loss.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            await data.abandonGame();
          },
        },
      ],
    );
  }, [data]);

  // Handle free play - disabled during in-progress game
  const handleFreePlay = useCallback(() => {
    if (data.screenState === 'in_progress') {
      Alert.alert(
        'Game in Progress',
        'Please finish or abandon your current game before starting a new one.',
        [{text: 'OK'}],
      );
      return;
    }
    onFreePlay();
  }, [data.screenState, onFreePlay]);

  // User initial for avatar
  const userInitial = user?.displayName?.charAt(0) ?? 'W';

  // Show skeleton while loading
  if (data.screenState === 'loading') {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <HomeScreenSkeleton />
      </View>
    );
  }

  // Show error if failed and no cached data
  if (data.error && data.leaderboardEntries.length === 0) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <HomeScreenHeader
          onProfilePress={onNavigateToStats}
          userInitial={userInitial}
        />
        <View style={styles.content}>
          <ErrorCard onRetry={data.refresh} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + 20},
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={palette.textMuted}
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <HomeScreenHeader
          onProfilePress={onNavigateToStats}
          userInitial={userInitial}
        />

        {/* Hero Card */}
        <View style={styles.content}>
          <HeroCard
            screenState={data.screenState}
            streak={data.streak}
            gameSummary={data.gameSummary}
            leaderboardType={data.leaderboardType}
            leaderboardEntries={data.leaderboardEntries}
            onPlayDaily={onPlayDaily}
            onContinue={onContinueGame}
            onAbandon={handleAbandon}
            onFreePlay={onFreePlay}
            onLeaderboardPress={onNavigateToFriends}
          />

          {/* Stat Cards */}
          <StatCards winRate={data.winRate} avgGuesses={data.avgGuesses} />

          {/* Free Play Button - only show if not in completed state (completed has its own) */}
          {data.screenState !== 'completed' && (
            <FreePlayButton
              disabled={data.screenState === 'in_progress'}
              onPress={handleFreePlay}
            />
          )}

          {/* Footer link */}
          <Pressable onPress={onNavigateToStats} style={styles.footerLink}>
            <Text style={styles.footerLinkText}>View Full Stats</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  footerLink: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 8,
  },
  footerLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.textMuted,
  },
});
