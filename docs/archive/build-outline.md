Minimal file layout

/app
  App.tsx
  tsconfig.json
  package.json
  babel.config.js
  ios/...
  android/...
  src/
    screens/GameScreen.tsx
    logic/evaluateGuess.ts
    logic/selectDaily.ts
    logic/rng.ts
    logic/words/
      answers-2.json
      answers-3.json
      answers-4.json
      answers-5.json
      answers-6.json
      allowed-2.json
      allowed-3.json
      allowed-4.json
      allowed-5.json
      allowed-6.json
    storage/mmkv.ts
    theme/colors.ts

Notes
	•	Wrap the app with SafeAreaProvider and use useSafeAreaInsets() in the single screen instead of global SafeAreaView. This is the most reliable pattern for modern iPhones with notches/home indicator.  ￼
	•	Hermes is already the default JS engine in RN, so no extra work needed.  ￼
	•	Use react-native-mmkv for tiny, fast local persistence (settings, session, stats).  ￼
	•	For iOS haptics in a bare app, react-native-haptic-feedback is simple; in Expo, use expo-haptics.  ￼
	•	Announce results to VoiceOver with AccessibilityInfo.  ￼

⸻

App.tsx (shell)
	•	Provide SafeArea context and just render GameScreen.
	•	Keep Hermes defaults; no navigation.

// app/App.tsx
import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import GameScreen from '../src/screens/GameScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <GameScreen />
    </SafeAreaProvider>
  );
}


⸻

Core logic

evaluateGuess.ts (duplicate-letter safe)

// src/logic/evaluateGuess.ts
export type TileState = 'correct' | 'present' | 'absent';

export function evaluateGuess(answer: string, guess: string): TileState[] {
  const n = answer.length;
  const res: TileState[] = Array(n).fill('absent');
  const remaining: Record<string, number> = {};

  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) res[i] = 'correct';
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < n; i++) {
    if (res[i] === 'correct') continue;
    const ch = guess[i];
    if (remaining[ch] > 0) {
      res[i] = 'present';
      remaining[ch]--;
    }
  }
  return res;
}

Deterministic daily selection (offline)

// src/logic/rng.ts
export function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// src/logic/selectDaily.ts
import {mulberry32} from './rng';

export function seededIndex(seedStr: string, max: number) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = mulberry32(h >>> 0)();
  return Math.floor(rnd * max);
}

export function selectDaily(len: number, dateISO: string, answers: string[]) {
  const idx = seededIndex(`${dateISO}:${len}`, answers.length);
  return answers[idx];
}


⸻

Storage: MMKV

// src/storage/mmkv.ts
import {MMKV} from 'react-native-mmkv';

export const kv = new MMKV();

export type Stats = {
  played: number; wins: number; streak: number; maxStreak: number;
  guessDist: number[]; // length 6
};

export const getJSON = <T>(key: string, fallback: T): T => {
  const v = kv.getString(key);
  return v ? JSON.parse(v) as T : fallback;
};
export const setJSON = (key: string, value: unknown) =>
  kv.set(key, JSON.stringify(value));

Rationale: MMKV is a tiny, native key-value store that’s extremely fast — great for single-screen state, streaks, and settings.  ￼

⸻

The single screen

GameScreen.tsx (UI + engine in one)
	•	Top controls: Length selector (2–6), Mode (Daily / Free Play), New Game.
	•	Board (6 rows) + On-screen keyboard.
	•	No navigation; results modal is an inline overlay.
	•	Safe-area padding via useSafeAreaInsets().
	•	Haptics on submit/win; a11y announcements.

// src/screens/GameScreen.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Pressable, StyleSheet, TextInput, Modal, Platform, AccessibilityInfo} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Haptic from 'react-native-haptic-feedback'; // or expo-haptics
import {evaluateGuess, TileState} from '../logic/evaluateGuess';
import {selectDaily} from '../logic/selectDaily';
import {getJSON, setJSON} from '../storage/mmkv';

