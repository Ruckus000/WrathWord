import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {View, Text, StyleSheet, Pressable, Modal} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../../theme/colors';
import {XIcon} from '../../components/icons/SettingsIcons';
import {getFriendCode} from '../../storage/friendCode';
import {MOCK_FRIENDS} from '../../data/mockFriends';
import {
  MOCK_INCOMING_REQUESTS,
  MOCK_OUTGOING_REQUESTS,
  MOCK_SEARCHABLE_USERS,
  formatRequestTime,
} from '../../data/mockFriendRequests';
import {triggerImpact, triggerNotification} from '../../utils/haptics';

// Subcomponents
import FriendCodeCard from './AddFriendsModal/FriendCodeCard';
import SearchInput from './AddFriendsModal/SearchInput';
import SearchResultRow from './AddFriendsModal/SearchResultRow';
import RequestRow from './AddFriendsModal/RequestRow';
import EmptyState from './AddFriendsModal/EmptyState';

type Tab = 'find' | 'requests';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddFriendsModal({visible, onClose}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Get user's friend code (generates on first call, then persists)
  const userFriendCode = useMemo(() => getFriendCode(), []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.toUpperCase().trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setActiveTab('find');
      setSearchQuery('');
      setDebouncedQuery('');
    }
  }, [visible]);

  // Pending request count for badge
  const pendingCount = MOCK_INCOMING_REQUESTS.filter(
    r => r.status === 'pending',
  ).length;

  // Determine relationship status for a user
  const getRelationshipStatus = useCallback(
    (userId: string): 'none' | 'pending' | 'friends' => {
      // Check if already friends
      if (MOCK_FRIENDS.some(f => f.id === userId)) {
        return 'friends';
      }
      // Check if request pending (either direction)
      const hasPending =
        MOCK_INCOMING_REQUESTS.some(
          r => r.fromId === userId && r.status === 'pending',
        ) ||
        MOCK_OUTGOING_REQUESTS.some(
          r => r.toId === userId && r.status === 'pending',
        );
      if (hasPending) {
        return 'pending';
      }
      return 'none';
    },
    [],
  );

  // Filter search results
  const searchResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];

    // Combine friends and searchable users
    const allUsers = [
      ...MOCK_FRIENDS.map(f => ({
        id: f.id,
        name: f.name,
        letter: f.letter,
        friendCode: f.friendCode,
      })),
      ...MOCK_SEARCHABLE_USERS,
    ];

    return allUsers.filter(user => {
      const nameMatch = user.name.toUpperCase().includes(debouncedQuery);
      const codeMatch = user.friendCode
        .replace('-', '')
        .includes(debouncedQuery.replace('-', ''));
      return nameMatch || codeMatch;
    });
  }, [debouncedQuery]);

  // Handlers
  const handleAddFriend = useCallback((userId: string) => {
    triggerImpact('Medium');
    // TODO: In real app, send friend request via API
    console.log('Send friend request to:', userId);
  }, []);

  const handleAcceptRequest = useCallback((requestId: string) => {
    triggerNotification('Success');
    // TODO: In real app, accept request via API
    console.log('Accept request:', requestId);
  }, []);

  const handleDeclineRequest = useCallback((requestId: string) => {
    triggerImpact('Light');
    // TODO: In real app, decline request via API
    console.log('Decline request:', requestId);
  }, []);

  const handleCancelRequest = useCallback((requestId: string) => {
    triggerImpact('Light');
    // TODO: In real app, cancel outgoing request via API
    console.log('Cancel request:', requestId);
  }, []);

  const handleCodeCopied = useCallback(() => {
    triggerImpact('Light');
    // TODO: Show toast
    console.log('Friend code copied');
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, {paddingBottom: insets.bottom + 20}]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Friends</Text>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button">
              <XIcon size={14} color={palette.textDim} />
            </Pressable>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabNav}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'find' && styles.tabBtnActive]}
              onPress={() => setActiveTab('find')}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'find' && styles.tabBtnTextActive,
                ]}>
                Find Friends
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabBtn,
                activeTab === 'requests' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('requests')}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'requests' && styles.tabBtnTextActive,
                ]}>
                Requests
              </Text>
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Content */}
          <KeyboardAwareScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {activeTab === 'find' && (
              <>
                {/* Search Input - FIRST for keyboard visibility */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Find by Code or Name</Text>
                  <SearchInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {debouncedQuery.length === 0 && (
                    <Text style={styles.searchHint}>
                      Try searching for "WR4K-9NX7" or "Sarah"
                    </Text>
                  )}
                </View>

                {/* Friend Code Card - Below search */}
                <FriendCodeCard
                  friendCode={userFriendCode}
                  onCopied={handleCodeCopied}
                />

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>Results</Text>
                      <Text style={styles.sectionCount}>
                        {searchResults.length} found
                      </Text>
                    </View>
                    <View style={styles.list}>
                      {searchResults.map(user => (
                        <SearchResultRow
                          key={user.id}
                          name={user.name}
                          letter={user.letter}
                          friendCode={user.friendCode}
                          status={getRelationshipStatus(user.id)}
                          onAdd={() => handleAddFriend(user.id)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* No Results */}
                {debouncedQuery.length >= 2 && searchResults.length === 0 && (
                  <EmptyState
                    icon="🔍"
                    title="No Results"
                    subtitle={`No users found matching "${debouncedQuery}"`}
                  />
                )}
              </>
            )}

            {activeTab === 'requests' && (
              <>
                {/* Incoming Requests */}
                {MOCK_INCOMING_REQUESTS.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>Incoming</Text>
                      <Text style={styles.sectionCount}>
                        {MOCK_INCOMING_REQUESTS.length} pending
                      </Text>
                    </View>
                    <View style={styles.list}>
                      {MOCK_INCOMING_REQUESTS.map(request => (
                        <RequestRow
                          key={request.id}
                          name={request.fromName}
                          letter={request.fromLetter}
                          subtitle={`Sent ${formatRequestTime(request.createdAt)}`}
                          type="incoming"
                          onAccept={() => handleAcceptRequest(request.id)}
                          onDecline={() => handleDeclineRequest(request.id)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Outgoing Requests */}
                {MOCK_OUTGOING_REQUESTS.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>Sent</Text>
                      <Text style={styles.sectionCount}>
                        {MOCK_OUTGOING_REQUESTS.length} pending
                      </Text>
                    </View>
                    <View style={styles.list}>
                      {MOCK_OUTGOING_REQUESTS.map(request => (
                        <RequestRow
                          key={request.id}
                          name="David" // In real app, fetch name from toId
                          letter="D"
                          subtitle="Waiting for response"
                          type="outgoing"
                          onCancel={() => handleCancelRequest(request.id)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Empty State */}
                {MOCK_INCOMING_REQUESTS.length === 0 &&
                  MOCK_OUTGOING_REQUESTS.length === 0 && (
                    <EmptyState
                      icon="📭"
                      title="No Pending Requests"
                      subtitle="When someone sends you a friend request, it will appear here. Share your friend code to start connecting!"
                    />
                  )}
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: palette.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: palette.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.cardBorder,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  closeBtn: {
    width: 28,
    height: 28,
    backgroundColor: palette.card,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabNav: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.cardBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: palette.card,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textMuted,
  },
  tabBtnTextActive: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    backgroundColor: palette.destructive,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10, // Spacing to component below (matches NewGameModal.settingLabel)
  },
  sectionCount: {
    fontSize: 12,
    color: palette.textDim,
  },
  searchHint: {
    fontSize: 12,
    color: palette.textDim,
    marginTop: 8,
    paddingLeft: 4,
  },
  list: {
    backgroundColor: palette.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
