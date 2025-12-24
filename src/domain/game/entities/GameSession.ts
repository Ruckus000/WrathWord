// src/domain/game/entities/GameSession.ts

import { GameConfig } from '../value-objects/GameConfig';
import { Feedback } from '../value-objects/Feedback';
import { TileState, TileStateValue } from '../value-objects/TileState';
import { GuessEvaluator } from '../services/GuessEvaluator';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface HintCell {
  row: number;
  col: number;
}

interface GameSessionState {
  config: GameConfig;
  answer: string;
  guesses: string[];
  feedback: Feedback[];
  status: GameStatus;
  hintUsed: boolean;
  hintedCell: HintCell | null;
  hintedLetter: string | null;
  keyboardStates: Map<string, TileStateValue>;
}

/**
 * GameSession is the aggregate root for a single game.
 * Immutable - all mutations return new instances.
 */
export class GameSession {
  private readonly state: GameSessionState;
  private readonly evaluator: GuessEvaluator;

  private constructor(state: GameSessionState, evaluator: GuessEvaluator) {
    this.state = state;
    this.evaluator = evaluator;
    Object.freeze(this);
  }

  /**
   * Create a new game session.
   */
  static create(config: GameConfig, answer: string, evaluator: GuessEvaluator): GameSession {
    const state: GameSessionState = {
      config,
      answer: answer.toUpperCase(),
      guesses: [],
      feedback: [],
      status: 'playing',
      hintUsed: false,
      hintedCell: null,
      hintedLetter: null,
      keyboardStates: new Map(),
    };
    return new GameSession(state, evaluator);
  }

  // Getters
  get config(): GameConfig {
    return this.state.config;
  }

  get answer(): string {
    return this.state.answer;
  }

  get guesses(): string[] {
    return [...this.state.guesses];
  }

  get feedback(): Feedback[] {
    return [...this.state.feedback];
  }

  get status(): GameStatus {
    return this.state.status;
  }

  get currentRow(): number {
    return this.state.guesses.length;
  }

  get remainingGuesses(): number {
    return this.state.config.maxRows - this.currentRow;
  }

  get hintUsed(): boolean {
    return this.state.hintUsed;
  }

  get hintedCell(): HintCell | null {
    return this.state.hintedCell;
  }

  get hintedLetter(): string | null {
    return this.state.hintedLetter;
  }

  get keyboardStates(): Map<string, TileStateValue> {
    return new Map(this.state.keyboardStates);
  }

  /**
   * Submit a guess and return a new session with the result.
   * @throws Error if game is already over
   */
  submitGuess(guess: string): GameSession {
    if (this.isGameOver()) {
      throw new Error('Game is already over');
    }

    const normalizedGuess = guess.toUpperCase();
    const newFeedback = this.evaluator.evaluate(this.state.answer, normalizedGuess);

    // Update keyboard states
    const newKeyboardStates = new Map(this.state.keyboardStates);
    for (let i = 0; i < normalizedGuess.length; i++) {
      const letter = normalizedGuess[i];
      const newState = newFeedback.at(i)!;
      const currentState = newKeyboardStates.get(letter);

      if (!currentState || TileState.compare(newState, currentState) > 0) {
        newKeyboardStates.set(letter, newState);
      }
    }

    // Determine new status
    let newStatus: GameStatus = 'playing';
    if (newFeedback.isWin()) {
      newStatus = 'won';
    } else if (this.currentRow + 1 >= this.state.config.maxRows) {
      newStatus = 'lost';
    }

    const newState: GameSessionState = {
      ...this.state,
      guesses: [...this.state.guesses, normalizedGuess],
      feedback: [...this.state.feedback, newFeedback],
      status: newStatus,
      keyboardStates: newKeyboardStates,
    };

    return new GameSession(newState, this.evaluator);
  }

  /**
   * Check if a guess can be submitted.
   */
  canSubmitGuess(): boolean {
    return this.state.status === 'playing';
  }

  /**
   * Check if the game is over.
   */
  isGameOver(): boolean {
    return this.state.status !== 'playing';
  }

  /**
   * Use a hint at the specified position.
   * @throws Error if hint already used
   */
  useHint(cell: HintCell, letter: string): GameSession {
    if (this.state.hintUsed) {
      throw new Error('Hint already used');
    }

    const newState: GameSessionState = {
      ...this.state,
      hintUsed: true,
      hintedCell: cell,
      hintedLetter: letter,
    };

    return new GameSession(newState, this.evaluator);
  }

  /**
   * Generate a share string for the completed game.
   */
  toShareString(): string {
    const scoreDisplay = this.state.status === 'won'
      ? `${this.state.guesses.length}/${this.state.config.maxRows}`
      : `X/${this.state.config.maxRows}`;

    const emojiGrid = this.state.feedback
      .map(fb => fb.toShareEmoji())
      .join('\n');

    return `${scoreDisplay}\n\n${emojiGrid}`;
  }
}
