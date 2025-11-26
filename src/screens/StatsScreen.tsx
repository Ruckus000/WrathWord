// src/screens/StatsScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {getProfile, getStatsForLength, getWinRate, getTotalStats} from '../storage/profile';
import {palette} from '../theme/colors';

type Props = {
  onBack: () => void;
};

type Tab = 'statistics' | 'achievements' | 'settings';

export default function StatsScreen({onBack}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('statistics');
  const profile = getProfile();

  // Get default/current length stats
  const defaultLength = profile.preferences.defaultLength;
  const stats = getStatsForLength(defaultLength);
  const winRate = getWinRate(defaultLength);
  const totalStats = getTotalStats();

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profile & Stats</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={[palette.gradientStart, palette.gradientEnd]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>W</Text>
          </LinearGradient>
          <Text style={styles.profileName}>Wrath</Text>
          <View style={styles.profileLevel}>
            <Text style={styles.levelIcon}>⭐</Text>
            <Text style={styles.levelText}>Level {Math.floor(totalStats.won / 10) + 1}</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, {width: `${(totalStats.won % 10) * 10}%`}]}>
              <LinearGradient
                colors={[palette.gradientStart, palette.gradientEnd]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
          <Text style={styles.xpText}>{totalStats.won % 10 * 100} / 1,000 XP</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNav}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'statistics' && styles.tabBtnActive]}
            onPress={() => setActiveTab('statistics')}>
            <Text style={[styles.tabBtnText, activeTab === 'statistics' && styles.tabBtnTextActive]}>
              Statistics
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'achievements' && styles.tabBtnActive]}
            onPress={() => setActiveTab('achievements')}>
            <Text style={[styles.tabBtnText, activeTab === 'achievements' && styles.tabBtnTextActive]}>
              Achievements
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
            onPress={() => setActiveTab('settings')}>
            <Text style={[styles.tabBtnText, activeTab === 'settings' && styles.tabBtnTextActive]}>
              Settings
            </Text>
          </Pressable>
        </View>

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardFeatured]}>
                <Text style={styles.streakValue}>🔥 {totalStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalStats.played}</Text>
                <Text style={styles.statLabel}>Games Played</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalStats.winRate}%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalStats.won}</Text>
                <Text style={styles.statLabel}>Games Won</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalStats.maxStreak}</Text>
                <Text style={styles.statLabel}>Max Streak</Text>
              </View>
            </View>

            {/* Guess Distribution */}
            <View style={styles.distributionSection}>
              <Text style={styles.sectionTitle}>Guess Distribution</Text>
              {[1, 2, 3, 4, 5, 6].map(guessNum => {
                const count = stats.guessDistribution[guessNum] || 0;
                const maxCount = Math.max(...Object.values(stats.guessDistribution), 1);
                const percentage = (count / maxCount) * 100;
                return (
                  <View key={guessNum} style={styles.distributionRow}>
                    <Text style={styles.distributionLabel}>{guessNum}</Text>
                    <View style={styles.distributionBarBg}>
                      <View style={[styles.distributionBar, {width: `${Math.max(percentage, count > 0 ? 10 : 0)}%`}]}>
                        <LinearGradient
                          colors={[palette.gradientStart, palette.gradientEnd]}
                          start={{x: 0, y: 0}}
                          end={{x: 1, y: 0}}
                          style={StyleSheet.absoluteFill}
                        />
                        {count > 0 && <Text style={styles.distributionCount}>{count}</Text>}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <View style={styles.placeholderView}>
            <Text style={styles.placeholderText}>🏆</Text>
            <Text style={styles.placeholderTitle}>Achievements Coming Soon</Text>
            <Text style={styles.placeholderSubtitle}>Track your progress and unlock badges</Text>
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <View style={styles.menuSection}>
            <MenuItem
              icon="❓"
              title="How to Play"
              subtitle="Learn the game rules"
            />
            <MenuItem
              icon="📤"
              title="Share WrathWord"
              subtitle="Invite friends to play"
            />
            <MenuItem
              icon="ℹ️"
              title="About"
              subtitle="Version 1.0.0"
            />
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

function MenuItem({icon, title, subtitle}: {icon: string; title: string; subtitle: string}) {
  return (
    <Pressable style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>{icon}</Text>
        </View>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: palette.textPrimary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  profileSection: {
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  profileLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: palette.accentPurpleLight,
    borderWidth: 1,
    borderColor: palette.accentPurpleBorder,
    borderRadius: 20,
    marginBottom: 20,
  },
  levelIcon: {
    fontSize: 14,
  },
  levelText: {
    fontSize: 14,
    color: palette.accentPurple,
    fontWeight: '500',
  },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: palette.tileEmpty,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpText: {
    fontSize: 12,
    color: palette.textDim,
  },
  tabNav: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    backgroundColor: palette.tileEmpty,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: palette.accentPurpleLight,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textDim,
  },
  tabBtnTextActive: {
    color: palette.accentPurple,
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 'calc(50% - 6px)',
    minWidth: 160,
  },
  statCardFeatured: {
    width: '100%',
    backgroundColor: palette.accentPurpleLight,
    borderColor: palette.accentPurpleBorder,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.warning,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  distributionSection: {
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: palette.textSecondary,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  distributionLabel: {
    width: 20,
    fontSize: 14,
    color: palette.textDim,
    textAlign: 'center',
  },
  distributionBarBg: {
    flex: 1,
    height: 28,
    backgroundColor: palette.tileEmpty,
    borderRadius: 6,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
    overflow: 'hidden',
  },
  distributionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  placeholderView: {
    padding: 40,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: palette.textDim,
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.accentPurpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 20,
  },
  menuText: {
    gap: 2,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: palette.textDim,
  },
  menuArrow: {
    fontSize: 24,
    color: palette.keyAction,
  },
  bottomSpacing: {
    height: 40,
  },
});
