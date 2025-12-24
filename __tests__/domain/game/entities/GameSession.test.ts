// __tests__/domain/game/entities/GameSession.test.ts

import { GameSession, GameStatus } from '../../../../src/domain/game/entities/GameSession';
import { GameConfig } from '../../../../src/domain/game/value-objects/GameConfig';
import { GuessEvaluator } from '../../../../src/domain/game/services/GuessEvaluator';

describe('GameSession', () => {
  const evaluator = new GuessEvaluator();

  function createTestSession(answer: string = 'HELLO'): GameSession {
    const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
    return GameSession.create(config, answer, evaluator);
  }

  describe('create', () => {
    it('creates a new game session', () => {
      const session = createTestSession();

      expect(session.status).toBe('playing');
      expect(session.currentRow).toBe(0);
      expect(session.guesses).toEqual([]);
      expect(session.feedback).toEqual([]);
    });

    it('stores config values', () => {
      const config = GameConfig.create({ length: 5, maxRows: 6, mode: 'daily', dateISO: '2025-01-15' });
      const session = GameSession.create(config, 'HELLO', evaluator);

      expect(session.config.length).toBe(5);
      expect(session.config.maxRows).toBe(6);
      expect(session.config.mode).toBe('daily');
      expect(session.config.dateISO).toBe('2025-01-15');
    });

    it('stores the answer', () => {
      const session = createTestSession('APPLE');
      expect(session.answer).toBe('APPLE');
    });
  });

  describe('submitGuess', () => {
    it('adds guess and feedback', () => {
      const session = createTestSession();
      const newSession = session.submitGuess('CRANE');

      expect(newSession.guesses).toEqual(['CRANE']);
      expect(newSession.feedback).toHaveLength(1);
      expect(newSession.currentRow).toBe(1);
    });

    it('returns new session (immutability)', () => {
      const session = createTestSession();
      const newSession = session.submitGuess('CRANE');

      expect(newSession).not.toBe(session);
      expect(session.guesses).toEqual([]);
      expect(session.currentRow).toBe(0);
    });

    it('evaluates guess correctly', () => {
      const session = createTestSession('HELLO');
      const newSession = session.submitGuess('HELPS');

      // H=correct, E=correct, L=correct, P=absent, S=absent
      const feedback = newSession.feedback[0];
      expect(feedback.states).toEqual(['correct', 'correct', 'correct', 'absent', 'absent']);
    });

    it('sets status to won on correct guess', () => {
      const session = createTestSession('HELLO');
      const newSession = session.submitGuess('HELLO');

      expect(newSession.status).toBe('won');
      expect(newSession.feedback[0].isWin()).toBe(true);
    });

    it('sets status to lost when max rows reached', () => {
      let session = createTestSession('HELLO');

      // Make 6 wrong guesses
      for (let i = 0; i < 6; i++) {
        session = session.submitGuess('CRANE');
      }

      expect(session.status).toBe('lost');
      expect(session.currentRow).toBe(6);
    });

    it('throws when game is already over', () => {
      const session = createTestSession('HELLO');
      const wonSession = session.submitGuess('HELLO');

      expect(() => wonSession.submitGuess('CRANE')).toThrow('Game is already over');
    });

    it('uppercases guess', () => {
      const session = createTestSession('HELLO');
      const newSession = session.submitGuess('hello');

      expect(newSession.guesses[0]).toBe('HELLO');
    });
  });

  describe('canSubmitGuess', () => {
    it('returns true when game is playing', () => {
      const session = createTestSession();
      expect(session.canSubmitGuess()).toBe(true);
    });

    it('returns false when game is won', () => {
      const session = createTestSession('HELLO').submitGuess('HELLO');
      expect(session.canSubmitGuess()).toBe(false);
    });

    it('returns false when game is lost', () => {
      let session = createTestSession('HELLO');
      for (let i = 0; i < 6; i++) {
        session = session.submitGuess('CRANE');
      }
      expect(session.canSubmitGuess()).toBe(false);
    });
  });

  describe('remainingGuesses', () => {
    it('starts with maxRows', () => {
      const session = createTestSession();
      expect(session.remainingGuesses).toBe(6);
    });

    it('decreases with each guess', () => {
      const session = createTestSession();
      expect(session.submitGuess('CRANE').remainingGuesses).toBe(5);
      expect(session.submitGuess('CRANE').submitGuess('SLATE').remainingGuesses).toBe(4);
    });

    it('is zero when lost', () => {
      let session = createTestSession('HELLO');
      for (let i = 0; i < 6; i++) {
        session = session.submitGuess('CRANE');
      }
      expect(session.remainingGuesses).toBe(0);
    });
  });

  describe('isGameOver', () => {
    it('returns false when playing', () => {
      expect(createTestSession().isGameOver()).toBe(false);
    });

    it('returns true when won', () => {
      expect(createTestSession('HELLO').submitGuess('HELLO').isGameOver()).toBe(true);
    });

    it('returns true when lost', () => {
      let session = createTestSession('HELLO');
      for (let i = 0; i < 6; i++) {
        session = session.submitGuess('CRANE');
      }
      expect(session.isGameOver()).toBe(true);
    });
  });

  describe('hint state', () => {
    it('starts with no hint used', () => {
      const session = createTestSession();
      expect(session.hintUsed).toBe(false);
      expect(session.hintedCell).toBeNull();
      expect(session.hintedLetter).toBeNull();
    });

    it('records hint usage', () => {
      const session = createTestSession();
      const hintedSession = session.useHint({ row: 0, col: 0 }, 'H');

      expect(hintedSession.hintUsed).toBe(true);
      expect(hintedSession.hintedCell).toEqual({ row: 0, col: 0 });
      expect(hintedSession.hintedLetter).toBe('H');
    });

    it('useHint returns new session (immutability)', () => {
      const session = createTestSession();
      const hintedSession = session.useHint({ row: 0, col: 0 }, 'H');

      expect(hintedSession).not.toBe(session);
      expect(session.hintUsed).toBe(false);
    });

    it('throws when hint already used', () => {
      const session = createTestSession();
      const hintedSession = session.useHint({ row: 0, col: 0 }, 'H');

      expect(() => hintedSession.useHint({ row: 0, col: 1 }, 'E')).toThrow('Hint already used');
    });
  });

  describe('keyboard state tracking', () => {
    it('tracks correct letters', () => {
      const session = createTestSession('HELLO').submitGuess('HELLO');
      const keyStates = session.keyboardStates;

      expect(keyStates.get('H')).toBe('correct');
      expect(keyStates.get('E')).toBe('correct');
      expect(keyStates.get('L')).toBe('correct');
      expect(keyStates.get('O')).toBe('correct');
    });

    it('tracks absent letters', () => {
      const session = createTestSession('HELLO').submitGuess('FUDGY');
      const keyStates = session.keyboardStates;

      expect(keyStates.get('F')).toBe('absent');
      expect(keyStates.get('U')).toBe('absent');
      expect(keyStates.get('D')).toBe('absent');
      expect(keyStates.get('G')).toBe('absent');
      expect(keyStates.get('Y')).toBe('absent');
    });

    it('accumulates best state across guesses', () => {
      const session = createTestSession('HELLO');
      const s1 = session.submitGuess('CRANE'); // E present
      const s2 = s1.submitGuess('HELPS'); // E correct

      expect(s1.keyboardStates.get('E')).toBe('present');
      expect(s2.keyboardStates.get('E')).toBe('correct'); // Upgraded
    });

    it('never downgrades state', () => {
      const session = createTestSession('HELLO');
      const s1 = session.submitGuess('HELPS'); // L correct
      const s2 = s1.submitGuess('LLAMA'); // L[0] present, L[1] absent

      expect(s2.keyboardStates.get('L')).toBe('correct'); // Stays correct
    });
  });

  describe('toShareString', () => {
    it('generates share string for won game', () => {
      const session = createTestSession('HELLO');
      const s1 = session.submitGuess('CRANE');
      const s2 = s1.submitGuess('HELLO');

      const shareString = s2.toShareString();

      expect(shareString).toContain('2/6');
      expect(shareString).toContain('🟩🟩🟩🟩🟩');
    });

    it('generates share string for lost game', () => {
      let session = createTestSession('HELLO');
      for (let i = 0; i < 6; i++) {
        session = session.submitGuess('CRANE');
      }

      const shareString = session.toShareString();

      expect(shareString).toContain('X/6');
    });
  });
});
