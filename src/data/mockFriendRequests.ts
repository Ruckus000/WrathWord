export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export type FriendRequest = {
  id: string;
  fromId: string;
  fromName: string;
  fromLetter: string;
  fromCode: string;
  toId: string;
  status: FriendRequestStatus;
  createdAt: string; // ISO date string
};

// Incoming requests (others sent to current user)
export const MOCK_INCOMING_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    fromId: 'user-kevin',
    fromName: 'Kevin',
    fromLetter: 'K',
    fromCode: 'KVN4-8XPL',
    toId: 'you',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'req-2',
    fromId: 'user-lisa',
    fromName: 'Lisa',
    fromLetter: 'L',
    fromCode: 'L3SA-QWRT',
    toId: 'you',
    status: 'pending',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

// Outgoing requests (current user sent to others)
export const MOCK_OUTGOING_REQUESTS: FriendRequest[] = [
  {
    id: 'req-3',
    fromId: 'you',
    fromName: 'You',
    fromLetter: 'W',
    fromCode: 'WR4K-9NX7',
    toId: 'user-david',
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
];

// People available to find via search (not yet friends)
export const MOCK_SEARCHABLE_USERS = [
  {id: 'user-tyler', name: 'Tyler', letter: 'T', friendCode: 'TYLR-8NPQ'},
  {id: 'user-emma', name: 'Emma', letter: 'E', friendCode: '9EMA-KQNV'},
  {id: 'user-david', name: 'David', letter: 'D', friendCode: 'DVT5-M2KL'},
  {id: 'user-sarah-k', name: 'Sarah K.', letter: 'S', friendCode: 'SKT9-2WPL'},
  {id: 'user-sarahplays', name: 'SarahPlays', letter: 'S', friendCode: '2HYK-9QWL'},
];

/**
 * Helper to format relative time for request timestamps.
 */
export function formatRequestTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
