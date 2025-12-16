# WrathWord Phased Onboarding - Complete Implementation Plan v2

## Executive Summary

This document provides **exact pixel-perfect specifications** for implementing progressive onboarding in WrathWord. Claude Code should follow these instructions precisely.

**User Maturity Phases:**
| Phase | Trigger | Home Screen | Result Screen |
|-------|---------|-------------|---------------|
| 1 | 0-1 games played | WelcomeCard only | Streak intro (win) / Encouragement (loss) |
| 2 | 2-4 games played | Standard HeroCard + stats | Compact streak display |
| 3 | 5+ games OR 3+ day streak, no friends | HeroCard + AddFriendsCard | Streak + friends prompt |
| 4 | Has friends | HeroCard + leaderboard | Leaderboard hero + streak badge |

---

# PART 1: COLOR & TYPOGRAPHY CONSTANTS

Reference these exact values. They already exist in `palette` but are listed here for clarity:

```
COLORS:
- bg: '#111'
- card: '#1c1c1e'
- borderLight: '#2c2c2e'
- gradientStart: '#6366f1'
- gradientEnd: '#8b5cf6'
- textPrimary: '#ffffff'
- textMuted: '#8e8e93'
- textDim: '#636366'
- accentTeal: '#3eb8b0'
- accentTealDim: 'rgba(62, 184, 176, 0.15)'
- accentTealBorder: 'rgba(62, 184, 176, 0.3)'
- streakOrange: '#fb923c'
- streakBg: 'rgba(251, 146, 60, 0.12)'
- streakBorder: 'rgba(251, 146, 60, 0.25)'
- success: '#34c759'
- successDim: 'rgba(52, 199, 89, 0.1)'
- successBorder: 'rgba(52, 199, 89, 0.2)'
- gold: '#fbbf24'
- silver: '#94a3b8'
- bronze: '#d97706'
- absent: '#3a3a3c'

TYPOGRAPHY:
- welcomeText: fontSize 24, fontWeight '700'
- welcomeSubtext: fontSize 14, fontWeight '400'
- cardLabel: fontSize 11, fontWeight '600', letterSpacing 1.2, uppercase
- cardDate: fontSize 28, fontWeight '800'
- cardInfo: fontSize 13-14, fontWeight '400'
- buttonText: fontSize 15-16, fontWeight '700'
- streakBadgeText: fontSize 13-15, fontWeight '700'
- onboardingTitle: fontSize 16-17, fontWeight '700'
- onboardingText: fontSize 13-14, fontWeight '400', lineHeight 1.5 (or ~20px)
```

---

# PART 2: CREATE useUserMaturity HOOK

## File: `src/hooks/useUserMaturity.ts`

**Action:** CREATE NEW FILE

```typescript
// src/hooks/useUserMaturity.ts
import { useMemo } from 'react'
import { useUserStats } from './useUserStats'
import { getJSON, setJSON } from '../storage/mmkv'

export type UserMaturityPhase = 1 | 2 | 3 | 4

export interface UserMaturityData {
  phase: UserMaturityPhase
  isFirstGame: boolean
  hasFriends: boolean
  totalGamesPlayed: number
  currentStreak: number
  maxStreak: number
  shouldShowFriendsPrompt: boolean
}

const FRIENDS_PROMPT_DISMISSED_KEY = 'ui.friendsPromptDismissedAt'
const FRIENDS_PROMPT_COOLDOWN_DAYS = 7

/**
 * Determines user's onboarding phase based on their history.
 * @param friendCount - Number of friends the user has
 */
export function useUserMaturity(friendCount: number = 0): UserMaturityData {
  const stats = useUserStats()

  const hasFriends = friendCount > 0
  const isFirstGame = stats.played <= 1

  // Check if friends prompt was dismissed and cooldown passed
  const shouldShowFriendsPrompt = useMemo(() => {
    if (hasFriends) return false

    const dismissedAt = getJSON<string | null>(
      FRIENDS_PROMPT_DISMISSED_KEY,
      null
    )
    if (!dismissedAt) return true

    const dismissedDate = new Date(dismissedAt)
    const now = new Date()
    const daysSince = Math.floor(
      (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    return daysSince >= FRIENDS_PROMPT_COOLDOWN_DAYS
  }, [hasFriends])

  const phase = useMemo((): UserMaturityPhase => {
    // Phase 4: Has friends → full social experience
    if (hasFriends) return 4

    // Phase 3: Ready for friends (invested user)
    // Trigger: 3+ day streak OR 5+ total games played
    if (stats.currentStreak >= 3 || stats.played >= 5) return 3

    // Phase 2: Building habit (returning user)
    // Trigger: 2-4 games played
    if (stats.played >= 2) return 2

    // Phase 1: First-time user (0-1 games)
    return 1
  }, [hasFriends, stats.currentStreak, stats.played])

  return {
    phase,
    isFirstGame,
    hasFriends,
    totalGamesPlayed: stats.played,
    currentStreak: stats.currentStreak,
    maxStreak: stats.maxStreak,
    shouldShowFriendsPrompt,
  }
}

/**
 * Call this when user dismisses the "Add Friends" prompt.
 */
export function dismissFriendsPrompt(): void {
  setJSON(FRIENDS_PROMPT_DISMISSED_KEY, new Date().toISOString())
}
```

## File: `src/hooks/index.ts`

**Action:** ADD these lines to existing exports:

```typescript
export { useUserMaturity, dismissFriendsPrompt } from './useUserMaturity'
export type { UserMaturityPhase, UserMaturityData } from './useUserMaturity'
```

---

# PART 3: HOME SCREEN - PHASE 1 WELCOME CARD

## File: `src/screens/HomeScreen/components/WelcomeCard.tsx`

**Action:** CREATE NEW FILE

### EXACT DESIGN SPECIFICATIONS:

**Container:**

- marginTop: 8

**Welcome Section:**

- alignItems: 'center'
- marginBottom: 24

**Welcome Text:**

