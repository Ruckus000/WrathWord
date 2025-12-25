# Task 5.5: Documentation Update (PARALLEL - Wave 1)

## Agent Assignment
This task runs in **parallel with Tasks 5.1 and 5.2**.
No dependencies on other Phase 5 tasks.

## Objective
Update project documentation to reflect the new Clean Architecture structure.

## Files to Create/Update
- `docs/ARCHITECTURE.md` (new)
- `README.md` (update)

## Why Documentation Now?

The refactoring is complete. Documentation ensures:
1. New developers understand the architecture
2. Future changes follow established patterns
3. The rationale for decisions is preserved

## Implementation

### ARCHITECTURE.md

```markdown
# WrathWord Architecture

## Overview

WrathWord follows **Clean Architecture** principles with **Domain-Driven Design (DDD)** patterns. The codebase is organized into four main layers, each with specific responsibilities and dependencies.

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React Native screens, hooks, components                     │
│  src/presentation/                                           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Use Cases (orchestrate domain logic)                        │
│  src/application/                                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  Entities, Value Objects, Domain Services, Interfaces        │
│  src/domain/                                                 │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  Repositories, External Services, Persistence               │
│  src/infrastructure/                                         │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── domain/                     # Core business logic
│   └── game/
│       ├── entities/           # GameSession
│       ├── value-objects/      # TileState, Feedback, GameConfig
│       ├── services/           # GuessEvaluator, WordSelector, HintProvider
│       └── repositories/       # Interfaces only (IGameRepository, etc.)
│
├── application/                # Use cases
│   └── game/
│       ├── StartGameUseCase.ts
│       ├── SubmitGuessUseCase.ts
│       ├── UseHintUseCase.ts
│       └── AbandonGameUseCase.ts
│
├── infrastructure/             # External concerns
│   ├── persistence/            # MMKVGameRepository, MMKVCompletionRepository
│   ├── words/                  # StaticWordList
│   └── auth/                   # SessionManager
│
├── presentation/               # UI layer
│   ├── screens/
│   │   └── Game/
│   │       ├── GameScreen.tsx  # Thin UI (<200 lines)
│   │       └── useGameSession.ts # Hook with game logic
│   └── navigation/             # NavigationProvider, useNavigation
│
└── composition/                # Dependency injection
    └── GameModule.ts           # Composition root
```

## Key Patterns

### 1. Value Objects (Immutable)

```typescript
// src/domain/game/value-objects/Feedback.ts
export class Feedback {
  private constructor(private readonly _states: TileStateValue[]) {}
  
  static from(states: TileStateValue[]): Feedback {
    return new Feedback([...states]); // Defensive copy
  }
  
  get states(): TileStateValue[] {
    return [...this._states]; // Defensive copy
  }
  
  isWin(): boolean {
    return this._states.every(s => s === 'correct');
  }
}
```

### 2. Domain Services (Stateless)

```typescript
// src/domain/game/services/GuessEvaluator.ts
export class GuessEvaluator {
  evaluate(answer: string, guess: string): Feedback {
    // Pure function - no side effects
  }
}
```

### 3. Use Cases (Orchestration)

```typescript
// src/application/game/SubmitGuessUseCase.ts
export class SubmitGuessUseCase {
  constructor(
    private readonly gameRepository: IGameRepository,
    private readonly wordList: IWordList,
    private readonly evaluator: GuessEvaluator,
  ) {}

  async execute(input: SubmitGuessInput): Promise<SubmitGuessOutput> {
    // Orchestrate domain objects
  }
}
```

### 4. Repository Pattern

```typescript
// Domain defines interface
interface IGameRepository {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}

// Infrastructure implements
class MMKVGameRepository implements IGameRepository {
  // MMKV-specific implementation
}
```

### 5. Composition Root

```typescript
// src/composition/GameModule.ts
export class GameModule {
  static create(): GameModule {
    return new GameModule(
      getGameRepository(),      // Infrastructure
      getWordList(),            // Infrastructure
      new GuessEvaluator(),     // Domain
    );
  }
  
  getSubmitGuessUseCase(): SubmitGuessUseCase {
    return new SubmitGuessUseCase(
      this.gameRepository,
      this.wordList,
      this.evaluator,
    );
  }
}
```

## Testing Strategy

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │  ~10 tests (critical paths)
        └────┬────┘
             │
      ┌──────┴──────┐
      │ Integration │  ~50 tests (use cases)
      └──────┬──────┘
             │
   ┌─────────┴─────────┐
   │    Unit Tests     │  ~150+ tests (domain)
   └───────────────────┘
```

### Test Locations

```
__tests__/
├── domain/           # Unit tests for domain layer
├── application/      # Integration tests for use cases
├── infrastructure/   # Integration tests for repositories
├── presentation/     # Component tests
├── characterization/ # Behavior documentation tests
└── e2e/              # End-to-end flow tests
```

## Dependency Rule

**Dependencies point inward only:**

- Presentation → Application → Domain ← Infrastructure
- Domain has NO dependencies on other layers
- Infrastructure implements Domain interfaces

## Adding New Features

1. **Define domain concepts** (entities, value objects)
2. **Create use case** that orchestrates domain logic
3. **Implement infrastructure** if external services needed
4. **Build UI** that calls use cases via hooks

## Key Files

| Purpose | File |
|---------|------|
| Game logic | `src/presentation/screens/Game/useGameSession.ts` |
| UI | `src/presentation/screens/Game/GameScreen.tsx` |
| Guess evaluation | `src/domain/game/services/GuessEvaluator.ts` |
| Word selection | `src/domain/game/services/WordSelector.ts` |
| Persistence | `src/infrastructure/persistence/MMKVGameRepository.ts` |
| Daily tracking | `src/infrastructure/persistence/MMKVCompletionRepository.ts` |
| DI wiring | `src/composition/GameModule.ts` |
```

### README.md Updates

Add a section to the existing README:

```markdown
## Architecture

WrathWord follows Clean Architecture principles. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

### Quick Overview

```
src/
├── domain/           # Core business logic (no dependencies)
├── application/      # Use cases (orchestration)
├── infrastructure/   # External concerns (persistence, APIs)
├── presentation/     # React Native UI
└── composition/      # Dependency injection
```

### Running Tests

```bash
# All tests
npm test

# Specific layer
npm test -- --testPathPattern="domain"
npm test -- --testPathPattern="application"
npm test -- --testPathPattern="infrastructure"
npm test -- --testPathPattern="presentation"
npm test -- --testPathPattern="e2e"
```
```

## Verification

```bash
# Create docs directory if needed
mkdir -p docs

# Verify files exist
test -f docs/ARCHITECTURE.md && echo "✅ ARCHITECTURE.md created"

# Check README was updated
grep -q "Architecture" README.md && echo "✅ README updated"
```

## Completion Criteria
- [ ] `docs/ARCHITECTURE.md` created with full documentation
- [ ] `README.md` updated with architecture section
- [ ] All diagrams render correctly
- [ ] Code examples are accurate
- [ ] No broken links

## Commit Message
```
docs: add Clean Architecture documentation

- Create docs/ARCHITECTURE.md with layer diagram
- Document key patterns (value objects, use cases, DI)
- Add testing strategy section
- Update README with architecture overview
```
