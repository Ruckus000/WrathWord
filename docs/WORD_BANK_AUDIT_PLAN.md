# Word Bank System Audit Plan

**Document Version:** 1.0
**Date:** 2025-12-11
**Prepared by:** DevOps Engineering Team
**Status:** Draft for Review

---

## Executive Summary

This audit plan addresses three critical concerns identified in the WrathWord word puzzle game:

1. **Lack of comprehensive word bank selection system** - No quality scoring, difficulty classification, or intelligent word selection beyond basic seeded randomization
2. **Daily puzzle replay vulnerability** - Users can replay completed daily puzzles indefinitely via the "Play Again" button
3. **Insufficient word bank for short words** - The 2-letter word pool (119 words) is critically small; 3-letter pool (1,199 words) may also be insufficient

---

## Audit Scope

### Files Under Review

| Category | Files | Purpose |
|----------|-------|---------|
| **Word Data** | `src/logic/words/answers-{2-6}.ts` | Answer word pools |
| | `src/logic/words/allowed-{2-6}.ts` | Valid guess word lists |
| **Selection Logic** | `src/logic/selectDaily.ts` | Daily puzzle word selection |
| | `src/screens/GameScreen.tsx:105-137` | `loadNew()` function |
| **Completion Tracking** | `src/hooks/useUserPlayedToday.ts` | Completion detection hook |
| | `src/storage/profile.ts` | User stats and word tracking |
| **Generation Scripts** | `scripts/generate-word-lists.js` | Word list generation |

---

## AREA 1: Word Bank Selection System

### Current State Assessment

**Finding 1.1: Basic Selection Algorithm**
- Location: `src/logic/selectDaily.ts`
- The current selection uses FNV-1a hashing + Mulberry32 PRNG
- Selection is purely index-based with no quality weighting
- No difficulty classification or user skill matching

**Finding 1.2: No Word Quality Scoring**
- Words are treated as equal regardless of:
  - Common letter frequency
  - Difficulty (obscure vs. common words)
  - Player skill level or history
  - Geographic/cultural familiarity

**Finding 1.3: Static Word Pool Management**
- Word pools loaded at build time
- No A/B testing capability
- No hot-swapping or remote word updates
- No seasonal or themed word rotation

### Recommended Improvements

#### Phase 1: Word Metadata Enhancement (Priority: HIGH)

**1.1.1 Implement Word Difficulty Scoring**
```
Create: src/logic/wordMetadata.ts
```
- Calculate difficulty score based on:
  - Letter frequency (e, t, a, o, i = common; q, z, x, j = rare)
  - Bigram rarity
  - Word commonality (frequency in English corpus)
  - Number of unique letters
- Store difficulty tiers: `easy`, `medium`, `hard`, `expert`

**1.1.2 Add Word Categories/Tags**
- Part of speech (noun, verb, adjective)
- Domain (science, sports, food, etc.)
- Cultural relevance scoring
- Enables themed puzzles and diverse selection

#### Phase 2: Intelligent Selection Engine (Priority: HIGH)

**1.2.1 Create Selection Strategy Pattern**
```
Create: src/logic/wordSelectionStrategy.ts
```
- Interface for pluggable selection strategies
- Strategies: `DailyDeterministic`, `FreePlayRandom`, `ProgressiveChallenge`, `ThemedSelection`
- Enable runtime strategy switching

**1.2.2 Implement Adaptive Difficulty**
- Track user performance per word length
- Adjust difficulty based on win rate and guess distribution
- New players start with easier words
- Experienced players get progressively harder words

#### Phase 3: Remote Configuration (Priority: MEDIUM)

**1.3.1 Remote Word Bank Updates**
- Implement API endpoint for word list versioning
- Support incremental updates without app release
- Enable A/B testing of word pools
- Allow emergency word removal (inappropriate words discovered post-release)

**1.3.2 Feature Flags for Selection Logic**
- Use feature flags for selection algorithm experiments
- Enable gradual rollout of new selection strategies
- Support regional word variations

### Metrics to Collect

| Metric | Purpose |
|--------|---------|
| `word_difficulty_distribution` | Ensure balanced daily puzzle difficulty |
| `selection_strategy_performance` | Compare user engagement across strategies |
| `word_quality_complaints` | Track reports of obscure/unfair words |

---

## AREA 2: Daily Puzzle Replay Prevention

### Current State Assessment

**Finding 2.1: Critical - Replay Vulnerability Exists**
- Location: `src/screens/GameScreen.tsx:543-556`
- The "Play Again" button calls `loadNew()` directly
- **No check is performed** for daily puzzle completion status
- Users can replay the same daily puzzle or generate new dailies indefinitely

