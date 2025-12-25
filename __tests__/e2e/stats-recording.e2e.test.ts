// __tests__/e2e/stats-recording.e2e.test.ts

/**
 * E2E Tests for Stats Recording
 *
 * Tests that game results are properly recorded to stats.
 */

import { gameResultsService } from '../../src/services/data';

jest.mock('../../src/services/data', () => ({
  gameResultsService: {
    saveGameResult: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('E2E: Stats Recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recording game results', () => {
    it.todo('records win with correct guess count');
    it.todo('records loss after 6 guesses');
    it.todo('records correct word length');
    it.todo('includes feedback in result');
  });

  describe('Word usage tracking', () => {
    it.todo('marks word as used after completion');
    it.todo('avoids used words in free play');
    it.todo('resets word pool when all used');
  });
});
