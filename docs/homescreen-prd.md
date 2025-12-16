# WrathWord Home Screen — Product Requirements Document

**Version:** 1.0  
**Date:** December 13, 2024  
**Author:** Claude (AI Assistant)  
**Status:** Draft for Review

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Stories](#3-user-stories)
4. [Screen States](#4-screen-states)
5. [Data Requirements](#5-data-requirements)
6. [UI/UX Specifications](#6-uiux-specifications)
7. [Technical Implementation](#7-technical-implementation)
8. [Edge Cases & Error Handling](#8-edge-cases--error-handling)
9. [Testing Strategy](#9-testing-strategy)
10. [Rollout Plan](#10-rollout-plan)

---

## 1. Overview

### 1.1 Problem Statement

Currently, WrathWord opens directly to the GameScreen. Users who want to:

- Choose between Daily and Free Play modes
- See their streak and ranking before playing
- Understand social context (friend activity)

...must navigate through modals or separate screens. This creates friction and reduces engagement with the game's social features.

### 1.2 Solution

Introduce a **Home Screen** as the app's entry point. This screen serves as a "mission control" that:

- Prominently features the Daily Challenge
- Shows streak, rank, and social proof
- Provides clear paths to Daily vs Free Play
- Handles in-progress game resumption
- Adapts display based on friend count (friends vs global leaderboard)

### 1.3 Design Reference

Based on approved mockup: **Version C (Social Focus)** with gradient border hero card, mini leaderboard preview, and adaptive friend/global display.

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals

| Goal                        | Description                                         |
| --------------------------- | --------------------------------------------------- |
| Increase Daily engagement   | More users should play the Daily challenge each day |
| Surface social features     | Users should see friend activity without navigating |
| Reduce confusion            | Clear distinction between Daily and Free Play       |
| Maintain session continuity | In-progress games must be resumable                 |

### 2.2 Success Metrics

| Metric                   | Target      | Measurement                              |
| ------------------------ | ----------- | ---------------------------------------- |
| Daily play rate          | +15%        | % of DAU completing Daily                |
| Time to first game       | < 3 seconds | From Home Screen render to game start    |
| Session resumption rate  | > 95%       | In-progress games continued vs abandoned |
| Friend feature awareness | +25%        | Users who visit Friends screen           |

---

## 3. User Stories

### 3.1 Core User Stories

```
US-1: As a returning player, I want to see today's Daily challenge prominently
      so I can start playing immediately.

US-2: As a competitive player, I want to see my rank among friends
      so I'm motivated to play and improve.

US-3: As a player with an in-progress game, I want to resume where I left off
      so I don't lose my progress.

US-4: As a new player with few friends, I want to see my global ranking
      so I still feel part of a community.

US-5: As a player who completed today's Daily, I want easy access to Free Play
      so I can keep playing.
```

### 3.2 Acceptance Criteria

**US-1 Acceptance Criteria:**

- Daily card is the largest element on screen
- "Play Daily" button is immediately tappable
- Date and puzzle number are visible
- Streak badge shows current streak count

**US-2 Acceptance Criteria:**

- If user has ≥3 friends: Show friend leaderboard preview (top 2 + user position)
- If user has <3 friends: Show global leaderboard preview (top 2 + user position)
- Leaderboard shows name, avatar, and guess count for completed users
- User's row shows "Not played" if they haven't completed today

**US-3 Acceptance Criteria:**

- In-progress card appears instead of Daily card
- Progress bar shows guesses used/remaining
- "Continue" button is primary action
- "Abandon" link is available but de-emphasized

**US-4 Acceptance Criteria:**

- System automatically detects friend count
- Leaderboard header indicates "Friends" or "Global"
- Transition between modes is seamless (no flicker)

**US-5 Acceptance Criteria:**

- Completed Daily shows success state with result summary
- Primary action becomes "Play Free Mode"
- Share button is accessible

---

## 4. Screen States

### 4.1 State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      APP OPENS                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Loading State    │
                    │ (fetch data)     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ In Progress│  │ Not Started│  │ Completed  │
     │ State      │  │ State      │  │ State      │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │               │               │
           ▼               ▼               ▼
      [Continue]      [Play Daily]    [Free Play]
           │               │               │
           └───────────────┼───────────────┘
                           │
                           ▼
                    ┌────────────┐
                    │ GameScreen │
                    └────────────┘
```

### 4.2 State Definitions

#### 4.2.1 Loading State

- **Duration:** < 500ms typical, 2s timeout
- **Display:** Skeleton UI matching final layout
- **Trigger:** App open, pull-to-refresh

#### 4.2.2 Not Started State

- **Condition:** No in-progress game AND today's Daily not completed
- **Hero Card:** Daily Challenge with empty board preview
- **Primary Action:** "Play Daily"
- **Leaderboard:** Shows friends/global who completed, user marked "Not played"

#### 4.2.3 In Progress State

- **Condition:** Game state exists with `status === 'playing'`
- **Hero Card:** Continue Game with progress indicator
- **Primary Action:** "Continue"
- **Secondary Action:** "Abandon game" (text link)
- **Free Play:** Disabled with badge "Finish current game"

#### 4.2.4 Completed State

- **Condition:** Today's Daily `status === 'won' || 'lost'`
- **Hero Card:** Success/failure summary with mini-board
- **Primary Action:** "Play Free Mode"
- **Secondary Action:** "Share" button
- **Leaderboard:** Shows user's rank among friends/global

---

## 5. Data Requirements

### 5.1 Data Model

```typescript
// src/types/homeScreen.ts

export interface HomeScreenData {
  // User's game state
  gameState: GameState | null

  // User's stats
  userStats: {
    currentStreak: number
    winRate: number
    gamesPlayed: number
    avgGuesses: number
  }

  // Today's result (if completed)
  todayResult: TodayResult | null

  // Leaderboard data
  leaderboard: LeaderboardData

  // Metadata
  isLoading: boolean
  lastUpdated: Date
}

export interface GameState {
  mode: 'daily' | 'free'
  status: 'playing' | 'won' | 'lost'
  length: number
  maxRows: number
  dateISO: string
  guessesUsed: number
  feedback: TileState[][]
}

export interface TodayResult {
  won: boolean
  guesses: number
  feedback: TileState[][]
}

export interface LeaderboardData {
  type: 'friends' | 'global'
  entries: LeaderboardEntry[]
  userRank: number | null // null if not played
  totalParticipants: number
}

export interface LeaderboardEntry {
  id: string
  name: string
  letter: string
  guesses: number | null // null if not played
  isUser: boolean
  rank: number
}
```

### 5.2 Data Sources

| Data Point         | Source                                   | Update Frequency       |
| ------------------ | ---------------------------------------- | ---------------------- |
| Game state         | `MMKV (game.state)`                      | Real-time              |
| User stats         | `MMKV (profile)`                         | After each game        |
| Today's result     | `MMKV (game.state)`                      | After daily completion |
| Friend count       | `friendsService.getFriends()`            | Cached, 5min stale     |
| Friend leaderboard | `friendsService.getFriendsLeaderboard()` | Cached, 2min stale     |
| Global leaderboard | `friendsService.getGlobalLeaderboard()`  | Cached, 5min stale     |

### 5.3 Friend Count Threshold Logic

```typescript
// Determines whether to show friends or global leaderboard
const FRIEND_THRESHOLD = 3

function getLeaderboardType(friendCount: number): 'friends' | 'global' {
  return friendCount >= FRIEND_THRESHOLD ? 'friends' : 'global'
}
```

**Rationale:** With fewer than 3 friends, the leaderboard feels empty and demotivating. Global leaderboard provides sense of community until user builds friend network.

---

## 6. UI/UX Specifications

### 6.1 Layout Structure

```
┌─────────────────────────────────────────┐
│ Status Bar                              │
├─────────────────────────────────────────┤
│ Header: Logo          [Profile Button]  │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ HERO CARD                           │ │
│ │ (Daily/Continue/Completed)          │ │
│ │                                     │ │
│ │ - Date/Title                        │ │
│ │ - Streak Badge                      │ │
│ │ - Leaderboard Preview               │ │
│ │ - Primary CTA                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌───────────┐ ┌───────────┐             │
│ │ Stat Card │ │ Stat Card │             │
│ │ Win Rate  │ │ Avg Guess │             │
│ └───────────┘ └───────────┘             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ FREE PLAY BUTTON                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│              [View Stats]               │
│                                         │
│ ═══════════════════════════════════════ │
│            Home Indicator               │
└─────────────────────────────────────────┘
```

### 6.2 Component Specifications

#### 6.2.1 Hero Card (Daily Challenge)

| Property      | Value                                             |
| ------------- | ------------------------------------------------- |
| Background    | `palette.card` (#1c1c1e)                          |
| Border        | 1px gradient (`gradientStart` → `gradientEnd`)    |
| Border Radius | 20px                                              |
| Padding       | 24px                                              |
| Shadow        | Purple glow (0 4px 24px rgba(99, 102, 241, 0.15)) |

**Internal Elements:**

- **Label:** "DAILY CHALLENGE" — 12px, uppercase, `gradientStart` color
- **Date:** "Dec 13" — 32px, weight 800, `textPrimary`
- **Puzzle Number:** "Puzzle #47 • 5 letters" — 13px, `textMuted`
- **Streak Badge:** Positioned top-right, orange background, fire emoji + count

#### 6.2.2 Leaderboard Preview

| Property      | Value               |
| ------------- | ------------------- |
| Background    | `palette.bg` (#111) |
| Border Radius | 12px                |
| Padding       | 12px                |
| Max Entries   | 3 (top 2 + user)    |

**Row Structure:**

```
[Rank] [Avatar] [Name]                    [Guesses]
 #1      (J)    Jessica                   3 guesses
 #2      (S)    Sam                       4 guesses
  —      (Y)    You                       Not played
```

**Rank Colors:**

- #1: `palette.gold` (#fbbf24)
- #2: `palette.silver` (#94a3b8)
- #3+: `palette.textMuted`

#### 6.2.3 Progress Indicator (In Progress State)

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| Type          | Horizontal progress bar                    |
| Background    | `palette.tileEmpty`                        |
| Fill          | Gradient (`gradientStart` → `gradientEnd`) |
| Height        | 4px                                        |
| Border Radius | 2px                                        |

**Labels:**

- Left: "{n} guesses used"
- Right: "{n} remaining"

#### 6.2.4 Free Play Button

| Property      | Value                           |
| ------------- | ------------------------------- |
| Background    | `palette.tile`                  |
| Border        | 1px solid `palette.borderLight` |
| Border Radius | 14px                            |
| Padding       | 16px 20px                       |
| Layout        | Row with icon, text, arrow      |

**Icon Container:**

- 44x44px, rounded 12px
- Background: `rgba(62, 184, 176, 0.15)` (teal tint)
- Border: 1px solid `rgba(62, 184, 176, 0.2)`
- Emoji: 🎲

### 6.3 Interaction Specifications

| Element         | Action | Result                                   |
| --------------- | ------ | ---------------------------------------- |
| Play Daily      | Tap    | Navigate to GameScreen, start daily      |
| Continue        | Tap    | Navigate to GameScreen, resume game      |
| Free Play       | Tap    | Open NewGameModal (pre-set to Free mode) |
| Abandon game    | Tap    | Show confirmation alert, then reset      |
| Share           | Tap    | Open share sheet with result             |
| Profile button  | Tap    | Navigate to StatsScreen                  |
| View Stats      | Tap    | Navigate to StatsScreen                  |
| Leaderboard row | Tap    | Navigate to FriendsScreen                |

### 6.4 Animation Specifications

| Animation         | Trigger      | Duration | Easing      |
| ----------------- | ------------ | -------- | ----------- |
| Hero card shimmer | On load      | 2s loop  | Linear      |
| Button press      | Touch down   | 100ms    | ease-out    |
| State transition  | Data change  | 200ms    | ease-in-out |
| Progress bar fill | Value change | 300ms    | ease-out    |

---

## 7. Technical Implementation

### 7.1 File Structure

```
src/
├── screens/
│   └── HomeScreen/
│       ├── HomeScreen.tsx          # Main screen component
│       ├── index.ts                # Export
│       ├── types.ts                # TypeScript types
│       └── components/
│           ├── HeroCard/
│           │   ├── HeroCard.tsx    # Container with state variants
│           │   ├── DailyCard.tsx   # Not started state
│           │   ├── ContinueCard.tsx # In progress state
│           │   ├── CompletedCard.tsx # Completed state
│           │   └── index.ts
│           ├── LeaderboardPreview/
│           │   ├── LeaderboardPreview.tsx
│           │   ├── LeaderboardRow.tsx
│           │   └── index.ts
│           ├── StatCards.tsx       # Win rate, avg guesses
│           ├── FreePlayButton.tsx
│           └── StreakBadge.tsx
├── hooks/
│   ├── useHomeScreenData.ts        # Main data hook
│   └── useLeaderboardPreview.ts    # Leaderboard with threshold logic
├── services/
│   └── data/
│       └── homeService.ts          # Aggregates data for home screen
```

### 7.2 Navigation Changes

**Current (`App.tsx`):**

```typescript
type Screen = 'game' | 'stats' | 'friends' | 'signin' | 'signup'
```

**Updated:**

```typescript
type Screen = 'home' | 'game' | 'stats' | 'friends' | 'signin' | 'signup'

// Default screen changes from 'game' to 'home'
const [currentScreen, setCurrentScreen] = useState<Screen>('home')
```

### 7.3 Core Hook Implementation

```typescript
// src/hooks/useHomeScreenData.ts

import { useState, useEffect, useCallback } from 'react'
import { friendsService } from '../services/data/friendsService'
import { useUserStats } from './useUserStats'
import { getJSON } from '../storage/mmkv'
import { isDailyCompleted } from '../storage/dailyCompletion'
import { useAuth } from '../contexts/AuthContext'

const FRIEND_THRESHOLD = 3
const GAME_STATE_KEY = 'game.state'

export interface HomeScreenData {
  // State
  screenState: 'loading' | 'not_started' | 'in_progress' | 'completed'

  // Game info
  gameState: GameState | null
  todayResult: TodayResult | null

  // User stats
  streak: number
  winRate: number
  avgGuesses: number
  gamesPlayed: number

  // Leaderboard
  leaderboardType: 'friends' | 'global'
  leaderboardEntries: LeaderboardEntry[]
  userRank: number | null
  totalParticipants: number

  // Actions
  refresh: () => Promise<void>
}

export function useHomeScreenData(): HomeScreenData {
  const { user, accessToken } = useAuth()
  const userStats = useUserStats()

  const [isLoading, setIsLoading] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])
  const [globalUsers, setGlobalUsers] = useState<Friend[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)

  // Determine screen state
  const getScreenState = useCallback(() => {
    if (isLoading) return 'loading'

    const today = new Date().toISOString().slice(0, 10)

    // Check for in-progress game
    if (gameState && gameState.status === 'playing') {
      return 'in_progress'
    }

    // Check if daily completed
    if (
      gameState?.mode === 'daily' &&
      gameState.dateISO === today &&
      (gameState.status === 'won' || gameState.status === 'lost')
    ) {
      return 'completed'
    }

    // Also check completion storage
    if (isDailyCompleted(5, 6, today)) {
      return 'completed'
    }

    return 'not_started'
  }, [isLoading, gameState])

  // Determine leaderboard type based on friend count
  const leaderboardType =
    friends.length >= FRIEND_THRESHOLD ? 'friends' : 'global'

  // Build leaderboard entries
  const buildLeaderboardEntries = useCallback(() => {
    const source = leaderboardType === 'friends' ? friends : globalUsers
    const today = new Date().toISOString().slice(0, 10)

    // Filter to today's players, sort by guesses
    const todayPlayers = source
      .filter((u) => u.todayResult)
      .sort(
        (a, b) =>
          (a.todayResult?.guesses ?? 99) - (b.todayResult?.guesses ?? 99)
      )

    // Get top 2
    const entries: LeaderboardEntry[] = todayPlayers
      .slice(0, 2)
      .map((u, idx) => ({
        id: u.id,
        name: u.name,
        letter: u.letter,
        guesses: u.todayResult?.guesses ?? null,
        isUser: false,
        rank: idx + 1,
      }))

    // Add current user
    const userPlayed =
      gameState?.status === 'won' || gameState?.status === 'lost'
    const userGuesses = gameState?.feedback?.length

    // Calculate user rank
    let userRank: number | null = null
    if (userPlayed && userGuesses) {
      userRank =
        todayPlayers.filter((u) => (u.todayResult?.guesses ?? 99) < userGuesses)
          .length + 1
    }

    // Insert user at correct position (or at end if not played)
    entries.push({
      id: 'current-user',
      name: 'You',
      letter: user?.displayName?.charAt(0) ?? 'Y',
      guesses: userPlayed ? userGuesses : null,
      isUser: true,
      rank: userRank ?? entries.length + 1,
    })

    // Sort by rank and take top 3
    return entries.sort((a, b) => a.rank - b.rank).slice(0, 3)
  }, [friends, globalUsers, leaderboardType, gameState, user])

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true)

    try {
      // Load game state from storage
      const savedGameState = getJSON<GameState>(GAME_STATE_KEY, null)
      setGameState(savedGameState)

      // Fetch friends
      const friendsData = await friendsService.getFriends(
        undefined, // onFreshData
        user?.id,
        accessToken
      )
      setFriends(friendsData)

      // If few friends, also fetch global
      if (friendsData.length < FRIEND_THRESHOLD) {
        const globalData = await friendsService.getGlobalLeaderboard(
          10,
          undefined,
          user?.id,
          accessToken
        )
        setGlobalUsers(globalData)
      }
    } catch (error) {
      console.error('[useHomeScreenData] Failed to fetch:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, accessToken])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build return object
  const screenState = getScreenState()
  const leaderboardEntries = buildLeaderboardEntries()

  return {
    screenState,
    gameState,
    todayResult:
      gameState?.status === 'won' || gameState?.status === 'lost'
        ? {
            won: gameState.status === 'won',
            guesses: gameState.feedback.length,
            feedback: gameState.feedback,
          }
        : null,
    streak: userStats.currentStreak,
    winRate: userStats.winRate,
    avgGuesses: userStats.avgGuesses,
    gamesPlayed: userStats.played,
    leaderboardType,
    leaderboardEntries,
    userRank: leaderboardEntries.find((e) => e.isUser)?.rank ?? null,
    totalParticipants:
      (leaderboardType === 'friends' ? friends : globalUsers).filter(
        (u) => u.todayResult
      ).length +
      (gameState?.status === 'won' || gameState?.status === 'lost' ? 1 : 0),
    refresh: fetchData,
  }
}
```

### 7.4 Home Screen Component

```typescript
// src/screens/HomeScreen/HomeScreen.tsx

import React, {useCallback} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHomeScreenData} from '../../hooks/useHomeScreenData';
import {Header} from './components/Header';
import {HeroCard} from './components/HeroCard';
import {StatCards} from './components/StatCards';
import {FreePlayButton} from './components/FreePlayButton';
import {FooterLink} from './components/FooterLink';
import {palette} from '../../theme/colors';

interface Props {
  onNavigateToGame: (resumeGame?: boolean) => void;
  onNavigateToStats: () => void;
  onNavigateToFriends: () => void;
  onOpenNewGameModal: () => void;
}

export function HomeScreen({
  onNavigateToGame,
  onNavigateToStats,
  onNavigateToFriends,
  onOpenNewGameModal,
}: Props) {
  const insets = useSafeAreaInsets();
  const data = useHomeScreenData();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await data.refresh();
    setIsRefreshing(false);
  }, [data.refresh]);

  const handlePlayDaily = useCallback(() => {
    onNavigateToGame(false); // Start new daily
  }, [onNavigateToGame]);

  const handleContinue = useCallback(() => {
    onNavigateToGame(true); // Resume game
  }, [onNavigateToGame]);

  const handleFreePlay = useCallback(() => {
    // If game in progress, show disabled state (handled in component)
    if (data.screenState !== 'in_progress') {
      onOpenNewGameModal();
    }
  }, [data.screenState, onOpenNewGameModal]);

  const handleAbandon = useCallback(() => {
    // TODO: Show confirmation, then clear game state
  }, []);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={palette.textMuted}
          />
        }
      >
        <Header onProfilePress={onNavigateToStats} />

        <HeroCard
          screenState={data.screenState}
          streak={data.streak}
          gameState={data.gameState}
          todayResult={data.todayResult}
          leaderboardType={data.leaderboardType}
          leaderboardEntries={data.leaderboardEntries}
          onPlayDaily={handlePlayDaily}
          onContinue={handleContinue}
          onAbandon={handleAbandon}
          onLeaderboardPress={onNavigateToFriends}
        />

        <StatCards
          winRate={data.winRate}
          avgGuesses={data.avgGuesses}
        />

        <FreePlayButton
          disabled={data.screenState === 'in_progress'}
          onPress={handleFreePlay}
        />

        <View style={styles.spacer} />

        <FooterLink
          label="View Stats"
          onPress={onNavigateToStats}
        />
      </ScrollView>

      <View style={[styles.homeIndicator, {paddingBottom: insets.bottom}]}>
        <View style={styles.homeIndicatorBar} />
      </View>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  homeIndicator: {
    alignItems: 'center',
    paddingTop: 8,
  },
  homeIndicatorBar: {
    width: 134,
    height: 5,
    backgroundColor: palette.tileEmpty,
    borderRadius: 3,
  },
});
```

### 7.5 App.tsx Changes

```typescript
// app/App.tsx - Key changes

type Screen = 'home' | 'game' | 'stats' | 'friends' | 'signin' | 'signup';

function AppContent() {
  const {isAuthenticated, loading, isDevelopmentMode} = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home'); // Changed default
  const [resumeGame, setResumeGame] = useState(false);

  // ... auth loading logic ...

  // Home Screen
  if (currentScreen === 'home') {
    return (
      <HomeScreen
        onNavigateToGame={(resume) => {
          setResumeGame(resume ?? false);
          setCurrentScreen('game');
        }}
        onNavigateToStats={() => setCurrentScreen('stats')}
        onNavigateToFriends={() => setCurrentScreen('friends')}
        onOpenNewGameModal={() => {
          // Navigate to game with modal open
          setCurrentScreen('game');
          // GameScreen will detect this and open NewGameModal
        }}
      />
    );
  }

  // Game Screen - pass resumeGame prop
  if (currentScreen === 'game') {
    return (
      <GameScreen
        resumeGame={resumeGame}
        onNavigateToStats={() => setCurrentScreen('stats')}
        onNavigateToHome={() => setCurrentScreen('home')}
      />
    );
  }

  // ... rest of screens ...
}
```

---

## 8. Edge Cases & Error Handling

### 8.1 Edge Cases

| Case                                               | Expected Behavior                         |
| -------------------------------------------------- | ----------------------------------------- |
| User has 0 friends                                 | Show global leaderboard                   |
| User has 1-2 friends                               | Show global leaderboard                   |
| User has 3+ friends                                | Show friends leaderboard                  |
| No one played today (friends)                      | Show empty state: "Be the first to play!" |
| No one played today (global)                       | Show empty state: "No results yet today"  |
| User offline                                       | Show cached data, disable refresh         |
| In-progress game from yesterday                    | Treat as abandoned, show "Not Started"    |
| Free Play game in progress                         | Show continue card (same as daily)        |
| Daily game from different config (e.g., 6 letters) | Show continue for that config             |

### 8.2 Error Handling

```typescript
// Error states to handle in useHomeScreenData

interface ErrorState {
  type: 'network' | 'auth' | 'unknown';
  message: string;
  retryable: boolean;
}

// Display fallback UI when data fetch fails
if (error && !cachedData) {
  return (
    <ErrorCard
      message="Couldn't load leaderboard"
      onRetry={refresh}
    />
  );
}

// Use cached data even if stale when offline
if (error && cachedData) {
  // Show data with subtle "offline" indicator
}
```

### 8.3 Loading States

| State              | Duration | UI                                    |
| ------------------ | -------- | ------------------------------------- |
| Initial load       | 0-500ms  | Skeleton with shimmer                 |
| Slow load          | 500ms-2s | Skeleton + spinner                    |
| Timeout            | >2s      | Error state with retry                |
| Background refresh | Any      | No visible change, update on complete |

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// src/hooks/__tests__/useHomeScreenData.test.ts

describe('useHomeScreenData', () => {
  describe('screenState', () => {
    it('returns "loading" while fetching', () => {})
    it('returns "not_started" when no game and daily not completed', () => {})
    it('returns "in_progress" when game status is playing', () => {})
    it('returns "completed" when daily won', () => {})
    it('returns "completed" when daily lost', () => {})
  })

  describe('leaderboardType', () => {
    it('returns "global" when friend count is 0', () => {})
    it('returns "global" when friend count is 2', () => {})
    it('returns "friends" when friend count is 3', () => {})
    it('returns "friends" when friend count is 100', () => {})
  })

  describe('leaderboardEntries', () => {
    it('includes top 2 players plus current user', () => {})
    it('sorts by guess count ascending', () => {})
    it('shows "Not played" for user who hasnt played', () => {})
    it('correctly calculates user rank', () => {})
  })
})
```

### 9.2 Integration Tests

```typescript
// src/screens/HomeScreen/__tests__/HomeScreen.integration.test.tsx

describe('HomeScreen Integration', () => {
  it('navigates to GameScreen when Play Daily pressed', () => {})
  it('navigates to GameScreen with resume flag when Continue pressed', () => {})
  it('opens NewGameModal when Free Play pressed', () => {})
  it('shows confirmation when Abandon pressed', () => {})
  it('refreshes data on pull-to-refresh', () => {})
})
```

### 9.3 Manual Test Cases

| Test Case           | Steps                          | Expected Result                             |
| ------------------- | ------------------------------ | ------------------------------------------- |
| Fresh install       | Open app                       | Home Screen with "Not Started" state        |
| After winning daily | Complete daily, return to home | "Completed" state with result               |
| Mid-game close      | Start daily, close app, reopen | "In Progress" state with continue           |
| Few friends         | Have 0-2 friends               | Global leaderboard shown                    |
| Many friends        | Have 3+ friends                | Friends leaderboard shown                   |
| Offline mode        | Disable network, open app      | Cached data shown, refresh fails gracefully |

---

## 10. Rollout Plan

### 10.1 Implementation Phases

**Phase 1: Foundation (3 days)**

- [ ] Create `HomeScreen` folder structure
- [ ] Implement `useHomeScreenData` hook
- [ ] Implement `useLeaderboardPreview` hook
- [ ] Add types and interfaces

**Phase 2: Components (4 days)**

- [ ] Implement `Header` component
- [ ] Implement `HeroCard` with all states
- [ ] Implement `LeaderboardPreview` with threshold logic
- [ ] Implement `StatCards`
- [ ] Implement `FreePlayButton`
- [ ] Implement skeleton loading states

**Phase 3: Integration (2 days)**

- [ ] Update `App.tsx` navigation
- [ ] Update `GameScreen` to accept `resumeGame` prop
- [ ] Wire up all navigation actions
- [ ] Test state persistence across navigation

**Phase 4: Polish (2 days)**

- [ ] Add animations (shimmer, transitions)
- [ ] Implement pull-to-refresh
- [ ] Error handling and offline support
- [ ] Accessibility audit

**Phase 5: Testing (2 days)**

- [ ] Unit tests for hooks
- [ ] Integration tests for navigation
- [ ] Manual testing all edge cases
- [ ] Performance profiling

### 10.2 Feature Flags

```typescript
// src/config/featureFlags.ts

export const FEATURE_FLAGS = {
  HOME_SCREEN_ENABLED: true, // Toggle to roll back to direct GameScreen
}

// In App.tsx
const initialScreen = FEATURE_FLAGS.HOME_SCREEN_ENABLED ? 'home' : 'game'
```

### 10.3 Rollback Plan

If critical issues discovered:

1. Set `HOME_SCREEN_ENABLED = false`
2. Push hotfix update
3. App reverts to opening directly to GameScreen
4. No data migration needed (game state unchanged)

---

## Appendix A: Mockup Reference

See attached HTML mockups:

- `wraithword-home-improved.html` — Three variations of "Not Started" state
- `wraithword-home-final.html` — All three states with correct color palette

**Approved Design:** Version C (Social Focus) from improved mockups

---

## Appendix B: Color Tokens

All colors from `src/theme/colors.ts`:

```typescript
// Hero card gradient border
gradientStart: '#6366f1'
gradientEnd: '#8b5cf6'

// Backgrounds
bg: '#111'
card: '#1c1c1e'
tileEmpty: '#1c1c1e'

// Borders
borderLight: '#2c2c2e'
tileBorder: '#3a3a3c'

// Text
textPrimary: '#ffffff'
textMuted: '#8e8e93'
textDim: '#636366'

// Streak
streakOrange: '#fb923c'

// Game colors
correct: '#34c759'
present: '#ffd60a'
absent: '#3a3a3c'

// Rank colors
gold: '#fbbf24'
silver: '#94a3b8'
```

---

## Appendix C: Accessibility Requirements

| Requirement         | Implementation                               |
| ------------------- | -------------------------------------------- |
| VoiceOver labels    | All buttons have `accessibilityLabel`        |
| Role annotations    | Buttons use `accessibilityRole="button"`     |
| State announcements | Screen state changes announced               |
| Touch targets       | Minimum 44x44pt for all interactive elements |
| Color contrast      | All text meets WCAG AA (4.5:1 minimum)       |
| Motion reduction    | Respect `reduceMotion` system setting        |

---