type Mode = 'daily' | 'free';
type GameStatus = 'playing' | 'won' | 'lost';

const MAX_ROWS = 6;
const LETTERS = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"]; // simple keyboard

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [length, setLength] = useState<number>(getJSON('settings.length', 5));
  const [mode, setMode] = useState<Mode>(getJSON('settings.mode', 'daily'));
  const [answer, setAnswer] = useState<string>('');
  const [rows, setRows] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<TileState[][]>([]);
  const [current, setCurrent] = useState<string>('');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [showResult, setShowResult] = useState(false);

  // Load wordlists lazily per length
  const listsPromise = useMemo(async () => {
    const a = (await import(`../logic/words/answers-${length}.json`)).default as string[];
    const allowed = (await import(`../logic/words/allowed-${length}.json`)).default as string[];
    return {answers: a, allowed};
  }, [length]);

  const loadNew = useCallback(async (seedDate?: string) => {
    const {answers} = await listsPromise;
    const dateISO = (seedDate ?? new Date().toISOString().slice(0,10));
    const next = mode === 'daily' ? selectDaily(length, dateISO, answers)
                                  : answers[Math.floor(Math.random()*answers.length)];
    setAnswer(next);
    setRows([]); setFeedback([]); setCurrent(''); setStatus('playing'); setShowResult(false);
    setJSON('session', {length, mode, dateISO, answerHash: next}); // store hash in a real app
  }, [listsPromise, length, mode]);

  useEffect(() => {
    setJSON('settings.length', length);
    setJSON('settings.mode', mode);
    loadNew();
  }, [length, mode, loadNew]);

  const commitGuess = useCallback(async () => {
    if (status !== 'playing') return;
    if (current.length !== length) return; // ignore
    const {allowed} = await listsPromise;
    if (!allowed.includes(current.toLowerCase())) {
      AccessibilityInfo.announceForAccessibility?.('Not in word list');
      return;
    }
    const fb = evaluateGuess(answer, current.toLowerCase());
    setRows(r => [...r, current.toUpperCase()]);
    setFeedback(f => [...f, fb]);
    setCurrent('');
    Haptic.trigger('impactMedium');

    const won = fb.every(s => s === 'correct');
    if (won) {
      setStatus('won'); setShowResult(true);
      Haptic.trigger('notificationSuccess');
      AccessibilityInfo.announceForAccessibility?.('You win!');
    } else if (rows.length + 1 >= MAX_ROWS) {
      setStatus('lost'); setShowResult(true);
      Haptic.trigger('notificationWarning');
      AccessibilityInfo.announceForAccessibility?.(`You lose. The word was ${answer.toUpperCase()}`);
    }
  }, [answer, current, length, listsPromise, rows.length, status]);

  // Keyboard handlers
  const onKey = useCallback((k: string) => {
    if (status !== 'playing') return;
    if (k === 'ENTER') commitGuess();
    else if (k === 'DEL') setCurrent(c => c.slice(0, -1));
    else if (/^[A-Z]$/.test(k) && current.length < length) setCurrent(c => (c + k).toUpperCase());
  }, [commitGuess, current.length, length, status]);

  const keyStates = useMemo(() => {
    const map = new Map<string, TileState>();
    feedback.forEach((fb, rowIdx) => {
      const word = rows[rowIdx] ?? '';
      for (let i = 0; i < fb.length; i++) {
        const ch = word[i];
        const prev = map.get(ch);
        const next = fb[i];
        const rank = {absent:0, present:1, correct:2};
        if (!prev || rank[next] > rank[prev]) map.set(ch, next);
      }
    });
    return map;
  }, [feedback, rows]);

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* Controls */}
      <View style={styles.controls}>
        <Segment value={length} onChange={setLength} />
        <Toggle
          label="Daily"
          value={mode === 'daily'}
          onChange={(v)=> setMode(v ? 'daily' : 'free')}
        />
        <Pressable style={styles.newBtn} onPress={()=>loadNew()}>
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      {/* Board */}
      <Board
        length={length}
        rows={rows}
        feedback={feedback}
        current={current}
      />

      {/* Keyboard */}
      <Keyboard onKey={onKey} keyStates={keyStates} />

      {/* Result modal */}
      <Modal transparent visible={showResult} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.resultTitle}>
              {status==='won' ? 'You Win!' : `The word was ${answer.toUpperCase()}`}
            </Text>
            <Pressable style={styles.primary} onPress={()=>{ setShowResult(false); loadNew(); }}>
              <Text style={styles.primaryText}>Play again</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** UI bits (kept here to stay single-screen). Memoize to reduce re-renders. */
