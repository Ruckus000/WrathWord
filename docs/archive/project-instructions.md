You are a senior React Native engineer. Generate a COMPLETE minimal project (code only) for a **single-screen**, **offline** iOS word puzzle app in **TypeScript** using React Native. Output all files as concatenated blocks, each starting with a path comment like:

// FILE: <relative/path>

Do NOT include explanations outside code blocks.

## Functional scope
- One screen only: **GameScreen**. No navigation.
- Player chooses word length **2–6** (segmented control).
- Two modes: **Daily** (deterministic offline word-of-the-day per length) and **Free Play** (random).
- 6 attempts per game. Word feedback uses Wordle-style colors and MUST correctly handle **duplicate letters**.
- Entirely offline: ship small JSON wordlists in the bundle. Validate guesses locally only.
- Persist settings (length, mode) and the last session (so the game resumes after relaunch).
- iOS-focused polish: safe-area insets, haptics, and basic VoiceOver announcements.

## Tech & libs (bare RN, not Expo)
- React Native + **Hermes** (assume default).
- `react-native-safe-area-context` for insets.
- `react-native-mmkv` for persistence.
- `react-native-haptic-feedback` for haptics.
- No other runtime deps.

## Deliverables (files + content)
Create the following files with working, runnable code (TypeScript). Keep styles simple (dark theme). No TODOs or placeholders except tiny demo wordlists.

1) // FILE: app/App.tsx
- Wrap with `SafeAreaProvider`.
- Render `GameScreen` only.

2) // FILE: src/screens/GameScreen.tsx
- Implement the entire UI and local game engine here (to stay single-screen).
- Top row controls:
  - Segmented length picker for [2,3,4,5,6].
  - Toggle button for Daily/Free.
  - “New” button to start another game with current settings.
- Board:
  - 6 rows; each row shows N tiles (N = selected length).
  - While typing, show the in-progress guess in the next empty row.
- On-screen keyboard:
  - Three rows: "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM" plus **ENTER** and **DEL** on the bottom row.
  - Key coloring follows discovered info precedence: `correct` > `present` > `absent`.
- Game logic:
  - Track `answer`, `rows` (submitted guesses), `feedback` (per-letter states), `current` input, `status` (playing/won/lost).
  - Validate that submitted guesses are in the `allowed` list for the current length.
  - When submitted:
    - If invalid: announce “Not in word list”.
    - If valid: compute feedback with `evaluateGuess` (imported), push row, fire haptics.
    - If all tiles `correct`: set status `won`, show result overlay, success haptic + announce “You win!”.
    - If out of rows: set status `lost`, show overlay with the answer, warning haptic + announce.
- Result overlay (Modal):
  - If won, show “You Win!”; if lost, show “The word was {ANSWER}”.
  - “Play again” button to start a fresh game (same settings).
- Data loading:
  - **Dynamic-import** the `answers-N.json` and `allowed-N.json` for the selected length to keep memory small.
- Persistence:
  - Save `settings` (length, mode) and `session` (length, mode, dateISO, answerHash or answer) via MMKV.
  - On mount or when settings change, start a new game (for Daily mode, use current date).
- Haptics:
  - On valid submit, light/medium impact.
  - On win, success notification.
  - On loss, warning notification.
- Accessibility:
  - Use `AccessibilityInfo.announceForAccessibility(...)` after invalid submit, win, or loss.
  - Mark interactive controls with proper roles; tiles should be readable (announce letter + state).
- Safe area:
  - Use `useSafeAreaInsets()` and apply top/bottom padding to the root container (don’t wrap everything in SafeAreaView).

3) // FILE: src/logic/evaluateGuess.ts
- Export `type TileState = 'correct' | 'present' | 'absent'`.
- Export `evaluateGuess(answer: string, guess: string): TileState[]` implementing a **two-pass algorithm** that correctly handles duplicate letters:
  - Pass 1: mark greens and count remaining letters in `answer`.
  - Pass 2: mark yellows only while there’s remaining count; otherwise `absent`.

4) // FILE: src/logic/rng.ts
- Export `mulberry32(seed: number): () => number` PRNG.
- Export `fnv1a(str: string): number` (32-bit).
- Export `seededIndex(seedStr: string, max: number): number` using `fnv1a(seedStr)` piped into `mulberry32`.
  - `Math.floor(rnd * max)`.

5) // FILE: src/logic/selectDaily.ts
- Export `selectDaily(len: number, dateISO: string, answers: string[]): string` → uses `seededIndex(\`\${dateISO}:\${len}\`, answers.length)`.

6) // FILE: src/storage/mmkv.ts
- Initialize and export a single `MMKV` instance.
- Export `getJSON<T>(key: string, fallback: T): T` and `setJSON(key: string, value: unknown): void`.

7) // FILE: src/theme/colors.ts
- Export a small palette for dark mode:
  - `bg = '#111'`, `tile = '#1c1c1e'`, `correct = '#34c759'`, `present = '#ffd60a'`, `absent = '#3a3a3c'`, `primary = '#0a84ff'`, text colors.

8) // FILE: src/logic/words/answers-2.json` … `answers-6.json`
9) // FILE: src/logic/words/allowed-2.json` … `allowed-6.json`
- Provide **tiny** demo lists (10–30 items each) of lowercase words per length so the app runs out of the box.
- Ensure each `answers-N.json` is a subset of `allowed-N.json`.
- Keep them extremely small; the user will replace them later.

10) // FILE: package.json
- Include deps: `react-native`, `react`, `typescript`, `react-native-safe-area-context`, `react-native-mmkv`, `react-native-haptic-feedback`.
- Basic scripts: `"start"`, `"ios"` (RN CLI), `"android"` optional.

11) // FILE: tsconfig.json, babel.config.js, metro.config.js
- Standard RN TypeScript + Babel config (no fancy plugins).

## Implementation details & guardrails
- Keep **all** game UI + state in `GameScreen.tsx` to satisfy “one screen” constraint.
- Use `React.memo` for tiles/keys to reduce re-renders; keep callbacks stable with `useCallback`.
- Keyboard precedence: once a key is `correct`, it must not downgrade to `present/absent`; `present` must not downgrade to `absent`.
- Treat all comparisons as **case-insensitive**, but render tiles/keyboard uppercase.
- When changing `length` or `mode`, immediately start a new game.
- For Daily mode, use `new Date().toISOString().slice(0,10)` as `dateISO`.
- No network access. No analytics. No permissions.
- Keep styles compact and iOS-friendly; ensure tap targets are comfortably large.

## Output format
- Print each file as:

// FILE: <path>
<full file contents>

- End output after the last file. Do not include extra commentary.