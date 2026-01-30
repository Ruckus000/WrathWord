// src/components/TutorialModal/TutorialStep.tsx
import React from 'react';
import {View, Text} from 'react-native';
import {styles} from './styles';
import {TutorialStepData} from './tutorialSteps';
import {palette} from '../../theme/colors';

interface TutorialStepProps {
  step: TutorialStepData;
}

export function TutorialStep({step}: TutorialStepProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepIcon}>{step.icon}</Text>
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepDescription}>{step.description}</Text>
      <StepVisual type={step.visualType} />
    </View>
  );
}

function StepVisual({type}: {type: TutorialStepData['visualType']}) {
  switch (type) {
    case 'welcome':
      return <WelcomeVisual />;
    case 'colors':
      return <ColorsVisual />;
    case 'example':
      return <ExampleVisual />;
    case 'keyboard':
      return <KeyboardVisual />;
    case 'modes':
      return <ModesVisual />;
    case 'ready':
      return <ReadyVisual />;
    default:
      return null;
  }
}

// ============================================
// STEP 1: Welcome - Empty tiles
// ============================================
function WelcomeVisual() {
  return (
    <View style={styles.visualContainer}>
      <View style={[styles.exampleRow, styles.exampleRowLast]}>
        {['?', '?', '?', '?', '?'].map((char, i) => (
          <View key={i} style={[styles.miniTile, styles.miniTileEmpty]}>
            <Text style={styles.miniTileLetter}>{char}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================
// STEP 2: Colors - Legend explanation
// ============================================
function ColorsVisual() {
  return (
    <View style={styles.visualContainer}>
      <View style={styles.colorLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendColorCorrect]}>
            <Text style={styles.legendLetter}>W</Text>
          </View>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>Green</Text> - Correct letter,
            correct spot
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendColorPresent]}>
            <Text style={[styles.legendLetter, styles.legendLetterDark]}>
              A
            </Text>
          </View>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>Yellow</Text> - Correct letter,
            wrong spot
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.legendColorAbsent]}>
            <Text style={styles.legendLetter}>X</Text>
          </View>
          <Text style={styles.legendText}>
            <Text style={styles.legendTextBold}>Gray</Text> - Letter not in word
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// STEP 3: Example - WRATH vs WATCH
// ============================================
function ExampleVisual() {
  // Answer: WATCH, Guess: WRATH
  // W = correct, R = absent, A = present, T = correct, H = absent
  const tiles: Array<{letter: string; state: 'correct' | 'present' | 'absent'}> =
    [
      {letter: 'W', state: 'correct'},
      {letter: 'R', state: 'absent'},
      {letter: 'A', state: 'present'},
      {letter: 'T', state: 'correct'},
      {letter: 'H', state: 'absent'},
    ];

  return (
    <View style={styles.visualContainer}>
      <View style={[styles.exampleRow, styles.exampleRowLast]}>
        {tiles.map((tile, i) => (
          <View
            key={i}
            style={[
              styles.miniTile,
              tile.state === 'correct' && styles.miniTileCorrect,
              tile.state === 'present' && styles.miniTilePresent,
              tile.state === 'absent' && styles.miniTileAbsent,
            ]}>
            <Text
              style={[
                styles.miniTileLetter,
                tile.state === 'present' && styles.miniTileLetterDark,
              ]}>
              {tile.letter}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.exampleExplanation}>
        <Text style={{fontWeight: '600', color: palette.textPrimary}}>W</Text>{' '}
        and{' '}
        <Text style={{fontWeight: '600', color: palette.textPrimary}}>T</Text>{' '}
        are correct.{' '}
        <Text style={{fontWeight: '600', color: palette.textPrimary}}>A</Text>{' '}
        is in the word but wrong position.{' '}
        <Text style={{fontWeight: '600', color: palette.textPrimary}}>R</Text>{' '}
        and{' '}
        <Text style={{fontWeight: '600', color: palette.textPrimary}}>H</Text>{' '}
        aren't in WATCH.
      </Text>
    </View>
  );
}

// ============================================
// STEP 4: Keyboard - Letter tracking
// ============================================
function KeyboardVisual() {
  const rows = [
    [
      {letter: 'Q', state: null},
      {letter: 'W', state: 'correct'},
      {letter: 'E', state: null},
      {letter: 'R', state: 'absent'},
      {letter: 'T', state: 'correct'},
      {letter: 'Y', state: null},
      {letter: 'U', state: null},
      {letter: 'I', state: null},
      {letter: 'O', state: null},
      {letter: 'P', state: null},
    ],
    [
      {letter: 'A', state: 'present'},
      {letter: 'S', state: null},
      {letter: 'D', state: null},
      {letter: 'F', state: null},
      {letter: 'G', state: null},
      {letter: 'H', state: 'absent'},
      {letter: 'J', state: null},
      {letter: 'K', state: null},
      {letter: 'L', state: null},
    ],
    [
      {letter: 'Z', state: null},
      {letter: 'X', state: null},
      {letter: 'C', state: null},
      {letter: 'V', state: null},
      {letter: 'B', state: null},
      {letter: 'N', state: null},
      {letter: 'M', state: null},
    ],
  ] as const;

  return (
    <View style={styles.visualContainer}>
      <View style={styles.keyboardPreview}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keyRow}>
            {row.map((key, keyIdx) => (
              <View
                key={keyIdx}
                style={[
                  styles.key,
                  key.state === 'correct' && styles.keyCorrect,
                  key.state === 'present' && styles.keyPresent,
                  key.state === 'absent' && styles.keyAbsent,
                ]}>
                <Text
                  style={[
                    styles.keyLetter,
                    key.state === 'present' && styles.keyLetterDark,
                  ]}>
                  {key.letter}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================
// STEP 5: Modes - Daily vs Free Play
// ============================================
function ModesVisual() {
  return (
    <View style={styles.visualContainer}>
      <View style={styles.modeCards}>
        <View style={styles.modeCard}>
          <Text style={styles.modeCardIcon}>📅</Text>
          <Text style={styles.modeCardTitle}>Daily</Text>
          <Text style={styles.modeCardDesc}>
            One puzzle per day. Same word for everyone!
          </Text>
        </View>
        <View style={styles.modeCard}>
          <Text style={styles.modeCardIcon}>🎲</Text>
          <Text style={styles.modeCardTitle}>Free Play</Text>
          <Text style={styles.modeCardDesc}>
            Unlimited practice with random words.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// STEP 6: Ready - Trophy and tip
// ============================================
function ReadyVisual() {
  return (
    <View style={[styles.visualContainer, styles.readyContainer]}>
      <Text style={styles.readyEmoji}>🏆</Text>
      <Text style={styles.readyTip}>
        Pro tip: Start with words containing common letters like{' '}
        <Text style={styles.readyTipBold}>E, A, R, T, O</Text>
      </Text>
    </View>
  );
}
