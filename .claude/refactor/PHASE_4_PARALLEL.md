# Phase 4: Parallel Execution Guide

## Overview

Phase 4 has **partial parallelization** due to dependencies.

### Dependency Graph

```
┌─────────────────┐     ┌─────────────────┐
│  4.1 useGame    │     │  4.3 Navigation │
│  Session Hook   │     │  Abstraction    │
└────────┬────────┘     └─────────────────┘
         │                      │
         │ (4.2 depends on 4.1) │ (independent)
         ▼                      │
┌─────────────────┐             │
│  4.2 GameScreen │             │
│  Refactor       │             │
└─────────────────┘             │
         │                      │
         └──────────┬───────────┘
                    ▼
              Phase 4 Complete
```

---

## Execution Strategy

### Wave 1: Parallel (Tasks 4.1 + 4.3)

**Spawn 2 sub-agents:**

```
Agent A: Execute .claude/refactor/tasks/phase-4-task-4.1-parallel.md (useGameSession)
Agent B: Execute .claude/refactor/tasks/phase-4-task-4.3-parallel.md (Navigation)
```

**These are completely independent:**
- Agent A works on `src/presentation/screens/Game/`
- Agent B works on `src/presentation/navigation/`
- No file conflicts

### Wave 2: Sequential (Task 4.2)

**After Agent A (4.1) completes:**

```
Execute .claude/refactor/tasks/phase-4-task-4.2-sequential.md (GameScreen refactor)
```

**This depends on 4.1 because:**
- GameScreen refactor needs to import `useGameSession` hook
- The hook must exist before the screen can use it

---

## Directory Structure Created

```
src/presentation/
├── screens/
│   └── Game/
│       ├── GameScreen.tsx        (4.2 - refactored)
│       ├── useGameSession.ts     (4.1 - Agent A)
│       └── components/           (existing, may be moved)
├── navigation/
│   ├── NavigationProvider.tsx    (4.3 - Agent B)
│   ├── NavigationContext.tsx     (4.3 - Agent B)
│   └── types.ts                  (4.3 - Agent B)
└── shared/
    └── hooks/

__tests__/presentation/
├── screens/
│   └── Game/
│       ├── useGameSession.test.ts (4.1 - Agent A)
│       └── GameScreen.test.tsx    (4.2)
└── navigation/
    └── NavigationProvider.test.tsx (4.3 - Agent B)
```

---

## Execution Commands

### Start Wave 1 (Parallel)

```
Spawn 2 sub-agents:

Agent A: "Execute .claude/refactor/tasks/phase-4-task-4.1-parallel.md"
Agent B: "Execute .claude/refactor/tasks/phase-4-task-4.3-parallel.md"
```

### After Wave 1 Completes

```bash
# Verify both agents succeeded
npm test -- --testPathPattern="useGameSession"
npm test -- --testPathPattern="Navigation"
```

### Start Wave 2 (After 4.1 is complete)

```
Execute .claude/refactor/tasks/phase-4-task-4.2-sequential.md
```

### Final Verification

```bash
npm test
npx tsc --noEmit
```

---

## Task Assignments

| Wave | Agent | Task | Creates |
|------|-------|------|---------|
| 1 | A | 4.1 | `useGameSession.ts` - hook with all game logic |
| 1 | B | 4.3 | `NavigationProvider.tsx` - context-based navigation |
| 2 | - | 4.2 | Refactored `GameScreen.tsx` (<200 lines) |

---

## Important Notes

1. **Agent A (4.1)** creates the hook but does NOT modify GameScreen yet
2. **Agent B (4.3)** creates navigation abstraction but does NOT modify App.tsx yet
3. **Task 4.2** does the actual GameScreen refactor using the hook from 4.1
4. **Phase 5** will wire everything together and update App.tsx to use NavigationProvider
