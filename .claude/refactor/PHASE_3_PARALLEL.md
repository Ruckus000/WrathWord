# Phase 3: Parallel Execution Guide

## Overview

Phase 3 infrastructure tasks are **completely independent** and should run in parallel using sub-agents. This reduces total execution time from ~20 minutes to ~5 minutes.

---

## 🚀 Parallel Execution Instructions

### For Claude Code Main Agent

Execute this command to spawn parallel agents:

```
Run 4 tasks in parallel:

SubAgent 1: Read and execute .claude/refactor/tasks/phase-3-task-3.1-parallel.md
SubAgent 2: Read and execute .claude/refactor/tasks/phase-3-task-3.2-parallel.md
SubAgent 3: Read and execute .claude/refactor/tasks/phase-3-task-3.3-parallel.md
SubAgent 4: Read and execute .claude/refactor/tasks/phase-3-task-3.4-parallel.md

Each agent should:
1. Create the directory if needed
2. Write the test file
3. Write the implementation file
4. Run tests for its specific file
5. Report success/failure

After all complete, run full verification.
```

---

## Task Assignments

| Agent | Task | Interface | Output File |
|-------|------|-----------|-------------|
| 1 | 3.1 | IWordList | `src/infrastructure/words/StaticWordList.ts` |
| 2 | 3.2 | IGameRepository | `src/infrastructure/persistence/MMKVGameRepository.ts` |
| 3 | 3.3 | ICompletionRepository | `src/infrastructure/persistence/MMKVCompletionRepository.ts` |
| 4 | 3.4 | SessionManager | `src/infrastructure/auth/SessionManager.ts` |

---

## Directory Structure Created

```
src/infrastructure/
├── words/
│   └── StaticWordList.ts        ← Agent 1
├── persistence/
│   ├── MMKVGameRepository.ts    ← Agent 2
│   └── MMKVCompletionRepository.ts ← Agent 3
└── auth/
    └── SessionManager.ts        ← Agent 4

__tests__/infrastructure/
├── words/
│   └── StaticWordList.test.ts   ← Agent 1
├── persistence/
│   ├── MMKVGameRepository.test.ts ← Agent 2
│   └── MMKVCompletionRepository.test.ts ← Agent 3
└── auth/
    └── SessionManager.test.ts   ← Agent 4
```

---

## Individual Agent Instructions

### Agent 1: StaticWordList (Task 3.1)

**Task file:** `.claude/refactor/tasks/phase-3-task-3.1-parallel.md`

**Creates:**
- `src/infrastructure/words/StaticWordList.ts`
- `__tests__/infrastructure/words/StaticWordList.test.ts`

**Verification:**
```bash
npm test -- --testPathPattern="StaticWordList"
```

**Commit:**
```bash
git add src/infrastructure/words __tests__/infrastructure/words
git commit -m "feat(infrastructure): add StaticWordList implementing IWordList"
```

---

### Agent 2: MMKVGameRepository (Task 3.2)

**Task file:** `.claude/refactor/tasks/phase-3-task-3.2-parallel.md`

**Creates:**
- `src/infrastructure/persistence/MMKVGameRepository.ts`
- `__tests__/infrastructure/persistence/MMKVGameRepository.test.ts`

**Verification:**
```bash
npm test -- --testPathPattern="MMKVGameRepository"
```

**Commit:**
```bash
git add src/infrastructure/persistence/MMKVGameRepository.ts __tests__/infrastructure/persistence/MMKVGameRepository.test.ts
git commit -m "feat(infrastructure): add MMKVGameRepository implementing IGameRepository"
```

---

### Agent 3: MMKVCompletionRepository (Task 3.3)

**Task file:** `.claude/refactor/tasks/phase-3-task-3.3-parallel.md`

**Creates:**
- `src/infrastructure/persistence/MMKVCompletionRepository.ts`
- `__tests__/infrastructure/persistence/MMKVCompletionRepository.test.ts`

**Verification:**
```bash
npm test -- --testPathPattern="MMKVCompletionRepository"
```

**Commit:**
```bash
git add src/infrastructure/persistence/MMKVCompletionRepository.ts __tests__/infrastructure/persistence/MMKVCompletionRepository.test.ts
git commit -m "feat(infrastructure): add MMKVCompletionRepository implementing ICompletionRepository"
```

---

### Agent 4: SessionManager (Task 3.4)

**Task file:** `.claude/refactor/tasks/phase-3-task-3.4-parallel.md`

**Creates:**
- `src/infrastructure/auth/SessionManager.ts`
- `__tests__/infrastructure/auth/SessionManager.test.ts`

**Verification:**
```bash
npm test -- --testPathPattern="SessionManager"
```

**Commit:**
```bash
git add src/infrastructure/auth __tests__/infrastructure/auth
git commit -m "feat(infrastructure): add SessionManager for auth session management"
```

---

## After All Agents Complete

### 1. Run Full Verification

```bash
# All infrastructure tests
npm test -- --testPathPattern="infrastructure"

# Full test suite (includes characterization, domain, application)
npm test

# Type check
npx tsc --noEmit
```

### 2. Update Progress Tracker

Edit `.claude/refactor/REFACTOR_PROGRESS.md`:
- Mark 3.1 as ✅ Complete
- Mark 3.2 as ✅ Complete
- Mark 3.3 as ✅ Complete
- Mark 3.4 as ✅ Complete
- Update "Current Task" to 4.1
- Update "Current Phase" to 4

### 3. Proceed to Phase 4

Phase 4 (Presentation Layer) is sequential - no parallel execution.

---

## Existing Utilities Reference

Each agent may need to import from existing code:

### For MMKV Storage (Agents 2, 3)
```typescript
import { kv, getJSON, setJSON } from '../../storage/mmkv';
import { getScopedKey } from '../../storage/userScope';
```

### For Daily Completion (Agent 3)
```typescript
import { 
  isDailyCompleted, 
  markDailyCompleted,
  getDailyCompletionKey 
} from '../../storage/dailyCompletion';
```

### For Word Lists (Agent 1)
```typescript
import answers4 from '../../logic/words/answers-4.json';
import answers5 from '../../logic/words/answers-5.json';
import answers6 from '../../logic/words/answers-6.json';
// etc.
```

### For Logging (Agent 4)
```typescript
import { logger } from '../../utils/logger';
```

---

## Troubleshooting

### If an agent fails:
1. Check the specific test output
2. Fix the issue in that agent's files only
3. Re-run that agent's tests
4. Don't block other agents

### If tests conflict:
- Each agent writes to different files
- No conflicts should occur
- If they do, check for shared mock state

### If type errors occur:
- Run `npx tsc --noEmit` to see all errors
- Each agent should only affect its own files
- Domain interfaces should not change
