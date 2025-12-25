# WrathWord Refactoring Runner

## Quick Start

To continue the refactoring, read this file and follow the current phase instructions.

---

## Current Status: Phase 5

Read `.claude/refactor/REFACTOR_PROGRESS.md` for detailed status.

---

## Phase 5 Execution Protocol

### Step 1: Start Wave 1 (Parallel)

**Spawn 3 sub-agents to run in parallel:**

```
Spawn Agent A with prompt:
"Execute the task in .claude/refactor/tasks/phase-5-task-5.1-parallel.md
This creates the DI composition root in src/composition/
Run tests after: npm test -- --testPathPattern=composition"

Spawn Agent B with prompt:
"Execute the task in .claude/refactor/tasks/phase-5-task-5.2-parallel.md
This updates App.tsx to use the new GameScreen location.
Run tests after: npm test"

Spawn Agent C with prompt:
"Execute the task in .claude/refactor/tasks/phase-5-task-5.5-parallel.md
This creates docs/ARCHITECTURE.md and updates README."
```

### Step 2: Wait for Wave 1 Completion

All 3 agents must complete before proceeding.

**Verify Wave 1:**
```bash
npx tsc --noEmit
npm test
```

### Step 3: Execute Wave 2 (Sequential)

**Only after Agent B (5.2) completes:**

```
Execute .claude/refactor/tasks/phase-5-task-5.3-sequential.md
```

This deletes the old `src/screens/GameScreen.tsx`.

**Verify Wave 2:**
```bash
test ! -f src/screens/GameScreen.tsx && echo "✅ Deleted"
npx tsc --noEmit
npm test
```

### Step 4: Execute Wave 3 (Sequential)

**Only after 5.3 completes:**

```
Execute .claude/refactor/tasks/phase-5-task-5.4-sequential.md
```

This creates the E2E test suite.

**Verify Wave 3:**
```bash
npm test -- --testPathPattern=e2e
npm test
```

### Step 5: Final Verification

```bash
# All tests
npm test

# Type check
npx tsc --noEmit

# Manual smoke test
npm run ios
```

---

## Multi-Agent Execution Guide

### How to Spawn Sub-Agents

When the task says "Spawn Agent X", this means:

1. Start a new Claude Code session/thread
2. Give it the specific task file to execute
3. Let it run independently

### Parallel Safety

Wave 1 tasks are safe to run in parallel because:
- Agent A modifies `src/composition/` (new directory)
- Agent B modifies `app/App.tsx` (single file)
- Agent C modifies `docs/` and `README.md` (separate files)

No file conflicts are possible.

### Dependency Enforcement

- **Wave 2 (5.3)** MUST wait for Wave 1 Agent B (5.2) to complete
- **Wave 3 (5.4)** MUST wait for Wave 2 (5.3) to complete

Do NOT proceed to the next wave until verification passes.

---

## Task File Format

Each task file in `.claude/refactor/tasks/` contains:

1. **Agent Assignment** - Wave and parallel/sequential info
2. **Objective** - What to accomplish
3. **Files to Create/Modify** - Specific paths
4. **Implementation** - Code to write
5. **Verification Commands** - How to test
6. **Completion Criteria** - Checklist

---

## Rollback Plan

If something breaks:

```bash
# Restore from git
git checkout HEAD -- <path/to/file>

# Or reset entire phase
git reset --hard HEAD~N  # N = number of commits in phase
```

---

## After Phase 5 Completion

Update `.claude/refactor/REFACTOR_PROGRESS.md`:
- Mark all Phase 5 tasks as ✅ Complete
- Update "Current Phase" to "COMPLETE"
- Document any remaining cleanup items

The refactoring is complete when:
- All tests pass
- No TypeScript errors
- Manual smoke test passes
- Documentation is updated
