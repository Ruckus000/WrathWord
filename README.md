# WrathWord

A minimal, offline iOS word puzzle game built with React Native.

## Features
- Single-screen word game (Wordle-style)
- Variable word lengths (2-6 letters)
- Daily mode (deterministic word-of-the-day)
- Free play mode (random word)
- Offline-first with local persistence
- iOS haptics and accessibility support

## Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- Xcode (for iOS)

### Installation

```bash
npm install
cd ios && pod install && cd ..
```

### Run

```bash
npm run ios
```

## Tech Stack
- React Native 0.79.6
- TypeScript
- react-native-mmkv 2.x (persistence)
- react-native-safe-area-context
- react-native-linear-gradient

## Technical Notes

### Architecture Constraints

This project uses **Legacy Architecture** (not New Architecture/TurboModules) due to compatibility requirements. Do NOT enable New Architecture without verifying all dependencies support it.

**Key constraints:**
- `ios/Podfile` has `:new_arch_enabled => false` - DO NOT REMOVE
- `react-native-mmkv` must be version **2.x** (3.x requires TurboModules)
- Haptics are currently disabled (see below)

### Haptics

Haptic feedback is currently disabled via no-op functions in `src/utils/haptics.ts`. 

**Why:** Neither `react-native-haptic-feedback` (doesn't support RN 0.79 TurboModules) nor `expo-haptics` (requires Expo native modules config) work with this project's current setup.

**To re-enable haptics in the future:**
1. Option A: Add `use_expo_modules!` to Podfile and install `expo-haptics`
2. Option B: Wait for `react-native-haptic-feedback` to support Legacy Architecture on RN 0.79+
3. Option C: Enable New Architecture (requires upgrading react-native-mmkv to 3.x)

### Dependency Upgrades

Before upgrading any dependency:
1. Check if it requires New Architecture/TurboModules
2. Test on device (not just simulator)
3. If upgrading react-native-mmkv to 3.x, you must enable New Architecture

## Project Structure
```
src/
  screens/
    GameScreen.tsx
  logic/
    evaluateGuess.ts
    selectDaily.ts
    rng.ts
    words/
  storage/
    mmkv.ts
  theme/
    colors.ts
```