**Finding 2.2: Completion Tracking Exists but Unused**
- Completion markers are written: `daily.${length}x${maxRows}.${dateISO}.completed`
- Location: `GameScreen.tsx:274-276, 298-301`
- These markers are only checked in `handleCancel()` for first-launch flow
- **NOT enforced** in the main game flow or "Play Again" action

**Finding 2.3: Mode-Specific Behavior Not Enforced**
- Daily mode should restrict to one attempt per day per configuration
- Free play mode should allow unlimited replays
- Current implementation treats both modes the same after game completion

### Recommended Improvements

#### Phase 1: Immediate Fixes (Priority: CRITICAL)

**2.1.1 Enforce Daily Completion Check**
```
File: src/screens/GameScreen.tsx
Function: loadNew() and "Play Again" handler
```
Implementation:
```typescript
// Before starting a new daily game, check completion
if (effectiveMode === 'daily') {
  const completionKey = `daily.${effectiveLength}x${effectiveMaxRows}.${dateISO}.completed`;
  const alreadyCompleted = getJSON<boolean>(completionKey, false);

  if (alreadyCompleted) {
    // Option A: Auto-switch to free play
    // Option B: Show "already played" message and block
    // Option C: Allow viewing results but not replaying
    return handleDailyAlreadyCompleted();
  }
}
```

**2.1.2 Update "Play Again" Button Behavior**
- For daily mode after completion:
  - Change button text to "Play Free Mode" or "Try Another Word"
  - Auto-switch to free play mode
  - Or disable until next day with countdown timer
- For free play mode:
  - Allow unlimited replays (current behavior is correct)

**2.1.3 Add Visual Completion Indicator**
- Show checkmark or "Completed" badge for daily puzzles
- Display next daily puzzle countdown timer
- Make it clear to users they've completed today's challenge

#### Phase 2: Enhanced Enforcement (Priority: HIGH)

**2.2.1 Server-Side Validation (If Applicable)**
- If leaderboard/cloud sync exists, validate completion server-side
- Prevent score manipulation via local storage tampering
- Implement completion signature/hash

**2.2.2 Comprehensive Completion State**
```
Create: src/hooks/useDailyCompletionState.ts
```
- Centralized hook for daily completion status
- Check completion status at app launch and mode switch
- Auto-redirect to appropriate game mode

**2.2.3 Per-Configuration Tracking**
- Track completion for each (length × maxRows) combination
- Example: User may have completed 5×6 but not 4×8
- Allow playing uncompleted configurations in daily mode

### Test Cases Required

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| `DAILY-001` | Complete daily, click "Play Again" | Switch to free play or show blocker |
| `DAILY-002` | Complete daily, relaunch app | Show completion state, block replay |
| `DAILY-003` | Complete 5×6 daily, try 4×8 daily | Allow (different configuration) |
| `DAILY-004` | Change device date forward | Validate against server time (if available) |
| `DAILY-005` | Clear app storage | Graceful handling, possibly allow replay (edge case) |

---

## AREA 3: Word Bank Size Analysis

### Current State Assessment

**Finding 3.1: Word Pool Statistics**

| Length | Answers | Allowed | Days of Unique Content | Risk Level |
|--------|---------|---------|------------------------|------------|
| 2-letter | 119 | 179 | ~120 days | **CRITICAL** |
| 3-letter | 1,199 | 1,403 | ~3.3 years | MEDIUM |
| 4-letter | 3,999 | 5,519 | ~11 years | LOW |
| 5-letter | 2,314 | 14,854 | ~6.3 years | LOW |
| 6-letter | 3,499 | 7,804 | ~9.6 years | LOW |

**Finding 3.2: 2-Letter Pool is Critically Small**
- Only 119 answer words
- Users playing daily will exhaust pool in ~4 months
- Pool includes words like: "aa", "ab", "ad", "ae", etc.
- Many are obscure or abbreviations (not common words)

**Finding 3.3: Validation Pool Ratio Concerns**
- 2-letter: 1.50× ratio (answers:allowed) - **TOO RESTRICTIVE**
- 5-letter: 6.42× ratio - Good balance
- Recommendation: Allowed pool should be 3-5× answer pool size

**Finding 3.4: Generation Script Configuration**
```javascript
// From scripts/generate-word-lists.js
const COMMON_WORDS_THRESHOLD = {
  2: 120,    // Very limited
  3: 1200,   // Moderate
  // ...
};
```

### Recommended Improvements

#### Phase 1: Expand Short Word Banks (Priority: HIGH)

**3.1.1 Research and Expand 2-Letter Pool**
- Audit current 2-letter words for quality
- Sources to consider:
  - Scrabble dictionary (TWL/SOWPODS)
  - Educational word lists
  - Common abbreviations accepted in word games
- Target: **200-250 answer words**
- Target: **400-500 allowed words**

