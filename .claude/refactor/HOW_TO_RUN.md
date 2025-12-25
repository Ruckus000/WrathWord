# How to Run the Refactoring with Claude Code

## Option 1: Single Command (Recommended)

Open Claude Code in your WrathWord project directory and paste this prompt:

```
Execute the TDD refactoring plan. Read .claude/refactor/REFACTOR_PROGRESS.md to find the current task, then read the task file from .claude/refactor/tasks/ and execute it completely. After completing each task:
1. Update REFACTOR_PROGRESS.md to mark it complete
2. Commit the changes
3. Immediately proceed to the next task

Continue until all tasks in all phases are complete. Do not stop to ask questions - if something is unclear, make the best judgment based on the task file and existing code patterns. Only stop if tests fail and you cannot fix them after 3 attempts.
```

## Option 2: Add to Project Instructions

Add this to your Claude Code project settings or `.claude/settings.json`:

```json
{
  "customInstructions": "When working on this project, check .claude/refactor/REFACTOR_PROGRESS.md first. If there are incomplete refactoring tasks, prioritize completing them using the task files in .claude/refactor/tasks/. Follow the test-first protocol: write tests, verify they fail, implement, verify they pass, commit, proceed to next task."
}
```

## Option 3: Batch Processing Prompt

For longer autonomous sessions, use this prompt:

```
You are executing a structured refactoring plan for WrathWord. Your protocol:

1. READ: .claude/refactor/REFACTOR_PROGRESS.md to identify current task
2. LOAD: The corresponding task file from .claude/refactor/tasks/phase-X-task-Y.md
3. EXECUTE: Follow the task exactly:
   - Create directories if needed
   - Write tests first (copy from task file)
   - Run tests (expect failure)
   - Implement code
   - Run tests (expect pass)
   - Run full test suite
   - Type check
4. COMMIT: With descriptive message from task file
5. UPDATE: Mark task complete in REFACTOR_PROGRESS.md
6. REPEAT: Go to step 1 for next task

STOPPING CONDITIONS:
- All tasks complete (success!)
- Tests fail after 3 fix attempts (report which tests)
- TypeScript errors you cannot resolve (report which errors)

DO NOT ASK FOR CONFIRMATION. Execute autonomously.

Begin now.
```

## What Happens

Claude Code will:
1. Check progress file to find current task
2. Read the task file with exact instructions
3. Create test files (tests should initially fail or not compile)
4. Create implementation files
5. Run tests until they pass
6. Verify no regressions
7. Commit changes
8. Update progress
9. Move to next task
10. Repeat until done

## Monitoring Progress

Check `.claude/refactor/REFACTOR_PROGRESS.md` to see:
- Which tasks are complete (✅)
- Which task is in progress (🔄)
- Current phase

Check git log to see commits:
```bash
git log --oneline -20
```

## If Something Goes Wrong

1. Check the failing tests:
   ```bash
   npm test -- --testPathPattern="<failing-test>"
   ```

2. Check TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

3. Review the task file for the current task

4. Resume by giving Claude Code the same prompt - it will pick up where it left off

## Estimated Duration

- Phase 0 (Characterization): ~1-2 hours
- Phase 1 (Domain): ~3-4 hours  
- Phase 2 (Application): ~2-3 hours
- Phase 3 (Infrastructure): ~2 hours
- Phase 4 (Presentation): ~3-4 hours
- Phase 5 (Cleanup): ~1 hour

**Total: ~12-16 hours of Claude Code execution time**

Note: This is execution time, not wall clock time. Claude Code may need multiple sessions.
