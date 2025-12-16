import React from 'react';
import {HomeScreenState, HomeGameSummary, LeaderboardEntry} from '../../types';
import {DailyCard} from './DailyCard';
import {ContinueCard} from './ContinueCard';
import {CompletedCard} from './CompletedCard';

interface Props {
  screenState: HomeScreenState;
  streak: number;
  gameSummary: HomeGameSummary | null;
  leaderboardType: 'friends' | 'global';
  leaderboardEntries: LeaderboardEntry[];
  onPlayDaily: () => void;
  onContinue: () => void;
  onAbandon: () => void;
  onFreePlay: () => void;
  onLeaderboardPress: () => void;
}

export function HeroCard({
  screenState,
  streak,
  gameSummary,
  leaderboardType,
  leaderboardEntries,
  onPlayDaily,
  onContinue,
  onAbandon,
  onFreePlay,
  onLeaderboardPress,
}: Props) {
  // Loading state is handled by parent with skeleton

  if (screenState === 'in_progress' && gameSummary) {
    return (
      <ContinueCard
        gameSummary={gameSummary}
        onContinue={onContinue}
        onAbandon={onAbandon}
      />
    );
  }

  if (screenState === 'completed') {
    return (
      <CompletedCard
        gameSummary={gameSummary}
        streak={streak}
        leaderboardType={leaderboardType}
        leaderboardEntries={leaderboardEntries}
        onFreePlay={onFreePlay}
        onLeaderboardPress={onLeaderboardPress}
      />
    );
  }

  // Default: not_started
  return (
    <DailyCard
      streak={streak}
      puzzleNumber={getDayOfYear()}
      wordLength={5}
      leaderboardType={leaderboardType}
      leaderboardEntries={leaderboardEntries}
      onPlayDaily={onPlayDaily}
      onLeaderboardPress={onLeaderboardPress}
    />
  );
}

/**
 * Get the day of year as a puzzle number
 */
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