**3.1.2 Validate 3-Letter Pool Quality**
- Review current 1,199 words for:
  - Obscure/archaic words (consider removing or downranking)
  - Missing common words
  - Regional variations
- Target: **1,500-2,000 answer words**

**3.1.3 Expand Allowed Word Lists**
- Increase validation pool ratio to 3-5× for short words
- Improves player experience (fewer "not in word list" errors)
- Consider lenient validation for casual players

#### Phase 2: Word Quality Audit (Priority: MEDIUM)

**3.2.1 Automated Word Quality Scoring**
```
Create: scripts/audit-word-quality.js
```
- Flag potentially problematic words:
  - Very obscure (frequency < threshold)
  - Potentially offensive (needs manual review)
  - Proper nouns that slipped through
  - Abbreviations vs. actual words

**3.2.2 Word Source Documentation**
- Document source of each word list
- Track word additions/removals with justification
- Enable reproducible word list generation

**3.2.3 Community Feedback Integration**
- Allow in-app reporting of "unfair" words
- Track words with high skip/give-up rates
- Consider removal or difficulty adjustment

#### Phase 3: Dynamic Pool Management (Priority: LOW)

**3.3.1 Seasonal Word Rotation**
- Add themed words for holidays/events
- Remove seasonal words post-event
- Keeps content fresh for returning users

**3.3.2 Regional Word Variants**
- US English vs. UK English spellings
- Regional vocabulary differences
- User locale preference

### Immediate Actions Required

1. **Audit 2-letter word list manually** - Remove obscure words, add common ones
2. **Run frequency analysis** on all word pools
3. **Document word sources** and generation criteria
4. **Establish minimum pool size policy**:
   - 2-letter: Minimum 200 answers
   - 3-letter: Minimum 1,500 answers
   - 4-6 letter: Current sizes acceptable

---

## Implementation Roadmap

### Sprint 1: Critical Fixes (1-2 weeks)

| Task | Priority | Estimated Effort |
|------|----------|------------------|
| Fix daily replay vulnerability | CRITICAL | 2-4 hours |
| Add daily completion check to loadNew() | CRITICAL | 2-3 hours |
| Update "Play Again" button for daily mode | HIGH | 3-4 hours |
| Unit tests for completion enforcement | HIGH | 4-6 hours |

### Sprint 2: Word Bank Quality (2-3 weeks)

| Task | Priority | Estimated Effort |
|------|----------|------------------|
| Manual audit of 2-letter words | HIGH | 4-6 hours |
| Research additional 2-letter words | HIGH | 8-12 hours |
| Create word quality scoring script | MEDIUM | 8-12 hours |
| Update generate-word-lists.js | MEDIUM | 4-6 hours |
| Update word lists and test | HIGH | 4-8 hours |

### Sprint 3: Selection System Enhancement (3-4 weeks)

| Task | Priority | Estimated Effort |
|------|----------|------------------|
| Design word metadata schema | HIGH | 4-6 hours |
| Implement difficulty scoring | HIGH | 12-16 hours |
| Create selection strategy interface | MEDIUM | 8-12 hours |
| Implement adaptive difficulty | MEDIUM | 16-24 hours |
| A/B testing infrastructure | LOW | 16-24 hours |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users exploit daily replay | HIGH | MEDIUM | Sprint 1 fix |
| 2-letter pool exhausted | MEDIUM | HIGH | Sprint 2 expansion |
| Word quality complaints | MEDIUM | MEDIUM | Quality scoring + reporting |
| Breaking change to saved games | LOW | HIGH | Migration strategy needed |

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Daily replay prevention | 0% | 100% | Sprint 1 |
| 2-letter word pool size | 119 | 200+ | Sprint 2 |
| Word difficulty distribution | Unknown | 30/40/20/10% (easy/med/hard/expert) | Sprint 3 |
| User reports of unfair words | Unknown | <1% of games | Ongoing |

---

## Appendix A: Current Word Bank Statistics

```
2-letter: 119 answers / 179 allowed (ratio: 1.50)
3-letter: 1,199 answers / 1,403 allowed (ratio: 1.17)
4-letter: 3,999 answers / 5,519 allowed (ratio: 1.38)
5-letter: 2,314 answers / 14,854 allowed (ratio: 6.42)
6-letter: 3,499 answers / 7,804 allowed (ratio: 2.23)
```

## Appendix B: Key Code References

- Daily selection: `src/logic/selectDaily.ts:1-20`
- Game state management: `src/screens/GameScreen.tsx:71-160`
- Completion tracking: `src/screens/GameScreen.tsx:273-301`
- "Play Again" handler: `src/screens/GameScreen.tsx:543-556`
- Word tracking: `src/storage/profile.ts` (markWordAsUsed, getUnusedWords)
- Completion hook: `src/hooks/useUserPlayedToday.ts`

---

**Document Approved By:** _________________
**Date:** _________________