const Segment = React.memo(({value, onChange}:{value:number; onChange:(v:number)=>void}) => {
  return (
    <View style={styles.segment}>
      {[2,3,4,5,6].map(n=>(
        <Pressable
          key={n}
          onPress={()=>onChange(n)}
          style={[styles.segmentItem, value===n && styles.segmentItemActive]}
          accessibilityRole="button"
          accessibilityState={{selected: value===n}}
        >
          <Text style={[styles.segmentText, value===n && styles.segmentTextActive]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
});

const Toggle = React.memo(({label, value, onChange}:{label:string; value:boolean; onChange:(v:boolean)=>void}) => (
  <Pressable onPress={()=>onChange(!value)} style={styles.toggle} accessibilityRole="switch" accessibilityState={{checked:value}}>
    <Text style={styles.toggleText}>{label}</Text>
    <View style={[styles.toggleKnob, value && styles.toggleOn]} />
  </Pressable>
));

const Board = React.memo(({length, rows, feedback, current}:{length:number; rows:string[]; feedback:TileState[][]; current:string;}) => {
  const allRows = [...rows];
  if (rows.length < MAX_ROWS) allRows.push(current.padEnd(length, ' '));
  while (allRows.length < MAX_ROWS) allRows.push(''.padEnd(length, ' '));
  return (
    <View style={styles.board}>
      {allRows.map((word, rIdx)=>(
        <View key={rIdx} style={styles.row}>
          {Array.from({length}).map((_, cIdx)=>{
            const ch = word[cIdx] ?? ' ';
            const state = feedback[rIdx]?.[cIdx] ?? 'empty';
            return <Tile key={cIdx} ch={ch} state={state as any} />;
          })}
        </View>
      ))}
    </View>
  );
});

const Tile = React.memo(({ch, state}:{ch:string; state: TileState | 'empty'}) => {
  return (
    <View style={[
      styles.tile,
      state==='correct' && styles.tCorrect,
      state==='present' && styles.tPresent,
      state==='absent' && styles.tAbsent
    ]}>
      <Text style={styles.tileText} accessible accessibilityLabel={`${ch || 'blank'} ${state!=='empty'?state:''}`} accessibilityRole="text">
        {ch}
      </Text>
    </View>
  );
});

const Keyboard = React.memo(({onKey, keyStates}:{onKey:(k:string)=>void; keyStates: Map<string, TileState>}) => {
  return (
    <View style={styles.kb}>
      {LETTERS.map((row, idx)=>(
        <View key={idx} style={styles.kbRow}>
          {idx===2 && <Key label="ENTER" flex={1.5} onPress={()=>onKey('ENTER')} />}
          {row.split('').map(k=>{
            const st = keyStates.get(k);
            return <Key key={k} label={k} state={st} onPress={()=>onKey(k)} />;
          })}
          {idx===2 && <Key label="DEL" flex={1.5} onPress={()=>onKey('DEL')} />}
        </View>
      ))}
    </View>
  );
});

const Key = React.memo(({label, onPress, state, flex}:{label:string; onPress:()=>void; state?:TileState; flex?:number}) => (
  <Pressable onPress={onPress} style={[styles.key, {flex: flex ?? 1},
    state==='correct' && styles.kCorrect,
    state==='present' && styles.kPresent,
    state==='absent' && styles.kAbsent
  ]}
  accessibilityRole="button"
  accessibilityLabel={label}
  >
    <Text style={styles.keyText}>{label}</Text>
  </Pressable>
));

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#111', paddingHorizontal:12},
  controls: {flexDirection:'row', alignItems:'center', gap:8, marginBottom:8},
  segment: {flexDirection:'row', backgroundColor:'#222', borderRadius:8, padding:4},
  segmentItem: {paddingVertical:6, paddingHorizontal:10, borderRadius:6},
  segmentItemActive: {backgroundColor:'#fff'},
  segmentText: {color:'#aaa', fontWeight:'600'},
  segmentTextActive: {color:'#111'},
  toggle:{marginLeft:'auto', flexDirection:'row', alignItems:'center', gap:8, padding:6, borderRadius:8, backgroundColor:'#222'},
  toggleText:{color:'#ddd', fontWeight:'600'},
  toggleKnob:{width:20, height:20, borderRadius:10, backgroundColor:'#555'},
  toggleOn:{backgroundColor:'#0a84ff'},
  newBtn:{paddingVertical:6, paddingHorizontal:12, borderRadius:8, backgroundColor:'#0a84ff'},
  newBtnText:{color:'#fff', fontWeight:'700'},

  board:{flex:1, justifyContent:'center', gap:8},
  row:{flexDirection:'row', gap:8, alignSelf:'center'},
  tile:{width:44, height:52, borderRadius:6, borderWidth:1, borderColor:'#333', justifyContent:'center', alignItems:'center', backgroundColor:'#1c1c1e'},
  tileText:{color:'#fff', fontSize:24, fontWeight:'800'},
  tCorrect:{backgroundColor:'#34c759'}, tPresent:{backgroundColor:'#ffd60a'}, tAbsent:{backgroundColor:'#3a3a3c'},

  kb:{gap:8, marginBottom:8},
  kbRow:{flexDirection:'row', gap:6, justifyContent:'center'},
  key:{minWidth:28, height:44, borderRadius:6, backgroundColor:'#2c2c2e', justifyContent:'center', alignItems:'center', paddingHorizontal:8},
  keyText:{color:'#fff', fontWeight:'700'},
  kCorrect:{backgroundColor:'#34c759'}, kPresent:{backgroundColor:'#ffd60a'}, kAbsent:{backgroundColor:'#3a3a3c'},

  modalBackdrop:{flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center'},
  modalCard:{width:'80%', backgroundColor:'#1c1c1e', padding:16, borderRadius:12, gap:12},
  resultTitle:{color:'#fff', fontSize:20, fontWeight:'800'},
  primary:{backgroundColor:'#0a84ff', borderRadius:10, padding:10, alignItems:'center'},
  primaryText:{color:'#fff', fontWeight:'800'},
});


⸻

Theme & colors

// src/theme/colors.ts
export const palette = {
  bg: '#111', tile: '#1c1c1e', correct:'#34c759', present:'#ffd60a', absent:'#3a3a3c', primary:'#0a84ff'
};


⸻

Wordlists (offline)
	•	Ship small JSON arrays: answers-N.json (game chooses from here) and allowed-N.json (guessable). Keep them modest for 2–3 letters to avoid too-random feel. Lazy-load per length as shown above to keep bundle lean (only the active list is loaded at runtime).
	•	Persist last settings and session with MMKV; it’s fast and tiny, ideal for this single-screen use case.  ￼

⸻

Haptics & a11y glue (why)
	•	react-native-haptic-feedback gives iOS haptics (Impact/Notification types) in bare RN; in Expo use expo-haptics. We trigger small impacts on submit and a success notification on win.  ￼
	•	We call AccessibilityInfo.announceForAccessibility(...) after invalid words, wins, or losses so VoiceOver users get immediate context.  ￼

⸻

Micro performance notes (single screen)
	•	Memoize Row/Tile/Key with React.memo and use stable callbacks (useCallback) to limit re-renders. (General RN perf & React guidance.)  ￼
	•	Safe-area: apply insets at the screen container instead of wrapping the whole app in SafeAreaView.  ￼
