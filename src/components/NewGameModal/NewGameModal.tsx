import React, {useState, useCallback, useEffect} from 'react';
import {View, Text, Pressable, Modal, StyleSheet} from 'react-native';
import {BoardPreview} from './BoardPreview';
import {PillSelector} from './PillSelector';
import {ModeCard} from './ModeCard';
import type {NewGameModalProps, GameMode} from './types';

export function NewGameModal({
  visible,
  initialConfig,
  gameInProgress = false,
  onStart,
  onCancel,
}: NewGameModalProps) {
  const [length, setLength] = useState(initialConfig.length);
  const [maxRows, setMaxRows] = useState(initialConfig.maxRows);
  const [mode, setMode] = useState<GameMode>(initialConfig.mode);

  // Reset to initial config when modal opens
  useEffect(() => {
    if (visible) {
      setLength(initialConfig.length);
      setMaxRows(initialConfig.maxRows);
      setMode(initialConfig.mode);
    }
  }, [visible, initialConfig]);

  const handleStart = useCallback(() => {
    onStart({length, maxRows, mode});
  }, [length, maxRows, mode, onStart]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onCancel} />

        <View style={styles.card}>
          {/* Warning bar */}
          {gameInProgress && (
            <View style={styles.warningBar}>
              <Text style={styles.warningText}>
                ⚠️ Current progress will be lost
              </Text>
            </View>
          )}

          {/* Board Preview */}
          <BoardPreview length={length} maxRows={maxRows} mode={mode} />

          {/* Content */}
          <View style={styles.content}>
            {/* Word Length */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Word Length</Text>
              <PillSelector
                options={[2, 3, 4, 5, 6]}
                value={length}
                onChange={setLength}
                accessibilityLabel="Select word length"
              />
            </View>

            {/* Max Guesses */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Guesses Allowed</Text>
              <PillSelector
                options={[4, 5, 6, 7, 8]}
                value={maxRows}
                onChange={setMaxRows}
                accessibilityLabel="Select maximum guesses"
              />
            </View>

            {/* Game Mode */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Mode</Text>
              <View style={styles.modeRow}>
                <ModeCard
                  mode="daily"
                  icon="📅"
                  label="Daily"
                  description="Same for everyone"
                  selected={mode === 'daily'}
                  onPress={() => setMode('daily')}
                />
                <ModeCard
                  mode="free"
                  icon="🎲"
                  label="Free Play"
                  description="Unlimited random"
                  selected={mode === 'free'}
                  onPress={() => setMode('free')}
                />
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.btnCancel} onPress={onCancel}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.btnStart} onPress={handleStart}>
              <Text style={styles.btnStartText}>Start Game</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#09090b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 25},
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 24,
  },
  warningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.15)',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fbbf24',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  settingGroup: {
    gap: 12,
  },
  settingLabel: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#0a0a0b',
  },
  btnCancel: {
    flex: 1,
    backgroundColor: 'transparent',
    borderColor: '#27272a',
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '500',
  },
  btnStart: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnStartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
