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
- React Native 0.76.5
- TypeScript
- react-native-mmkv (persistence)
- react-native-safe-area-context
- react-native-haptic-feedback

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
