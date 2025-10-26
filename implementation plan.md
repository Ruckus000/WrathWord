Based on your build outline document, here's a comprehensive multi-step implementation plan:

## 📋 WrathWord Implementation Plan

### **Phase 0: Environment Setup & Validation** (30 min)
- [ ] Verify React Native CLI installation (`npx react-native --version`)
- [ ] Verify Node.js 18+ and npm/yarn
- [ ] Verify Xcode installation with iOS simulator
- [ ] Initialize React Native project in WrathWord folder
- [ ] Test initial app runs on iOS simulator
- [ ] Configure TypeScript, Babel, Metro bundler

### **Phase 1: Core Dependencies & Configuration** (45 min)
- [ ] Install required packages:
  - `react-native-safe-area-context`
  - `react-native-mmkv`
  - `react-native-haptic-feedback`
- [ ] Set up TypeScript configuration (`tsconfig.json`)
- [ ] Configure Babel (`babel.config.js`)
- [ ] Link native modules for iOS (`cd ios && pod install`)
- [ ] Verify all dependencies resolve correctly
- [ ] Test build with new dependencies

### **Phase 2: Project Structure & Utilities** (1 hour)
- [ ] Create folder structure:
  ```
  src/
    screens/
    logic/
      words/
    storage/
    theme/
  ```
- [ ] Implement `src/theme/colors.ts` (palette)
- [ ] Implement `src/storage/mmkv.ts` (persistence layer)
- [ ] Implement `src/logic/rng.ts` (PRNG functions)
- [ ] Write unit tests for RNG to verify determinism
- [ ] Implement `src/logic/selectDaily.ts` (daily word selection)

### **Phase 3: Game Logic Core** (1.5 hours)
- [ ] Implement `src/logic/evaluateGuess.ts`:
  - Two-pass algorithm for duplicate letters
  - Unit tests for edge cases (ROBOT/FLOOR, ABBEY/KEBAB, etc.)
- [ ] Create test suite with known answers/guesses
- [ ] Verify correct/present/absent logic is bulletproof
- [ ] Test with all word lengths (2-6)

### **Phase 4: Word Lists** (1 hour)
- [ ] Source or create word lists for lengths 2-6
- [ ] Create `answers-{2,3,4,5,6}.json` (curated lists, 200-500 words each)
- [ ] Create `allowed-{2,3,4,5,6}.json` (broader lists, 500-2000 words each)
- [ ] Ensure answers are subsets of allowed
- [ ] Validate JSON format and lowercase consistency
- [ ] Test dynamic imports work correctly

### **Phase 5: App Shell** (30 min)
- [ ] Create `app/App.tsx`:
  - Wrap with `SafeAreaProvider`
  - Render single `GameScreen`
  - Verify safe area insets work on notched devices
- [ ] Test on various iOS simulator devices
- [ ] Remove any navigation or multi-screen code

### **Phase 6: GameScreen Foundation** (2 hours)
- [ ] Create `src/screens/GameScreen.tsx` base structure
- [ ] Implement state management:
  - `length`, `mode`, `answer`, `rows`, `feedback`, `current`, `status`
- [ ] Implement settings controls:
  - Segmented length picker (2-6)
  - Daily/Free toggle
  - New game button
- [ ] Wire up MMKV persistence:
  - Load/save settings
  - Load/save session state
- [ ] Implement word list loading (dynamic imports)
- [ ] Implement game initialization logic

### **Phase 7: Game Board UI** (2 hours)
- [ ] Create `Board` component (memoized)
- [ ] Create `Tile` component with states:
  - Empty (border only)
  - Correct (green)
  - Present (yellow)
  - Absent (gray)
- [ ] Implement 6-row grid with dynamic tile count
- [ ] Show current input in active row
- [ ] Apply styling with proper sizing/spacing
- [ ] Test responsiveness on different screen sizes

### **Phase 8: On-Screen Keyboard** (2 hours)
- [ ] Create `Keyboard` component (memoized)
- [ ] Create `Key` component with states (correct/present/absent)
- [ ] Layout three rows: QWERTYUIOP / ASDFGHJKL / ZXCVBNM
- [ ] Add ENTER and DEL keys to bottom row
- [ ] Implement key state calculation (precedence: correct > present > absent)
- [ ] Wire up keyboard to input handler
- [ ] Test tap targets are comfortable (min 44x44 points)

