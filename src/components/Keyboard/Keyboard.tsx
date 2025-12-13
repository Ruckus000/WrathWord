// src/components/Keyboard/Keyboard.tsx
import React from 'react';
import {View} from 'react-native';
import {Key} from './Key';
import {styles} from './styles';
import type {KeyboardProps} from './types';

const LETTERS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export const Keyboard = React.memo(({
  onKey,
  keyStates,
  tileColors,
}: KeyboardProps) => {
  return (
    <View style={styles.kb}>
      {LETTERS.map((row, idx) => (
        <View key={idx} style={styles.kbRow}>
          {idx === 2 && (
            <Key
              label="↵"
              flex={2}
              onPress={() => onKey('ENTER')}
              isAction
              accessibilityLabel="Enter"
            />
          )}
          {row.split('').map(k => {
            const st = keyStates.get(k);
            const disabled = st === 'absent';
            return (
              <Key
                key={k}
                label={k}
                state={st}
                disabled={disabled}
                onPress={() => onKey(k)}
                tileColors={tileColors}
              />
            );
          })}
          {idx === 2 && (
            <Key
              label="⌫"
              flex={2}
              onPress={() => onKey('DEL')}
              isAction
              accessibilityLabel="Delete"
            />
          )}
        </View>
      ))}
    </View>
  );
});

Keyboard.displayName = 'Keyboard';
