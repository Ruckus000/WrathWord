import {TileState} from '../logic/evaluateGuess';

export type Friend = {
  id: string;
  name: string;
  letter: string;
  friendCode: string;
  streak: number;
  lastPlayed: 'today' | 'yesterday' | 'inactive';
  todayResult?: {
    won: boolean;
    guesses: number;
    feedback?: TileState[][];
  };
  stats: {
    played: number;
    won: number;
    winRate: number;
    avgGuesses: number;
    maxStreak: number;
  };
  h2h: {
    yourWins: number;
    theirWins: number;
  };
};

export const MOCK_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Sarah',
    letter: 'S',
    friendCode: '7KM3-XLPQ',
    streak: 14,
    lastPlayed: 'today',
    todayResult: {
      won: true,
      guesses: 2,
      feedback: [
        ['absent', 'present', 'absent', 'absent', 'correct'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
    },
    stats: {
      played: 98,
      won: 89,
      winRate: 91,
      avgGuesses: 3.1,
      maxStreak: 19,
    },
    h2h: {
      yourWins: 23,
      theirWins: 18,
    },
  },
  {
    id: '2',
    name: 'Mike',
    letter: 'M',
    friendCode: 'HXKP-2M4R',
    streak: 7,
    lastPlayed: 'today',
    todayResult: {
      won: true,
      guesses: 4,
    },
    stats: {
      played: 54,
      won: 44,
      winRate: 81,
      avgGuesses: 3.8,
      maxStreak: 12,
    },
    h2h: {
      yourWins: 15,
      theirWins: 12,
    },
  },
  {
    id: '3',
    name: 'Jordan',
    letter: 'J',
    friendCode: '9TYL-KQNV',
    streak: 23,
    lastPlayed: 'today',
    todayResult: {
      won: true,
      guesses: 5,
    },
    stats: {
      played: 142,
      won: 133,
      winRate: 94,
      avgGuesses: 3.2,
      maxStreak: 31,
    },
    h2h: {
      yourWins: 28,
      theirWins: 35,
    },
  },
  {
    id: '4',
    name: 'Alex',
    letter: 'A',
    friendCode: 'BNMW-4TRP',
    streak: 2,
    lastPlayed: 'today',
    todayResult: {
      won: true,
      guesses: 6,
    },
    stats: {
      played: 32,
      won: 23,
      winRate: 72,
      avgGuesses: 4.2,
      maxStreak: 8,
    },
    h2h: {
      yourWins: 10,
      theirWins: 5,
    },
  },
  {
    id: '5',
    name: 'Rachel',
    letter: 'R',
    friendCode: '2HYK-9QWL',
    streak: 0,
    lastPlayed: 'inactive',
    stats: {
      played: 15,
      won: 10,
      winRate: 67,
      avgGuesses: 4.5,
      maxStreak: 4,
    },
    h2h: {
      yourWins: 3,
      theirWins: 2,
    },
  },
];

export const MOCK_USER = {
  id: 'you',
  name: 'You',
  letter: 'W',
  friendCode: 'WR4K-9NX7',
  streak: 8,
  todayResult: {
    won: true,
    guesses: 3,
    feedback: [
      ['absent', 'present', 'absent', 'absent', 'absent'] as TileState[],
      ['absent', 'correct', 'present', 'absent', 'absent'] as TileState[],
      ['correct', 'correct', 'correct', 'correct', 'correct'] as TileState[],
    ],
  },
  stats: {
    played: 76,
    won: 65,
    winRate: 86,
    avgGuesses: 3.4,
    maxStreak: 21,
  },
};