- fontSize: 24
- fontWeight: '700'
- color: palette.textPrimary (#ffffff)
- marginBottom: 4
- Content: "Welcome! 👋" (or "Welcome, {name}! 👋" if name available)

**Welcome Subtext:**

- fontSize: 14
- color: palette.textMuted (#8e8e93)
- Content: "Ready for your first puzzle?"

**Card Wrapper (Gradient Border):**

- marginBottom: 16
- LinearGradient with colors: [palette.gradientStart, palette.gradientEnd]
- start: {x: 0, y: 0}, end: {x: 1, y: 1}
- borderRadius: 20
- padding: 1 (this creates the border effect)

**Card Inner:**

- backgroundColor: palette.card (#1c1c1e)
- borderRadius: 19 (1px less than outer for seamless border)
- padding: 24
- alignItems: 'center'

**Daily Label:**

- fontSize: 11
- fontWeight: '600'
- color: palette.gradientStart (#6366f1)
- letterSpacing: 1.2
- textTransform: 'uppercase'
- marginBottom: 8
- Content: "TODAY'S DAILY CHALLENGE"

**Date Display:**

- fontSize: 28
- fontWeight: '800'
- color: palette.textPrimary
- marginBottom: 4
- Use formatShortDate() to show like "Dec 15"

**Puzzle Info:**

- fontSize: 14
- color: palette.textMuted
- marginBottom: 20
- Content: "5-letter word • 6 attempts"

**Mini Board Preview (5 empty tiles):**

- flexDirection: 'row'
- gap: 4
- justifyContent: 'center'
- marginBottom: 24
- Each tile:
  - width: 28
  - height: 32
  - backgroundColor: palette.absent (#3a3a3c)
  - borderRadius: 4

**Play Button:**

- Full width (width: '100%')
- borderRadius: 12
- overflow: 'hidden'
- LinearGradient inner with:
  - colors: [palette.gradientStart, palette.gradientEnd]
  - start: {x: 0, y: 0}, end: {x: 1, y: 0} (horizontal gradient)
  - paddingVertical: 14
  - alignItems: 'center'
- Button text:
  - fontSize: 16
  - fontWeight: '700'
  - color: palette.textPrimary
  - Content: "Play Now"
- Pressed state: opacity 0.9, scale 0.98

**Free Play Link:**

- alignItems: 'center'
- paddingVertical: 12
- Text:
  - fontSize: 14
  - color: palette.textMuted
  - Content: "or try Free Play →"
  - "Free Play" portion:
    - color: palette.accentTeal (#3eb8b0)
    - fontWeight: '600'

**Word Length Selector (OPTIONAL - include for completeness):**

- marginTop: 24
- paddingTop: 16
- borderTopWidth: 1
- borderTopColor: palette.borderLight

- Label:

  - fontSize: 11
  - color: palette.textDim
  - textAlign: 'center'
  - marginBottom: 8
  - Content: "Word length preference"

- Pills container:

  - flexDirection: 'row'
  - gap: 8
  - justifyContent: 'center'

- Each pill:
  - width: 40
  - height: 36
  - borderRadius: 8
  - backgroundColor: palette.card
  - borderWidth: 1
  - borderColor: palette.borderLight
  - alignItems: 'center'
  - justifyContent: 'center'
  - Text: fontSize 14, fontWeight '600', color palette.textMuted
- Active pill:
  - backgroundColor: LinearGradient (gradientStart → gradientEnd)
  - borderColor: 'transparent'
  - Text color: white

```typescript
// src/screens/HomeScreen/components/WelcomeCard.tsx
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../../theme/colors';
import {formatShortDate} from '../../../utils/formatters';

interface WelcomeCardProps {
  userName?: string;
  onPlayDaily: () => void;
  onFreePlay: () => void;
}

export function WelcomeCard({userName, onPlayDaily, onFreePlay}: WelcomeCardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const dateDisplay = formatShortDate(today);
  const welcomeMessage = userName ? `Welcome, ${userName}! 👋` : 'Welcome! 👋';

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>{welcomeMessage}</Text>
        <Text style={styles.welcomeSubtext}>Ready for your first puzzle?</Text>
      </View>

      {/* Main Card with Gradient Border */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={[palette.gradientStart, palette.gradientEnd]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.gradientBorder}>
          <View style={styles.card}>
            {/* Label */}
            <Text style={styles.label}>TODAY'S DAILY CHALLENGE</Text>

            {/* Date */}
            <Text style={styles.date}>{dateDisplay}</Text>

            {/* Puzzle Info */}
            <Text style={styles.puzzleInfo}>5-letter word • 6 attempts</Text>

            {/* Mini Board Preview */}
            <View style={styles.miniBoard}>
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={styles.miniTile} />
              ))}
            </View>

            {/* Play Button */}
            <Pressable
              onPress={onPlayDaily}
              style={({pressed}) => [
                styles.playButton,
                pressed && styles.playButtonPressed,
              ]}
              accessibilityLabel="Play today's daily challenge"
              accessibilityRole="button">
              <LinearGradient
                colors={[palette.gradientStart, palette.gradientEnd]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.playButtonGradient}>
                <Text style={styles.playButtonText}>Play Now</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      {/* Subtle Free Play Link */}
      <Pressable
        onPress={onFreePlay}
        style={styles.freePlayLink}
        accessibilityLabel="Try free play mode"
        accessibilityRole="button">
        <Text style={styles.freePlayText}>
          or try <Text style={styles.freePlayAccent}>Free Play</Text> →
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: palette.textMuted,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 1,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 19,
    padding: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.gradientStart,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  date: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  puzzleInfo: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 20,
  },
  miniBoard: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 24,
  },
  miniTile: {
    width: 28,
    height: 32,
    backgroundColor: palette.absent,
    borderRadius: 4,
  },
  playButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  playButtonPressed: {
    opacity: 0.9,
    transform: [{scale: 0.98}],
  },
  playButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  freePlayLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  freePlayText: {
    fontSize: 14,
    color: palette.textMuted,
  },
  freePlayAccent: {
    color: palette.accentTeal,
    fontWeight: '600',
  },
});
```

---

# PART 4: HOME SCREEN - PHASE 3 ADD FRIENDS CARD

## File: `src/screens/HomeScreen/components/AddFriendsCard.tsx`

**Action:** CREATE NEW FILE

### EXACT DESIGN SPECIFICATIONS:

**Card Container:**

- backgroundColor: palette.accentTealDim (rgba(62, 184, 176, 0.15))
- borderWidth: 1
- borderColor: palette.accentTealBorder (rgba(62, 184, 176, 0.3))
- borderRadius: 16
- padding: 20
- marginTop: 16
- position: 'relative' (for dismiss button positioning)

**Dismiss Button (X):**

- position: 'absolute'
- top: 12
- right: 12
- width: 24
- height: 24
- alignItems: 'center'
- justifyContent: 'center'
- zIndex: 1
- Text: fontSize 20, color palette.textDim, fontWeight '300', content "×"
- hitSlop: {top: 10, bottom: 10, left: 10, right: 10}

**Icon Container:**

- width: 48
- height: 48
- backgroundColor: 'rgba(62, 184, 176, 0.2)'
- borderRadius: 12
- alignItems: 'center'
- justifyContent: 'center'
- marginBottom: 12
- Icon: fontSize 24, content "👥"

**Title:**

- fontSize: 16
- fontWeight: '700'
- color: palette.textPrimary
- marginBottom: 6
- Content: "Challenge Friends!"

**Description Text:**

- fontSize: 13
- color: palette.textMuted
- lineHeight: ~20 (1.5 \* fontSize)
- Content: "See how you stack up against friends on the daily leaderboard. Compare streaks, scores, and bragging rights."

**Add Friends Button:**

- backgroundColor: palette.accentTeal (#3eb8b0)
- borderRadius: 10
- paddingVertical: 12
- paddingHorizontal: 20
- alignItems: 'center'
- marginTop: 12
- Text: fontSize 14, fontWeight '600', color palette.textPrimary (#ffffff)
- Content: "Add Friends"
- Pressed state: opacity 0.9

```typescript
// src/screens/HomeScreen/components/AddFriendsCard.tsx
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {palette} from '../../../theme/colors';

interface AddFriendsCardProps {
  onAddFriends: () => void;
  onDismiss: () => void;
}

export function AddFriendsCard({onAddFriends, onDismiss}: AddFriendsCardProps) {
  return (
    <View style={styles.card}>
      {/* Dismiss Button */}
      <Pressable
        onPress={onDismiss}
        style={styles.dismissButton}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Text style={styles.dismissText}>×</Text>
      </Pressable>

      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>👥</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Challenge Friends!</Text>

      {/* Description */}
      <Text style={styles.description}>
        See how you stack up against friends on the daily leaderboard. Compare
        streaks, scores, and bragging rights.
      </Text>

      {/* Add Friends Button */}
      <Pressable
        onPress={onAddFriends}
        style={({pressed}) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        accessibilityLabel="Add friends"
        accessibilityRole="button">
        <Text style={styles.buttonText}>Add Friends</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.accentTealDim,
    borderWidth: 1,
    borderColor: palette.accentTealBorder,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dismissText: {
    fontSize: 20,
    color: palette.textDim,
    fontWeight: '300',
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(62, 184, 176, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 20,
  },
  button: {
    backgroundColor: palette.accentTeal,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
});
```

---

# PART 5: HOME SCREEN MAIN COMPONENT UPDATE

## File: `src/screens/HomeScreen/HomeScreen.tsx`

**Action:** REPLACE ENTIRE FILE

**Key Changes:**

1. Import useUserMaturity and dismissFriendsPrompt
2. Import WelcomeCard and AddFriendsCard
3. Calculate friendCount from leaderboard entries
4. Phase 1: Show ONLY WelcomeCard (no stats, no leaderboard, no free play button)
5. Phases 2-4: Show HeroCard with progressive features
6. Phase 3: Show AddFriendsCard between HeroCard and StatCards
7. Phase 2+: Show StatCards and FreePlayButton

```typescript
// src/screens/HomeScreen/HomeScreen.tsx
import React, {useCallback, useState} from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHomeScreenData} from '../../hooks/useHomeScreenData';
import {useUserMaturity, dismissFriendsPrompt} from '../../hooks/useUserMaturity';
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
import {WelcomeCard} from './components/WelcomeCard';
import {AddFriendsCard} from './components/AddFriendsCard';

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

  // Calculate friend count from leaderboard entries (exclude self)
  const friendCount = data.leaderboardEntries.filter(e => !e.isUser).length;
  const maturity = useUserMaturity(friendCount);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

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

  // Handle free play
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

  // Handle dismissing the friends prompt
  const handleDismissFriendsPrompt = useCallback(() => {
    dismissFriendsPrompt();
    setPromptDismissed(true);
  }, []);

  // User info
  const userInitial = user?.displayName?.charAt(0) ?? 'W';
  const userName = user?.displayName;

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

  // =====================================================
  // PHASE 1: First-time user - Simplified welcome screen
  // Show ONLY when: phase === 1 AND not_started (haven't begun a game)
  // =====================================================
  if (maturity.phase === 1 && data.screenState === 'not_started') {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: insets.bottom + 20},
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <HomeScreenHeader
            onProfilePress={onNavigateToStats}
            userInitial={userInitial}
          />

          <View style={styles.content}>
            {/* Phase 1: ONLY WelcomeCard - no stats, no leaderboard */}
            <WelcomeCard
              userName={userName}
              onPlayDaily={onPlayDaily}
              onFreePlay={handleFreePlay}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // =====================================================
  // PHASES 2-4: Progressive feature reveal
  // =====================================================

  // Determine what to show
  const showAddFriendsCard =
    maturity.phase === 3 &&
    maturity.shouldShowFriendsPrompt &&
    !promptDismissed &&
    data.screenState !== 'in_progress';

  const showStats = maturity.phase >= 2;
  const showFreePlayButton = maturity.phase >= 2 && data.screenState !== 'completed';
  const showFooterLink = maturity.phase >= 2;

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

        <View style={styles.content}>
          {/* Hero Card - Pass phase for conditional leaderboard rendering */}
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
            userPhase={maturity.phase}
          />

          {/* Phase 3 ONLY: Add Friends Prompt */}
          {showAddFriendsCard && (
            <AddFriendsCard
              onAddFriends={onNavigateToFriends}
              onDismiss={handleDismissFriendsPrompt}
            />
          )}

          {/* Phase 2+: Show Stats */}
          {showStats && (
            <StatCards winRate={data.winRate} avgGuesses={data.avgGuesses} />
          )}

          {/* Phase 2+: Free Play Button (hide in completed state) */}
          {showFreePlayButton && (
            <FreePlayButton
              disabled={data.screenState === 'in_progress'}
              onPress={handleFreePlay}
            />
          )}

          {/* Phase 2+: Footer link */}
          {showFooterLink && (
            <Pressable onPress={onNavigateToStats} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>View Full Stats</Text>
            </Pressable>
          )}
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
```

---

# PART 6: HEROCARD UPDATE

## File: `src/screens/HomeScreen/components/HeroCard/HeroCard.tsx`

**Action:** REPLACE ENTIRE FILE

**Key Changes:**

1. Add `userPhase` prop of type `UserMaturityPhase`
2. Only show leaderboard when `userPhase >= 4`
3. Only show streak badge when `userPhase >= 2` AND `streak > 0`
4. Pass conditional data to child components

```typescript
// src/screens/HomeScreen/components/HeroCard/HeroCard.tsx
import React from 'react';
import {HomeScreenState, HomeGameSummary, LeaderboardEntry} from '../../types';
import {UserMaturityPhase} from '../../../../hooks/useUserMaturity';
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
  userPhase: UserMaturityPhase;
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
  userPhase,
}: Props) {
  // Only show leaderboard in Phase 4 (has friends)
  const showLeaderboard = userPhase >= 4;

  // Only show streak badge in Phase 2+ AND streak > 0
  const displayStreak = userPhase >= 2 && streak > 0 ? streak : 0;

  // Leaderboard entries: only pass if phase 4+
  const displayLeaderboard = showLeaderboard ? leaderboardEntries : [];

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
        streak={displayStreak}
        leaderboardType={leaderboardType}
        leaderboardEntries={displayLeaderboard}
        onFreePlay={onFreePlay}
        onLeaderboardPress={onLeaderboardPress}
      />
    );
  }

  // Default: not_started
  return (
    <DailyCard
      streak={displayStreak}
      puzzleNumber={getDayOfYear()}
      wordLength={5}
      leaderboardType={leaderboardType}
      leaderboardEntries={displayLeaderboard}
      onPlayDaily={onPlayDaily}
      onLeaderboardPress={onLeaderboardPress}
    />
  );
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
```

---

# PART 7: RESULT SCREEN - TYPES UPDATE

## File: `src/components/ResultModal/types.ts`

**Action:** REPLACE ENTIRE FILE

```typescript
// src/components/ResultModal/types.ts
import { TileState } from '../../logic/evaluateGuess'
import { getTileColors } from '../../theme/getColors'

export type TileColors = ReturnType<typeof getTileColors>

export type GameStatus = 'playing' | 'won' | 'lost'

export type UserMaturityPhase = 1 | 2 | 3 | 4

/**
 * Leaderboard entry for result screen display
 */
export interface ResultLeaderboardEntry {
  id: string
  name: string
  letter: string // First letter for avatar
  guesses: number | null // null = hasn't played yet
  isUser: boolean
  rank: number
}

export type ResultModalProps = {
  visible: boolean
  status: GameStatus
  rows: string[]
  maxRows: number
  length: number
  feedback: TileState[][]
  dateISO: string
  answer: string
  tileColors: TileColors
  playAgainIsFreeMode: boolean
  onPlayAgain: () => void
  onClose?: () => void

  // REQUIRED: Phase-based props
  userPhase: UserMaturityPhase
  currentStreak: number
  maxStreak: number

  // OPTIONAL: Social props (Phase 3-4)
  friendsLeaderboard?: ResultLeaderboardEntry[]
  onAddFriends?: () => void
  onViewLeaderboard?: () => void
}
```

---

# PART 8: RESULT SCREEN - ONBOARDING CARDS

## File: `src/components/ResultModal/OnboardingCards.tsx`

**Action:** CREATE NEW FILE

This file contains 5 components for phase-specific result screen content:

### Component 1: StreakIntroCard (Phase 1 Win)

**EXACT DESIGN SPECIFICATIONS:**

**Card Container:**

- backgroundColor: 'rgba(251, 146, 60, 0.12)' (orange tinted)
- borderWidth: 1
- borderColor: 'rgba(251, 146, 60, 0.25)'
- borderRadius: 16
- padding: 20
- marginBottom: 16

**Icon Container:**

- width: 48
- height: 48
- backgroundColor: 'rgba(251, 146, 60, 0.2)'
- borderRadius: 12
- alignItems: 'center'
- justifyContent: 'center'
- marginBottom: 12
- Icon: fontSize 24, content "🔥"

**Title:**

- fontSize: 16
- fontWeight: '700'
- color: palette.textPrimary
- marginBottom: 6
- Content: "Start a Streak!"

**Text:**

- fontSize: 13
- color: palette.textMuted
- lineHeight: 20
- Content: "Come back tomorrow to keep your streak alive. Consecutive daily puzzles build your streak — miss a day and it resets!"

**Streak Badge (inside card):**

- alignSelf: 'flex-start'
- backgroundColor: 'rgba(251, 146, 60, 0.15)'
- paddingHorizontal: 14
- paddingVertical: 8
- borderRadius: 20
- marginTop: 12
- Text: fontSize 15, fontWeight '700', color '#fb923c'
- Content: "🔥 {streak} day streak"

### Component 2: EncouragementCard (Phase 1 Loss)

**EXACT DESIGN SPECIFICATIONS:**

Same structure as StreakIntroCard but with teal colors:

- backgroundColor: palette.accentTealDim
- borderColor: palette.accentTealBorder
- Icon background: 'rgba(62, 184, 176, 0.2)'
- Icon: "💪"
- Title: "Practice makes perfect!"
- Text: "Try Free Play mode to sharpen your skills. Tomorrow's a new day with a new puzzle!"
- NO streak badge

### Component 3: StreakDisplay (Phase 2-3)

**EXACT DESIGN SPECIFICATIONS:**

**Container:**

- flexDirection: 'row'
- gap: 12
- padding: 16
- backgroundColor: 'rgba(52, 199, 89, 0.1)' (success dim)
- borderWidth: 1
- borderColor: 'rgba(52, 199, 89, 0.2)'
- borderRadius: 12
- marginBottom: 16

**Each Streak Item:**

- flex: 1
- alignItems: 'center'

**Streak Label:**

- fontSize: 12
- fontWeight: '600'
- color: '#34c759'
- marginBottom: 4
- Content: "🔥 Current Streak" or "⭐ Best Streak"

**Streak Value:**

- fontSize: 18
- fontWeight: '700'
- color: '#34c759'
- Content: "{value} days"

### Component 4: AddFriendsPromptCard (Phase 3)

**EXACT DESIGN SPECIFICATIONS:**

Same as home screen AddFriendsCard but without dismiss button:

- backgroundColor: palette.accentTealDim
- borderWidth: 1
- borderColor: palette.accentTealBorder
- borderRadius: 16
- padding: 20
- marginBottom: 16
- Icon: "👥" in teal container
- Title: "Challenge Friends!"
- Text: "See how you stack up! Compare your score to friends on the daily leaderboard."
- Button: teal background, "Add Friends"

### Component 5: StreakBadgeInline (Phase 4)

**EXACT DESIGN SPECIFICATIONS:**

**Container:**

- alignItems: 'center'
- marginBottom: 16

**Badge:**

- alignSelf: 'center'
- backgroundColor: 'rgba(251, 146, 60, 0.15)'
- paddingHorizontal: 14
- paddingVertical: 8
- borderRadius: 20
- Text: fontSize 15, fontWeight '700', color '#fb923c'
- Content: "🔥 {streak} day streak"

```typescript
// src/components/ResultModal/OnboardingCards.tsx
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {palette} from '../../theme/colors';

// ============================================
// Phase 1 Win: Streak Introduction Card
// ============================================
interface StreakIntroProps {
  streak: number;
}

export function StreakIntroCard({streak}: StreakIntroProps) {
  return (
    <View style={styles.streakIntroCard}>
      <View style={styles.orangeIconContainer}>
        <Text style={styles.cardIcon}>🔥</Text>
      </View>
      <Text style={styles.cardTitle}>Start a Streak!</Text>
      <Text style={styles.cardText}>
        Come back tomorrow to keep your streak alive. Consecutive daily puzzles
        build your streak — miss a day and it resets!
      </Text>
      <View style={styles.orangeStreakBadge}>
        <Text style={styles.orangeStreakText}>🔥 {streak} day streak</Text>
      </View>
    </View>
  );
}

// ============================================
// Phase 1 Loss: Encouragement Card
// ============================================
export function EncouragementCard() {
  return (
    <View style={styles.encouragementCard}>
      <View style={styles.tealIconContainer}>
        <Text style={styles.cardIcon}>💪</Text>
      </View>
      <Text style={styles.cardTitle}>Practice makes perfect!</Text>
      <Text style={styles.cardText}>
        Try Free Play mode to sharpen your skills. Tomorrow's a new day with a
        new puzzle!
      </Text>
    </View>
  );
}

// ============================================
// Phase 2-3: Compact Streak Display
// ============================================
interface StreakDisplayProps {
  currentStreak: number;
  maxStreak: number;
}

export function StreakDisplay({currentStreak, maxStreak}: StreakDisplayProps) {
  // Don't render if no streak data
  if (currentStreak === 0 && maxStreak === 0) {
    return null;
  }

  return (
    <View style={styles.streakSection}>
      {currentStreak > 0 && (
        <View style={styles.streakItem}>
          <Text style={styles.streakLabel}>🔥 Current Streak</Text>
          <Text style={styles.streakValue}>{currentStreak} days</Text>
        </View>
      )}
      {maxStreak > 0 && (
        <View style={styles.streakItem}>
          <Text style={styles.streakLabel}>⭐ Best Streak</Text>
          <Text style={styles.streakValue}>{maxStreak} days</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// Phase 3: Add Friends Prompt
// ============================================
interface AddFriendsPromptProps {
  onAddFriends?: () => void;
}

export function AddFriendsPromptCard({onAddFriends}: AddFriendsPromptProps) {
  return (
    <View style={styles.addFriendsCard}>
      <View style={styles.tealIconContainer}>
        <Text style={styles.cardIcon}>👥</Text>
      </View>
      <Text style={styles.cardTitle}>Challenge Friends!</Text>
      <Text style={styles.cardText}>
        See how you stack up! Compare your score to friends on the daily
        leaderboard.
      </Text>
      <Pressable
        onPress={onAddFriends}
        style={({pressed}) => [
          styles.tealButton,
          pressed && styles.buttonPressed,
        ]}
        accessibilityLabel="Add friends"
        accessibilityRole="button">
        <Text style={styles.tealButtonText}>Add Friends</Text>
      </Pressable>
    </View>
  );
}

// ============================================
// Phase 4: Compact Inline Streak Badge
// ============================================
interface StreakBadgeInlineProps {
  streak: number;
}

export function StreakBadgeInline({streak}: StreakBadgeInlineProps) {
  if (streak === 0) {
    return null;
  }

  return (
    <View style={styles.inlineBadgeContainer}>
      <View style={styles.orangeStreakBadge}>
        <Text style={styles.orangeStreakText}>🔥 {streak} day streak</Text>
      </View>
    </View>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  // ========== STREAK INTRO CARD (Phase 1 Win) ==========
  streakIntroCard: {
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.25)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  orangeIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(251, 146, 60, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  // ========== ENCOURAGEMENT CARD (Phase 1 Loss) ==========
  encouragementCard: {
    backgroundColor: palette.accentTealDim,
    borderWidth: 1,
    borderColor: palette.accentTealBorder,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  tealIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(62, 184, 176, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  // ========== ADD FRIENDS CARD (Phase 3) ==========
  addFriendsCard: {
    backgroundColor: palette.accentTealDim,
    borderWidth: 1,
    borderColor: palette.accentTealBorder,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  // ========== SHARED CARD STYLES ==========
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 20,
  },

  // ========== ORANGE STREAK BADGE ==========
  orangeStreakBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  orangeStreakText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fb923c',
  },

  // ========== INLINE BADGE CONTAINER (Phase 4) ==========
  inlineBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // ========== STREAK SECTION (Phase 2-3) ==========
  streakSection: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34c759',
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34c759',
  },

  // ========== TEAL BUTTON ==========
  tealButton: {
    backgroundColor: palette.accentTeal,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  tealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
});
```

---

# PART 9: RESULT SCREEN - LEADERBOARD PREVIEW

## File: `src/components/ResultModal/ResultLeaderboardPreview.tsx`

**Action:** CREATE NEW FILE

### EXACT DESIGN SPECIFICATIONS:

**Container:**

- backgroundColor: palette.card (#1c1c1e)
- borderWidth: 1
- borderColor: palette.borderLight (#2c2c2e)
- borderRadius: 14
- padding: 16
- marginBottom: 16

**Header Row:**

- flexDirection: 'row'
- justifyContent: 'space-between'
- alignItems: 'center'
- marginBottom: 12

**Title:**

- fontSize: 11
- fontWeight: '600'
- color: palette.textMuted
- letterSpacing: 0.5
- textTransform: 'uppercase'
- Content: "TODAY'S RANKINGS"

**See All Link:**

- fontSize: 12
- fontWeight: '600'
- color: palette.accentTeal
- Content: "See All →"

**Entry Row:**

- flexDirection: 'row'
- alignItems: 'center'
- paddingVertical: 10
- If not last: borderBottomWidth 1, borderBottomColor palette.borderLight

**User Entry Highlight:**

- backgroundColor: 'rgba(99, 102, 241, 0.08)'
- marginHorizontal: -8
- paddingHorizontal: 8
- borderRadius: 8

**Rank Badge:**

- width: 24
- height: 24
- borderRadius: 6
- alignItems: 'center'
- justifyContent: 'center'
- Colors:
  - Rank 1: backgroundColor #fbbf24 (gold)
  - Rank 2: backgroundColor #94a3b8 (silver)
  - Rank 3: backgroundColor #d97706 (bronze)
  - User: LinearGradient from gradientStart to gradientEnd
- Text: fontSize 12, fontWeight '700'
  - For gold/silver/bronze: color '#000'
  - For user gradient: color palette.textPrimary

**Avatar:**

- width: 32
- height: 32
- borderRadius: 16 (full circle)
- marginLeft: 12
- LinearGradient background:
  - User: [palette.accentTeal, '#2dd4bf']
  - Others: [palette.gradientStart, palette.gradientEnd]
- Text: fontSize 14, fontWeight '700', color palette.textPrimary

**Name:**

- flex: 1
- fontSize: 14
- fontWeight: '600'
- marginLeft: 12
- color: palette.textPrimary (or palette.accentTeal if isUser)

**Score:**

- fontSize: 13
- fontWeight: '600'
- color: palette.textMuted (or palette.accentTeal if isUser)
- Content: "{guesses}/6" or "—" if null

```typescript
// src/components/ResultModal/ResultLeaderboardPreview.tsx
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {palette} from '../../theme/colors';
import {ResultLeaderboardEntry} from './types';

interface Props {
  entries: ResultLeaderboardEntry[];
  onViewAll?: () => void;
}

export function ResultLeaderboardPreview({entries, onViewAll}: Props) {
  if (!entries || entries.length === 0) {
    return null;
  }

  // Show top 3 only
  const displayEntries = entries.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>TODAY'S RANKINGS</Text>
        {onViewAll && (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAllLink}>See All →</Text>
          </Pressable>
        )}
      </View>

      {/* Entries */}
      <View style={styles.entries}>
        {displayEntries.map((entry, index) => {
          const isLast = index === displayEntries.length - 1;

          return (
            <View
              key={entry.id}
              style={[
                styles.entry,
                entry.isUser && styles.entryHighlight,
                !isLast && styles.entryBorder,
              ]}>
              {/* Rank Badge */}
              {entry.isUser ? (
                <LinearGradient
                  colors={[palette.gradientStart, palette.gradientEnd]}
                  style={styles.rankBadge}>
                  <Text style={styles.rankTextLight}>{entry.rank}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.rankBadge,
                    {backgroundColor: getRankColor(entry.rank)},
                  ]}>
                  <Text style={styles.rankTextDark}>{entry.rank}</Text>
                </View>
              )}

              {/* Avatar */}
              <LinearGradient
                colors={
                  entry.isUser
                    ? [palette.accentTeal, '#2dd4bf']
                    : [palette.gradientStart, palette.gradientEnd]
                }
                style={styles.avatar}>
                <Text style={styles.avatarText}>{entry.letter}</Text>
              </LinearGradient>

              {/* Name */}
              <Text style={[styles.name, entry.isUser && styles.nameUser]}>
                {entry.name}
              </Text>

              {/* Score */}
              <Text style={[styles.score, entry.isUser && styles.scoreUser]}>
                {entry.guesses !== null ? `${entry.guesses}/6` : '—'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#fbbf24'; // gold
    case 2:
      return '#94a3b8'; // silver
    case 3:
      return '#d97706'; // bronze
    default:
      return palette.textDim;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textMuted,
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.accentTeal,
  },
  entries: {},
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  entryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  entryHighlight: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTextLight: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  rankTextDark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    marginLeft: 12,
  },
  nameUser: {
    color: palette.accentTeal,
  },
  score: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
  },
  scoreUser: {
    color: palette.accentTeal,
  },
});
```

---

# PART 10: RESULT MODAL MAIN COMPONENT

## File: `src/components/ResultModal/ResultModal.tsx`

**Action:** REPLACE ENTIRE FILE

**Key Changes:**

1. Import phase-specific components from OnboardingCards
2. Import ResultLeaderboardPreview
3. Add ScrollView for longer content
4. Add close button (optional via onClose prop)
5. `renderPhaseContent()` switch statement handles all 4 phases
6. Phase 4: Show leaderboard ABOVE the grid, compact grid styling

```typescript
// src/components/ResultModal/ResultModal.tsx
import React from 'react';
import {Modal, View, Text, Pressable, ScrollView, Share} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../../theme/colors';
import {
  generateShareText,
  getResultEmoji,
  getResultTitle,
} from '../../logic/shareResult';
import {styles} from './styles';
import type {ResultModalProps} from './types';

// Phase-specific components
import {
  StreakIntroCard,
  EncouragementCard,
  StreakDisplay,
  AddFriendsPromptCard,
  StreakBadgeInline,
} from './OnboardingCards';
import {ResultLeaderboardPreview} from './ResultLeaderboardPreview';

export const ResultModal = React.memo(
  ({
    visible,
    status,
    rows,
    maxRows,
    length,
    feedback,
    dateISO,
    answer,
    tileColors,
    playAgainIsFreeMode,
    onPlayAgain,
    onClose,
    // Phase-based props
    userPhase,
    currentStreak,
    maxStreak,
    // Social props
    friendsLeaderboard,
    onAddFriends,
    onViewLeaderboard,
  }: ResultModalProps) => {
    const insets = useSafeAreaInsets();
    const won = status === 'won';

    const handleShare = async () => {
      const shareData = generateShareText({
        length,
        maxRows,
        guesses: rows.length,
        won,
        feedback,
        date: dateISO,
      });
      try {
        await Share.share({
          message: shareData.text,
        });
      } catch (_error) {
        // User cancelled or error
      }
    };

    // =========================================
    // Render phase-specific content
    // =========================================
    const renderPhaseContent = () => {
      switch (userPhase) {
        case 1:
          // Phase 1: First game - educational content
          if (won) {
            return <StreakIntroCard streak={currentStreak} />;
          } else {
            return <EncouragementCard />;
          }

        case 2:
          // Phase 2: Building habit - compact streak display
          return (
            <StreakDisplay currentStreak={currentStreak} maxStreak={maxStreak} />
          );

        case 3:
          // Phase 3: Ready for social - streak + friends prompt
          return (
            <>
              <StreakDisplay
                currentStreak={currentStreak}
                maxStreak={maxStreak}
              />
              <AddFriendsPromptCard onAddFriends={onAddFriends} />
            </>
          );

        case 4:
          // Phase 4: Full social - leaderboard hero + compact streak badge
          return (
            <>
              {friendsLeaderboard && friendsLeaderboard.length > 0 && (
                <ResultLeaderboardPreview
                  entries={friendsLeaderboard}
                  onViewAll={onViewLeaderboard}
                />
              )}
              <StreakBadgeInline streak={currentStreak} />
            </>
          );

        default:
          return null;
      }
    };

    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.resultModalCard,
              {paddingBottom: Math.max(insets.bottom, 20)},
            ]}>
            {/* Close button (optional) */}
            {onClose && (
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={8}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}>
              {/* Header */}
              <View style={styles.resultHeader}>
                <Text style={styles.resultEmoji}>
                  {getResultEmoji(rows.length, maxRows, won)}
                </Text>
                <Text style={styles.resultTitle}>
                  {getResultTitle(rows.length, maxRows, won)}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {won
                    ? `You got it in ${rows.length} guess${
                        rows.length !== 1 ? 'es' : ''
                      }`
                    : 'Better luck next time'}
                </Text>
              </View>

              {/* Score and Word Section */}
              <View style={styles.scoreWordRow}>
                <View style={styles.scoreSection}>
                  <Text style={styles.scoreLabel}>Score</Text>
                  <Text
                    style={[
                      styles.scoreValue,
                      !won && styles.scoreValueLost,
                    ]}>
                    {won ? `${rows.length}/${maxRows}` : `X/${maxRows}`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.wordDisplay,
                    !won && styles.wordDisplayLost,
                  ]}>
                  <Text
                    style={[styles.wordLabel, !won && styles.wordLabelLost]}>
                    {won ? 'The word' : 'The word was'}
                  </Text>
                  <Text
                    style={[styles.wordText, !won && styles.wordTextLost]}>
                    {answer.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Mini Grid - more compact in Phase 4 */}
              <View
                style={[
                  styles.gridSection,
                  userPhase === 4 && styles.gridSectionCompact,
                ]}>
                {userPhase !== 4 && (
                  <Text style={styles.gridLabel}>Your Guesses</Text>
                )}
                <View style={styles.guessGrid}>
                  {feedback.map((row, rIdx) => (
                    <View key={rIdx} style={styles.guessRow}>
                      {row.map((state, cIdx) => {
                        const tileColor =
                          state === 'correct'
                            ? tileColors.correct
                            : state === 'present'
                            ? tileColors.present
                            : tileColors.absent;
                        return (
                          <View
                            key={cIdx}
                            style={[
                              styles.guessTile,
                              {backgroundColor: tileColor},
                            ]}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>

              {/* Phase-specific content */}
              {renderPhaseContent()}

              {/* Buttons */}
              <View style={styles.resultButtonGroup}>
                <Pressable
                  style={({pressed}) => [
                    styles.btnShare,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleShare}>
                  <Text style={styles.btnShareIcon}>📤</Text>
                  <Text style={styles.btnShareText}>Share</Text>
                </Pressable>
                <Pressable
                  onPress={onPlayAgain}
                  style={({pressed}) => [
                    styles.btnPlayAgainWrapper,
                    pressed && styles.btnPressed,
                  ]}>
                  <LinearGradient
                    colors={[palette.gradientStart, palette.gradientEnd]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.btnPlayAgain}>
                    <Text style={styles.btnPlayAgainText}>
                      {playAgainIsFreeMode ? 'Play Free Mode' : 'Play Again'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

ResultModal.displayName = 'ResultModal';
```

---

# PART 11: RESULT MODAL STYLES

## File: `src/components/ResultModal/styles.ts`

**Action:** REPLACE ENTIRE FILE

```typescript
// src/components/ResultModal/styles.ts
import { StyleSheet } from 'react-native'
import { palette } from '../../theme/colors'

export const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalCard: {
    width: '92%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: palette.card,
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 24,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: palette.textMuted,
    fontWeight: '300',
    marginTop: -2,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '500',
  },
  scoreWordRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    minWidth: 80,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#30d158',
    lineHeight: 32,
  },
  scoreValueLost: {
    color: '#ff453a',
  },
  wordDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
    borderRadius: 12,
  },
  wordDisplayLost: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
  wordLabel: {
    fontSize: 11,
    color: '#30d158',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  wordLabelLost: {
    color: '#ff453a',
  },
  wordText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#30d158',
    letterSpacing: 2,
  },
  wordTextLost: {
    color: '#ff453a',
  },
  gridSection: {
    marginBottom: 20,
  },
  gridSectionCompact: {
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  guessGrid: {
    alignItems: 'center',
    gap: 4,
  },
  guessRow: {
    flexDirection: 'row',
    gap: 4,
  },
  guessTile: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  resultButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnShare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.accentPurpleLight,
    borderWidth: 1,
    borderColor: palette.accentPurpleBorder,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  btnShareIcon: {
    fontSize: 16,
  },
  btnShareText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.accentPurple,
  },
  btnPlayAgainWrapper: {
    flex: 1,
  },
  btnPlayAgain: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPlayAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
})
```

---

# PART 12: GAMESCREEN INTEGRATION

## File: `src/screens/GameScreen.tsx`

**Action:** MODIFY (not full replacement)

### Changes to make:

**1. Add imports at top:**

```typescript
import { useUserMaturity } from '../hooks/useUserMaturity'
import type { ResultLeaderboardEntry } from '../components/ResultModal/types'
```

**2. Inside the GameScreen component, after other hooks:**

```typescript
// Add after other useState/useEffect calls:
const maturity = useUserMaturity(0) // TODO: Pass actual friend count when available
```

**3. Find the `<ResultModal` component and update its props:**

**Before:**

```typescript
<ResultModal
  visible={showResult}
  status={status}
  rows={rows}
  maxRows={maxRows}
  length={length}
  feedback={feedback}
  dateISO={dateISO}
  answer={answer}
  tileColors={tileColors}
  playAgainIsFreeMode={playAgainIsFreeMode}
  onPlayAgain={() => {
    setShowResult(false);
    loadNew();
  }}
/>
```

**After:**

```typescript
<ResultModal
  visible={showResult}
  status={status}
  rows={rows}
  maxRows={maxRows}
  length={length}
  feedback={feedback}
  dateISO={dateISO}
  answer={answer}
  tileColors={tileColors}
  playAgainIsFreeMode={playAgainIsFreeMode}
  onPlayAgain={() => {
    setShowResult(false);
    loadNew();
  }}
  onClose={() => setShowResult(false)}
  // Phase-based props
  userPhase={maturity.phase}
  currentStreak={maturity.currentStreak}
  maxStreak={maturity.maxStreak}
  // Social props (pass undefined until friends integration)
  friendsLeaderboard={undefined}
  onAddFriends={() => {
    setShowResult(false);
    // Navigate to friends screen when available
  }}
  onViewLeaderboard={() => {
    setShowResult(false);
    // Navigate to leaderboard when available
  }}
/>
```

---

# PART 13: SUMMARY CHECKLIST

## Files to CREATE (6 files):

- [ ] `src/hooks/useUserMaturity.ts`
- [ ] `src/screens/HomeScreen/components/WelcomeCard.tsx`
- [ ] `src/screens/HomeScreen/components/AddFriendsCard.tsx`
- [ ] `src/components/ResultModal/OnboardingCards.tsx`
- [ ] `src/components/ResultModal/ResultLeaderboardPreview.tsx`

## Files to REPLACE ENTIRELY (5 files):

- [ ] `src/screens/HomeScreen/HomeScreen.tsx`
- [ ] `src/screens/HomeScreen/components/HeroCard/HeroCard.tsx`
- [ ] `src/components/ResultModal/types.ts`
- [ ] `src/components/ResultModal/ResultModal.tsx`
- [ ] `src/components/ResultModal/styles.ts`

## Files to MODIFY (2 files):

- [ ] `src/hooks/index.ts` — Add export for useUserMaturity
- [ ] `src/screens/GameScreen.tsx` — Add imports and update ResultModal props

---

# PART 14: TESTING VERIFICATION

After implementation, verify these exact scenarios:

## Home Screen Tests:

| Test Case                                    | Expected Behavior                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| New user (0 games), not_started              | Shows ONLY WelcomeCard with gradient border, welcome message, mini board, Play Now button, subtle Free Play link. NO stats, NO leaderboard. |
| Phase 2 (2-4 games), not_started             | Shows standard DailyCard with streak badge (if > 0), StatCards, FreePlayButton, footer link. NO leaderboard.                                |
| Phase 3 (5+ games or 3+ streak), not_started | Shows DailyCard, AddFriendsCard (teal with icon), StatCards. NO leaderboard.                                                                |
| Phase 3, dismiss AddFriendsCard              | Card disappears, doesn't return for 7 days                                                                                                  |
| Phase 4 (has friends), not_started           | Shows DailyCard WITH leaderboard preview, StatCards. NO AddFriendsCard.                                                                     |
| Any phase, in_progress                       | Shows ContinueCard regardless of phase                                                                                                      |
| Any phase, completed                         | Shows CompletedCard with phase-appropriate features                                                                                         |

## Result Screen Tests:

| Test Case     | Expected Behavior                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Phase 1, WIN  | Shows StreakIntroCard with orange background, "🔥" icon, "Start a Streak!" title, explanation text, orange streak badge |
| Phase 1, LOSS | Shows EncouragementCard with teal background, "💪" icon, "Practice makes perfect!", NO streak badge                     |
| Phase 2       | Shows StreakDisplay (horizontal green section with current/max streak)                                                  |
| Phase 3       | Shows StreakDisplay + AddFriendsPromptCard (teal with Add Friends button)                                               |
| Phase 4       | Shows ResultLeaderboardPreview (top 3 with avatars, ranks, See All), then StreakBadgeInline                             |
| All phases    | Share button works, Play Again button works                                                                             |

---

# PART 15: DESIGN SPECIFICATIONS REFERENCE

## Color Reference (quick lookup):

```
ORANGE (streak):
- Background: rgba(251, 146, 60, 0.12)
- Border: rgba(251, 146, 60, 0.25)
- Icon bg: rgba(251, 146, 60, 0.2)
- Badge bg: rgba(251, 146, 60, 0.15)
- Text: #fb923c

TEAL (friends/encouragement):
- Background: rgba(62, 184, 176, 0.15)
- Border: rgba(62, 184, 176, 0.3)
- Icon bg: rgba(62, 184, 176, 0.2)
- Button: #3eb8b0
- Text: #3eb8b0

GREEN (success/streak display):
- Background: rgba(52, 199, 89, 0.1)
- Border: rgba(52, 199, 89, 0.2)
- Text: #34c759

GRADIENT:
- Start: #6366f1
- End: #8b5cf6

RANK BADGES:
- Gold: #fbbf24
- Silver: #94a3b8
- Bronze: #d97706
```

## Spacing Reference:

```
Card padding: 20-24px
Card border radius: 16-20px
Button padding: 12-14px vertical
Button border radius: 10-12px
Icon container: 48x48px, border radius 12px
Gap between elements: 6-12px
Mini tile: 28x32px, gap 4px
Avatar: 32x32px (or 28x28 in result leaderboard)
Rank badge: 24x24px (or 22x22 in result leaderboard)
```
