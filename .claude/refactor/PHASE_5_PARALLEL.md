# Phase 5: Parallel Execution Guide

## 🚀 MULTI-AGENT EXECUTION REQUIRED

**This phase uses 3 parallel agents in Wave 1.**

---

## QUICK START: Spawn 3 Agents Now

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SPAWN THESE 3 AGENTS SIMULTANEOUSLY:                                   │
│                                                                         │
│  Agent A: "Execute .claude/refactor/tasks/phase-5-task-5.1-parallel.md" │
│  Agent B: "Execute .claude/refactor/tasks/phase-5-task-5.2-parallel.md" │
│  Agent C: "Execute .claude/refactor/tasks/phase-5-task-5.5-parallel.md" │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Overview

Phase 5 has **3-wave execution** due to dependencies.

### Dependency Graph

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  5.1 DI Wiring  │     │  5.2 App.tsx    │     │ 5.5 Docs Update │
│  (Composition)  │     │  (Switch Imports)│     │  (Independent)  │
│     Agent A     │     │     Agent B      │     │     Agent C     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │  5.3 Remove     │              │
         │              │  Legacy Code    │              │
         │              │  (Sequential)   │              │
         │              └────────┬────────┘              │
         │                       │                       │
         │              ┌────────▼────────┐              │
         └──────────────┤  5.4 E2E Tests  ├──────────────┘
                        │  (Sequential)   │
                        └─────────────────┘
```

---

## Execution Strategy

### Wave 1: PARALLEL (3 Agents)

**All 3 agents run at the same time - no waiting between them.**

| Agent | Task File | What It Does | Output |
|-------|-----------|--------------|--------|
| A | `phase-5-task-5.1-parallel.md` | Creates DI composition root | `src/composition/` |
| B | `phase-5-task-5.2-parallel.md` | Updates App.tsx imports | `app/App.tsx` |
| C | `phase-5-task-5.5-parallel.md` | Creates architecture docs | `docs/` |

**Why parallel?** These tasks work on completely different files with no conflicts.

### Wave 2: SEQUENTIAL (After Wave 1)

**Must wait for Agent B (5.2) to complete.**

| Task File | What It Does | Output |
|-----------|--------------|--------|
| `phase-5-task-5.3-sequential.md` | Deletes old GameScreen | Removes `src/screens/GameScreen.tsx` |

**Why sequential?** Cannot delete old GameScreen until App.tsx imports from new location.

### Wave 3: SEQUENTIAL (After Wave 2)

**Must wait for Task 5.3 to complete.**

| Task File | What It Does | Output |
|-----------|--------------|--------|
| `phase-5-task-5.4-sequential.md` | Creates E2E tests | `__tests__/e2e/` |

**Why sequential?** E2E tests verify the final clean state after legacy removal.

---

## Detailed Execution Steps

### Step 1: Spawn Wave 1 Agents

**Do this NOW:**

```
Agent A Prompt:
"You are executing a refactoring task. Read and follow the instructions in 
.claude/refactor/tasks/phase-5-task-5.1-parallel.md exactly. 
Create only the files specified in that task."

Agent B Prompt:
"You are executing a refactoring task. Read and follow the instructions in 
.claude/refactor/tasks/phase-5-task-5.2-parallel.md exactly. 
Modify only app/App.tsx as specified."

Agent C Prompt:
"You are executing a refactoring task. Read and follow the instructions in 
.claude/refactor/tasks/phase-5-task-5.5-parallel.md exactly. 
Create only documentation files as specified."
```

### Step 2: Wait for All Wave 1 Agents

Do not proceed until all 3 agents report completion.

### Step 3: Verify Wave 1

```bash
# Check Agent A output
test -f src/composition/GameModule.ts && echo "✅ 5.1 Done"

# Check Agent B output
grep -q "presentation/screens/Game/GameScreen" app/App.tsx && echo "✅ 5.2 Done"

# Check Agent C output
test -f docs/ARCHITECTURE.md && echo "✅ 5.5 Done"

# Run tests
npm test

# Type check
npx tsc --noEmit
```

### Step 4: Execute Wave 2

```
Execute: .claude/refactor/tasks/phase-5-task-5.3-sequential.md
```

### Step 5: Verify Wave 2

```bash
test ! -f src/screens/GameScreen.tsx && echo "✅ 5.3 Done"
npm test
npx tsc --noEmit
```

### Step 6: Execute Wave 3

```
Execute: .claude/refactor/tasks/phase-5-task-5.4-sequential.md
```

### Step 7: Final Verification

```bash
ls __tests__/e2e/*.e2e.test.ts
npm test
npx tsc --noEmit
echo "✅ Phase 5 Complete"
```

---

## File Changes Summary

### Files Created (Wave 1)
```
src/composition/
├── GameModule.ts              # Agent A
├── index.ts                   # Agent A
└── __tests__/
    └── GameModule.test.ts     # Agent A

docs/
└── ARCHITECTURE.md            # Agent C
```

### Files Modified (Wave 1)
```
app/App.tsx                    # Agent B
README.md                      # Agent C
```

### Files Deleted (Wave 2)
```
src/screens/GameScreen.tsx     # Old 600+ line version
```

### Files Created (Wave 3)
```
__tests__/e2e/
├── game-flow.e2e.test.ts
├── daily-completion.e2e.test.ts
├── stats-recording.e2e.test.ts
└── hint-system.e2e.test.ts
```

---

## Task File Locations

| Wave | Task | File Path |
|------|------|-----------|
| 1 | 5.1 | `.claude/refactor/tasks/phase-5-task-5.1-parallel.md` |
| 1 | 5.2 | `.claude/refactor/tasks/phase-5-task-5.2-parallel.md` |
| 1 | 5.5 | `.claude/refactor/tasks/phase-5-task-5.5-parallel.md` |
| 2 | 5.3 | `.claude/refactor/tasks/phase-5-task-5.3-sequential.md` |
| 3 | 5.4 | `.claude/refactor/tasks/phase-5-task-5.4-sequential.md` |

---

## Estimated Time

| Wave | Tasks | Execution | Time |
|------|-------|-----------|------|
| 1 | 5.1, 5.2, 5.5 | 3 parallel agents | ~10 min |
| 2 | 5.3 | 1 agent | ~5 min |
| 3 | 5.4 | 1 agent | ~15 min |
| **Total** | | | **~30 min** |

Sequential would take ~50 min. **Parallel saves ~20 min (40% faster).**

---

## Troubleshooting

### "Agent B failed but A and C succeeded"
Re-run only Agent B's task. The other outputs are still valid.

### "Tests fail after Wave 1"
Check for conflicts. Agents should not modify the same files. Debug by running each agent's verification separately.

### "Import errors in Wave 2"
Wave 2 depends on Wave 1 completing. Ensure Agent B (5.2) successfully updated App.tsx before running 5.3.

---

## Checklist

- [ ] Wave 1: All 3 agents spawned
- [ ] Wave 1: All 3 agents completed
- [ ] Wave 1: Verification passed
- [ ] Wave 2: Task 5.3 executed
- [ ] Wave 2: Verification passed
- [ ] Wave 3: Task 5.4 executed
- [ ] Wave 3: Final verification passed
- [ ] REFACTOR_PROGRESS.md updated
