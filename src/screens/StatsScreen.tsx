// src/screens/StatsScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  getProfile,
  getStatsForLength,
  getTotalStats,
  resetStats,
  updatePreferences,
} from '../storage/profile';
import {VALID_LENGTHS} from '../config/gameConfig';
import {APP_CONFIG} from '../config/appConfig';
import {profileService, competitionService, CompetitionData} from '../services/data';
import {useAuth} from '../contexts/AuthContext';
import {palette} from '../theme/colors';
import {Toggle} from '../components/Toggle';
import {triggerImpact} from '../utils/haptics';
import {openFeedbackEmail} from '../utils/feedback';
import {
  ChevronLeft,
  ChevronRight,
  HapticsIcon,
  EyeIcon,
  UserIcon,
  DocumentIcon,
  ShieldIcon,
  ChatIcon,
  TrashIcon,
} from '../components/icons/SettingsIcons';
import CompeteCard from '../components/CompeteCard';
import ProfileScreen from './ProfileScreen';
import LegalDocumentScreen from './LegalDocumentScreen';

type Props = {
  onBack: () => void;
  onNavigateToFriends?: () => void;
};

export default function StatsScreen({onBack, onNavigateToFriends}: Props) {
  const insets = useSafeAreaInsets();
  const {isAuthenticated, isDevelopmentMode, user, signOut} = useAuth();
  const profile = getProfile();

  const [selectedLength, setSelectedLength] = useState(
    profile.preferences.defaultLength,
  );
  const [haptics, setHaptics] = useState(
    profile.preferences.hapticsEnabled ?? true,
  );
  const [highContrast, setHighContrast] = useState(
    profile.preferences.highContrastEnabled ?? false,
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null);

  // Load competition data on mount
  useEffect(() => {
    const loadCompetitionData = async () => {
      try {
        const data = await competitionService.getTodayCompetition();
        setCompetitionData(data);
      } catch (err) {
        console.error('Failed to load competition data:', err);
        // Set empty fallback data so CompeteCard still renders
        setCompetitionData({
          userRank: 0,
          totalPlayed: 0,
          waitingCount: 0,
          topFriends: [],
          userPlayedToday: false,
        });
      }
    };

    loadCompetitionData();

    // Refresh periodically to catch updates (30 seconds to reduce battery drain)
    const interval = setInterval(loadCompetitionData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalStats = getTotalStats();
  const lengthStats = getStatsForLength(selectedLength);
  const distribution = lengthStats.guessDistribution;
  const maxDistCount = Math.max(...Object.values(distribution), 1);

  // Find best guess (most frequent)
  const bestGuessNum = Object.entries(distribution).reduce(
    (best, [num, count]) => {
      if (count > (distribution[best] || 0)) {
        return parseInt(num, 10);
      }
      return best;
    },
    1,
  );

  const handleHapticsChange = (value: boolean) => {
    setHaptics(value);
    updatePreferences({hapticsEnabled: value});
  };

  const handleHighContrastChange = (value: boolean) => {
    setHighContrast(value);
    updatePreferences({highContrastEnabled: value});
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset Statistics',
      'This will permanently delete all your game statistics. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetStats();
          },
        },
      ],
    );
  };

  const handleSyncStats = async () => {
    if (!isAuthenticated) {
      Alert.alert('Not Signed In', 'Please sign in to sync your statistics.');
      return;
    }

    try {
      await profileService.syncStats();
      Alert.alert('Success', 'Your statistics have been synced to the cloud.');
    } catch (err) {
      Alert.alert('Error', 'Failed to sync statistics. Please try again.');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={22} color={palette.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Stats & Settings</Text>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <View style={styles.perfHeader}>
            <View style={styles.streakRow}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNumber}>{totalStats.currentStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
            <View style={styles.bestCol}>
              <Text style={styles.bestLabel}>Best</Text>
              <Text style={styles.bestValue}>{totalStats.maxStreak}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <StatCell value={totalStats.played} label="Played" isFirst />
            <StatCell value={totalStats.won} label="Won" />
            <StatCell value={`${totalStats.winRate}%`} label="Win Rate" isLast />
          </View>
        </View>

        {/* Compete Card */}
        {onNavigateToFriends && (
          <CompeteCard
            userRank={competitionData?.userRank ?? 0}
            totalPlayed={competitionData?.totalPlayed ?? 0}
            waitingCount={competitionData?.waitingCount ?? 0}
            topFriends={(competitionData?.topFriends ?? []).map(f => ({
              ...f,
              // Update user letter with actual user data
              letter: f.isYou
                ? (user?.displayName ?? user?.username ?? 'Y')[0].toUpperCase()
                : f.letter,
            }))}
            onPress={onNavigateToFriends}
            loading={competitionData === null}
          />
        )}

        {/* Distribution Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Guess Distribution</Text>
          <View style={styles.lengthPicker}>
            {VALID_LENGTHS.map(n => (
              <Pressable
                key={n}
                style={[
                  styles.lengthOpt,
                  selectedLength === n && styles.lengthOptActive,
                ]}
                onPress={() => setSelectedLength(n)}>
                <Text
                  style={[
                    styles.lengthOptText,
                    selectedLength === n && styles.lengthOptTextActive,
                  ]}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.distGrid}>
          {[1, 2, 3, 4, 5, 6].map(guessNum => (
            <DistributionColumn
              key={guessNum}
              guessNum={guessNum}
              count={distribution[guessNum] || 0}
              maxCount={maxDistCount}
              isBest={guessNum === bestGuessNum && (distribution[guessNum] || 0) > 0}
            />
          ))}
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon={<HapticsIcon size={18} />}
            iconBg={palette.success}
            label="Haptics"
            right={
              <Toggle value={haptics} onValueChange={handleHapticsChange} />
            }
          />
          <SettingsRow
            icon={<EyeIcon size={18} />}
            iconBg={palette.primary}
            label="High Contrast"
            right={
              <Toggle
                value={highContrast}
                onValueChange={handleHighContrastChange}
              />
            }
            isLast
          />
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsGroup}>
          {!isAuthenticated && !isDevelopmentMode ? (
            <SettingsRow
              icon={<UserIcon size={18} />}
              iconBg={palette.primary}
              label="Sign In"
              subtitle="Sync progress across devices"
              onPress={() => {}}
              isLast
            />
          ) : (
            <>
              {isAuthenticated && (
                <SettingsRow
                  icon={<UserIcon size={18} />}
                  iconBg={palette.primary}
                  label={user?.displayName || user?.username || user?.email || 'Account'}
                  subtitle={user?.friendCode || 'Tap to view profile'}
                  onPress={() => setShowProfile(true)}
                />
              )}
              {isDevelopmentMode && (
                <SettingsRow
                  icon={<UserIcon size={18} />}
                  iconBg={palette.textDim}
                  label="Dev Mode Active"
                  subtitle="Using local data only"
                  isLast={!isAuthenticated}
                />
              )}
              {isAuthenticated && (
                <SettingsRow
                  icon={<DocumentIcon size={18} />}
                  iconBg={palette.success}
                  label="Sync Stats"
                  subtitle="Upload to cloud"
                  onPress={handleSyncStats}
                  isLast
                />
              )}
            </>
          )}
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon={<DocumentIcon size={18} />}
            iconBg={palette.textDim}
            label="Terms of Service"
            onPress={() => {
              triggerImpact('Light');
              setShowTerms(true);
            }}
          />
          <SettingsRow
            icon={<ShieldIcon size={18} />}
            iconBg={palette.textDim}
            label="Privacy Policy"
            onPress={() => {
              triggerImpact('Light');
              setShowPrivacy(true);
            }}
          />
          <SettingsRow
            icon={<ChatIcon size={18} />}
            iconBg={palette.textDim}
            label="Send Feedback"
            subtitle="Opens email"
            onPress={() => {
              triggerImpact('Light');
              openFeedbackEmail(user?.id);
            }}
            isLast
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon={<TrashIcon size={18} />}
            iconBg={palette.destructive}
            label="Reset All Statistics"
            destructive
            onPress={handleResetStats}
            isLast
          />
        </View>

        <Text style={styles.versionFooter}>
          {APP_CONFIG.name} v{APP_CONFIG.version} {isDevelopmentMode ? '• DEV MODE' : ''}
        </Text>
      </ScrollView>

      {/* Profile Screen Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfile(false)}>
        <ProfileScreen onClose={() => setShowProfile(false)} />
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}>
        <LegalDocumentScreen
          documentType="terms"
          onClose={() => setShowTerms(false)}
        />
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacy(false)}>
        <LegalDocumentScreen
          documentType="privacy"
          onClose={() => setShowPrivacy(false)}
        />
      </Modal>
    </View>
  );
}

function StatCell({
  value,
  label,
  isFirst,
  isLast,
}: {
  value: string | number;
  label: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.statCell,
        isFirst && styles.statCellFirst,
        isLast && styles.statCellLast,
      ]}>
      <Text style={styles.statCellValue}>{value}</Text>
      <Text style={styles.statCellLabel}>{label}</Text>
    </View>
  );
}

function DistributionColumn({
  guessNum,
  count,
  maxCount,
  isBest,
}: {
  guessNum: number;
  count: number;
  maxCount: number;
  isBest: boolean;
}) {
  const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <View style={styles.distCol}>
      <View style={styles.distBarContainer}>
        <View
          style={[
            styles.distBar,
            {
              height: `${Math.max(heightPercent, count > 0 ? 15 : 0)}%`,
            },
            isBest && styles.distBarBest,
          ]}>
          {count > 0 && <Text style={styles.distCount}>{count}</Text>}
        </View>
      </View>
      <Text style={styles.distLabel}>{guessNum}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
  subtitle,
  right,
  onPress,
  destructive,
  isLast,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={[styles.settingsRow, !isLast && styles.settingsRowBorder]}
      onPress={onPress}
      disabled={!onPress && !right}>
      <View style={styles.settingsLeft}>
        <View style={[styles.settingsIcon, {backgroundColor: iconBg}]}>
          {icon}
        </View>
        <View>
          <Text
            style={[
              styles.settingsLabel,
              destructive && styles.destructiveLabel,
            ]}>
            {label}
          </Text>
          {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingsRight}>
        {right || (onPress && <ChevronRight size={14} color={palette.textDim} />)}
      </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
  },

  // Performance Card
  performanceCard: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  perfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakFire: {
    fontSize: 24,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.textMuted,
  },
  bestCol: {
    alignItems: 'flex-end',
  },
  bestLabel: {
    fontSize: 11,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestValue: {
    fontSize: 24,
    fontWeight: '600',
    color: palette.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: palette.cardBorder,
    borderRadius: 12,
    gap: 1,
  },
  statCell: {
    flex: 1,
    backgroundColor: palette.card,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statCellFirst: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  statCellLast: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  statCellValue: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  statCellLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 4,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 8,
  },

  // Length picker
  lengthPicker: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  lengthOpt: {
    width: 32,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthOptActive: {
    backgroundColor: palette.cardBorder,
  },
  lengthOptText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textDim,
  },
  lengthOptTextActive: {
    color: palette.textPrimary,
  },

  // Distribution
  distGrid: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  distCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  distBarContainer: {
    width: '100%',
    height: 80,
    backgroundColor: palette.card,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  distBar: {
    width: '100%',
    backgroundColor: palette.primary,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    paddingTop: 6,
    minHeight: 0,
  },
  distBarBest: {
    backgroundColor: palette.success,
  },
  distCount: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  distLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textDim,
  },

  // Settings groups
  settingsGroup: {
    backgroundColor: palette.card,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: palette.cardBorder,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 16,
    color: palette.textPrimary,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: palette.textDim,
    marginTop: 1,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destructiveLabel: {
    color: palette.destructive,
  },

  // Footer
  versionFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: palette.textDim,
    paddingVertical: 16,
  },
});
