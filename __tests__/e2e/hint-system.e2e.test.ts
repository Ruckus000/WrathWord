// __tests__/e2e/hint-system.e2e.test.ts

/**
 * E2E Tests for Hint System
 *
 * Tests the one-time hint feature.
 */

describe('E2E: Hint System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Using hints', () => {
    it.todo('reveals one correct letter position');
    it.todo('inserts hint letter into current input');
    it.todo('marks hinted letter as correct on keyboard');
    it.todo('prevents typing over hint position');
  });

  describe('Hint restrictions', () => {
    it.todo('allows only one hint per game');
    it.todo('disables hint button after use');
    it.todo('skips already-correct positions');
    it.todo('disables hint when all positions known');
  });

  describe('Hint persistence', () => {
    it.todo('preserves hint state across app restart');
    it.todo('clears hint state on new game');
  });
});