### **Phase 9: Game Logic Integration** (2 hours)
- [ ] Implement `onKey` handler:
  - Letter input (A-Z)
  - DEL (backspace)
  - ENTER (submit guess)
- [ ] Implement guess validation:
  - Check word length
  - Validate against allowed list
  - Show error feedback for invalid words
- [ ] Implement guess submission:
  - Call `evaluateGuess`
  - Update rows and feedback
  - Check win condition
  - Check loss condition (6 guesses)
- [ ] Update game status accordingly

### **Phase 10: Haptics & Accessibility** (1 hour)
- [ ] Integrate `react-native-haptic-feedback`:
  - Medium impact on valid guess submission
  - Success notification on win
  - Warning notification on loss
- [ ] Add accessibility features:
  - Proper roles for all interactive elements
  - Accessibility labels for tiles (letter + state)
  - `AccessibilityInfo.announceForAccessibility` for:
    - Invalid word errors
    - Win announcements
    - Loss announcements with answer reveal
- [ ] Test with VoiceOver enabled

### **Phase 11: Result Modal** (1 hour)
- [ ] Create result overlay (Modal component)
- [ ] Design win screen: "You Win!"
- [ ] Design loss screen: "The word was {ANSWER}"
- [ ] Add "Play again" button
- [ ] Wire up modal to game status
- [ ] Apply styling consistent with theme
- [ ] Test modal dismissal and game restart

### **Phase 12: Daily Mode Logic** (1 hour)
- [ ] Implement daily seed generation (ISO date string)
- [ ] Ensure deterministic word selection per date+length
- [ ] Test that same date returns same word
- [ ] Test that different dates return different words
- [ ] Persist daily session state
- [ ] Handle day rollover correctly

### **Phase 13: Polish & Optimization** (2 hours)
- [ ] Apply `React.memo` to all UI components
- [ ] Optimize callbacks with `useCallback`
- [ ] Optimize derived state with `useMemo`
- [ ] Verify no unnecessary re-renders
- [ ] Apply safe-area insets properly
- [ ] Fine-tune spacing, sizing, colors
- [ ] Test on various iOS devices/simulators
- [ ] Ensure 60fps performance

### **Phase 14: Testing & Edge Cases** (2 hours)
- [ ] Test all word lengths (2-6)
- [ ] Test Daily mode consistency
- [ ] Test Free Play randomness
- [ ] Test duplicate letter handling thoroughly
- [ ] Test keyboard state updates correctly
- [ ] Test persistence across app restarts
- [ ] Test invalid word submissions
- [ ] Test win/loss scenarios
- [ ] Test mode and length switching mid-game

### **Phase 15: Build & Package** (1 hour)
- [ ] Create app icon (1024x1024)
- [ ] Configure iOS app settings (Bundle ID, Display Name)
- [ ] Test release build
- [ ] Verify app size is reasonable
- [ ] Create build documentation
- [ ] Document any known issues or limitations

---

## 📊 Estimated Timeline
- **Total Development Time**: 18-22 hours
- **With testing buffer**: 25-30 hours
- **Recommended schedule**: 5-7 days (3-4 hours/day)

## 🎯 Success Criteria
- ✅ App runs smoothly on iOS simulator
- ✅ All 5 word lengths (2-6) work correctly
- ✅ Daily mode returns consistent words per day
- ✅ Duplicate letter logic is perfect
- ✅ Keyboard states update with correct precedence
- ✅ Haptics work on device
- ✅ VoiceOver announcements work
- ✅ Settings persist across app restarts
- ✅ No crashes or console errors
- ✅ Clean, maintainable code

## 🚨 Critical Path Items
1. **Get evaluateGuess logic perfect** - This is the heart of the game
2. **Ensure word lists are complete** - No missing words or validation issues
3. **Test daily mode determinism** - Same day = same word, always
4. **Safe-area handling** - Must work on notched devices

## 💡 Optional Enhancements (Post-MVP)
- Statistics tracking (streak, win %, guess distribution)
- Share results (emoji grid copy to clipboard)
- Hard mode (revealed letters must be used)
- Color blind mode (high contrast colors)
- Dark/light theme toggle
- Animations for tile reveals

