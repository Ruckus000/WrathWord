# WrathWord Refactoring - Claude Code Instructions

## Current Phase: 5 (Integration & Cleanup)

You are executing the WrathWord test-driven refactoring plan. This document provides instructions for Claude Code agents.

---

## Phase 5: Integration & Cleanup

### Execution Strategy: 3-Wave Parallel/Sequential

Phase 5 uses **multi-agent parallel execution** for Wave 1, then sequential execution for Waves 2 and 3.

### Wave 1: Parallel (3 Agents)

**Spawn 3 sub-agents simultaneously:**

```
Agent A: "Execute .claude/refactor/tasks/phase-5-task-5.1-parallel.md"
Agent B: "Execute .claude/refactor/tasks/phase-5-task-5.2-parallel.md"  
Agent C: "Execute .claude/refactor/tasks/phase-5-task-5.5-parallel.md"
```

| Agent | Task | Creates | No Conflicts |
|-------|------|---------|--------------|
| A | 5.1 DI Wiring | `src/composition/` | ✅ |
| B | 5.2 App.tsx | `app/App.tsx` | ✅ |
| C | 5.5 Documentation | `docs/`, README | ✅ |

**These agents can run simultaneously** because they modify completely different files.

### Wave 2: Sequential (After 5.2)

**Wait for Agent B (5.2) to complete, then execute:**

```
Execute .claude/refactor/tasks/phase-5-task-5.3-sequential.md
```

Task 5.3 (Remove Legacy Code) depends on 5.2 because:
- Cannot delete old GameScreen until App.tsx imports from new location
- Must verify imports work before removing old code

### Wave 3: Sequential (After 5.3)

**Wait for 5.3 to complete, then execute:**

```
Execute .claude/refactor/tasks/phase-5-task-5.4-sequential.md
```

Task 5.4 (E2E Tests) depends on 5.3 because:
- E2E tests verify the final clean state
- All deprecated code must be removed first

---

## Task Files Location

All task files are in `.claude/refactor/tasks/`:

```
.claude/refactor/tasks/
├── phase-5-task-5.1-parallel.md    (DI Wiring - Agent A)
├── phase-5-task-5.2-parallel.md    (App.tsx Update - Agent B)
├── phase-5-task-5.3-sequential.md  (Remove Legacy Code)
├── phase-5-task-5.4-sequential.md  (E2E Tests)
└── phase-5-task-5.5-parallel.md    (Documentation - Agent C)
```

---

## Verification After Each Wave

### After Wave 1 (All 3 Agents Complete)

```bash
# Type check
npx tsc --noEmit

# Run tests
npm test

# Verify new files exist
test -f src/composition/GameModule.ts && echo "✅ 5.1 complete"
grep -q "presentation/screens/Game/GameScreen" app/App.tsx && echo "✅ 5.2 complete"
test -f docs/ARCHITECTURE.md && echo "✅ 5.5 complete"
```

### After Wave 2 (5.3 Complete)

```bash
# Verify old file is gone
test ! -f src/screens/GameScreen.tsx && echo "✅ Old GameScreen deleted"

# Type check (ensure no broken imports)
npx tsc --noEmit

# All tests pass
npm test
```

### After Wave 3 (5.4 Complete)

```bash
# Run E2E tests
npm test -- --testPathPattern="e2e"

# Full test suite
npm test

# Type check
npx tsc --noEmit
```

---

## Final Phase 5 Checklist

After all waves complete:

- [ ] `src/composition/GameModule.ts` exists and tested
- [ ] `app/App.tsx` imports from `src/presentation/screens/Game/GameScreen`
- [ ] `app/App.tsx` uses NavigationProvider
- [ ] `src/screens/GameScreen.tsx` (old) is deleted
- [ ] `docs/ARCHITECTURE.md` documents the new structure
- [ ] E2E tests exist in `__tests__/e2e/`
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Manual smoke test passes: `npm run ios`

---

## Reference Documents

- **Full Plan:** `docs/architecture/TDD_REFACTORING_PLAN.md`
- **Progress Tracker:** `.claude/refactor/REFACTOR_PROGRESS.md`
- **Parallel Guide:** `.claude/refactor/PHASE_5_PARALLEL.md`

---

## Important Notes

1. **Wave 1 is fully parallel** - spawn all 3 agents at once
2. **Wave 2 depends on 5.2** - do NOT start until Agent B completes
3. **Wave 3 depends on 5.3** - do NOT start until legacy removal is verified
4. **Manual smoke test required** before declaring Phase 5 complete
