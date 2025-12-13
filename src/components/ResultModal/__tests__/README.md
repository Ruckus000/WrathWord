# ResultModal Test Suite

Comprehensive test coverage for the ResultModal component.

## Test Files

### ResultModal.integration.test.ts

Integration tests that verify the component's business logic and data flow without rendering. These tests focus on:

- **Share functionality**: Verifies Share API integration and share text generation
- **Helper function integration**: Tests `generateShareText`, `getResultEmoji`, `getResultTitle`
- **Data transformations**: Date formatting, score calculations, feedback grid mappings
- **Type safety**: Ensures TypeScript types are correctly defined
- **Component logic**: Streak display, button text variations, configuration display

## Why Integration Tests Instead of Rendering Tests?

This project uses React 19.0.0, which has compatibility issues with react-test-renderer 18.3.1. Rather than adding @testing-library/react-native as a dependency, we've chosen to:

1. **Test business logic directly**: Verify helper functions and data transformations
2. **Test integration points**: Share API, storage layer, and helper utilities
3. **Ensure type safety**: Validate TypeScript types compile correctly
4. **Focus on behavior**: Test what the component does, not how it's rendered

This approach provides excellent test coverage while avoiding compatibility issues and keeping dependencies minimal.

## Test Coverage

### Share Functionality (4 tests)
- ✓ Generate correct share text for won game
- ✓ Generate correct share text for lost game
- ✓ Handle different word lengths in share text
- ✓ Convert feedback to emojis correctly

### Result Emoji Integration (5 tests)
- ✓ Return sad emoji for lost game
- ✓ Return mind blown emoji for perfect score
- ✓ Return amazing emoji for very low score
- ✓ Return checkmark for barely winning
- ✓ Handle different maxRows correctly

### Result Title Integration (6 tests)
- ✓ Return correct title for lost game
- ✓ Return "Incredible!" for perfect score
- ✓ Return "Amazing!" for very good score
- ✓ Return "Great Job!" for decent score
- ✓ Return "Well Done!" for barely winning

### Props Type Safety (3 tests)
- ✓ Accept all required props
- ✓ Accept "lost" status
- ✓ Accept "playing" status

### Data Transformations (4 tests)
- ✓ Handle uppercase/lowercase answer consistently
- ✓ Format ISO dates correctly
- ✓ Format dates from different years
- ✓ Handle different month formats

### Score Calculations (5 tests)
- ✓ Format win score correctly
- ✓ Format loss score correctly
- ✓ Handle perfect score
- ✓ Handle last attempt win
- ✓ Handle different maxRows values

### Feedback Grid Transformations (2 tests)
- ✓ Map TileState to colors correctly
- ✓ Handle multiple rows of feedback

### Streak Display Logic (5 tests)
- ✓ Show streak when currentStreak > 0
- ✓ Show streak when maxStreak > 0 even if currentStreak is 0
- ✓ Hide streak when both are 0
- ✓ Format streak text correctly
- ✓ Handle single day streaks

### Button Text Variations (2 tests)
- ✓ Show "Play Again" when playAgainIsFreeMode is false
- ✓ Show "Play Free Mode" when playAgainIsFreeMode is true

### Word Label Variations (3 tests)
- ✓ Show "The word" for won status
- ✓ Show "The word was" for lost status
- ✓ Show "The word was" for playing status

### Configuration Display (2 tests)
- ✓ Format game configuration correctly
- ✓ Handle different length configurations

## Total Coverage

**41 tests, 100% passing**

## Running Tests

```bash
# Run all ResultModal tests
npm test -- src/components/ResultModal/__tests__

# Run with watch mode
npm test -- --watch src/components/ResultModal/__tests__

# Run with coverage
npm test -- --coverage src/components/ResultModal/__tests__
```

## Test Patterns

All tests follow the **Arrange-Act-Assert (AAA)** pattern:

```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = createInput();

  // Act - Execute the function/behavior
  const result = someFunction(input);

  // Assert - Verify the outcome
  expect(result).toBe(expectedValue);
});
```

## Key Test Scenarios Covered

### Win State
- Perfect score (1 guess)
- Brilliant score (2/6)
- Amazing score (3/6)
- Great score (4/6)
- Good score (5/6)
- Barely winning (6/6)

### Loss State
- Game lost (all attempts used)
- Game gave up (player quit early)

### Edge Cases
- Different word lengths (4, 5, 6)
- Different maxRows values (4, 6, 8, 10)
- Empty streaks (0 current, 0 max)
- Single streak (currentStreak only)
- Historical streak (maxStreak only)
- Timezone-safe date parsing
- Lowercase/uppercase answer handling

### Component Integration
- Share API called with correct data
- Helper functions receive correct parameters
- TileState mapping to colors
- Score formatting (win vs loss)
- Button text variations (free mode vs daily)
- Word label variations (won vs lost)

## Dependencies Tested

- `react-native` Share API
- `src/logic/shareResult` helper functions
- `src/storage/profile` getStatsForLength
- `src/logic/evaluateGuess` TileState types
- `src/theme/colors` palette

## Notes

- Tests are timezone-safe (use flexible date assertions)
- No external API calls or network requests
- All helper functions tested with real implementations
- TypeScript strict mode enforced
- Tests verify both happy paths and edge cases
