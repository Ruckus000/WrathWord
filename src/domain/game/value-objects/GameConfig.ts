// src/domain/game/value-objects/GameConfig.ts

/**
 * Game mode - daily (one puzzle per day) or free (unlimited play).
 */
export type GameMode = 'daily' | 'free';

/**
 * Valid word lengths supported by the game.
 */
export type ValidLength = 4 | 5 | 6;

const VALID_LENGTHS: readonly ValidLength[] = Object.freeze([4, 5, 6]);
const VALID_MODES: readonly GameMode[] = ['daily', 'free'];
const DEFAULT_LENGTH: ValidLength = 5;
const DEFAULT_MAX_ROWS = 6;

interface GameConfigParams {
  length: number;
  maxRows: number;
  mode: GameMode;
  dateISO: string;
}

/**
 * GameConfig encapsulates all configuration needed to start a game.
 * Immutable value object with validation and seed string generation.
 */
export class GameConfig {
  /**
   * Valid word lengths (4, 5, 6).
   */
  static readonly VALID_LENGTHS: readonly ValidLength[] = VALID_LENGTHS;

  readonly length: ValidLength;
  readonly maxRows: number;
  readonly mode: GameMode;
  readonly dateISO: string;

  private constructor(params: GameConfigParams) {
    this.length = params.length as ValidLength;
    this.maxRows = params.maxRows;
    this.mode = params.mode;
    this.dateISO = params.dateISO;
    Object.freeze(this);
  }

  /**
   * Create a validated GameConfig.
   * @throws Error if any parameter is invalid.
   */
  static create(params: GameConfigParams): GameConfig {
    // Validate length
    if (!VALID_LENGTHS.includes(params.length as ValidLength)) {
      throw new Error(`Invalid word length: ${params.length}. Must be one of ${VALID_LENGTHS.join(', ')}`);
    }

    // Validate maxRows
    if (params.maxRows <= 0) {
      throw new Error('maxRows must be positive');
    }

    // Validate mode
    if (!VALID_MODES.includes(params.mode)) {
      throw new Error(`Invalid game mode: ${params.mode}. Must be 'daily' or 'free'`);
    }

    // Validate dateISO
    if (!params.dateISO || params.dateISO.trim() === '') {
      throw new Error('dateISO is required');
    }

    return new GameConfig(params);
  }

  /**
   * Create a GameConfig with default values.
   */
  static createDefault(dateISO: string): GameConfig {
    return GameConfig.create({
      length: DEFAULT_LENGTH,
      maxRows: DEFAULT_MAX_ROWS,
      mode: 'daily',
      dateISO,
    });
  }

  /**
   * Check if a number is a valid word length.
   */
  static isValidLength(length: number): length is ValidLength {
    return VALID_LENGTHS.includes(length as ValidLength);
  }

  /**
   * Generate seed string for deterministic word selection.
   * Format: dateISO:length:maxRows
   * CRITICAL: maxRows is part of the seed!
   */
  toSeedString(): string {
    return `${this.dateISO}:${this.length}:${this.maxRows}`;
  }

  /**
   * Check if this is a daily game.
   */
  isDaily(): boolean {
    return this.mode === 'daily';
  }

  /**
   * Check if this is a free play game.
   */
  isFreePlay(): boolean {
    return this.mode === 'free';
  }
}
