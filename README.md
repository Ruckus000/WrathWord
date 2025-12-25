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

## Architecture

WrathWord follows Clean Architecture principles. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

### Quick Overview

```
src/
├── domain/           # Core business logic (no dependencies)
├── application/      # Use cases (orchestration)
├── infrastructure/   # External concerns (persistence, APIs)
├── presentation/     # React Native UI
└── composition/      # Dependency injection
```

### Running Tests

```bash
# All tests
npm test

# Specific layer
npm test -- --testPathPattern="domain"
npm test -- --testPathPattern="application"
npm test -- --testPathPattern="infrastructure"
npm test -- --testPathPattern="presentation"
npm test -- --testPathPattern="e2e"
```
