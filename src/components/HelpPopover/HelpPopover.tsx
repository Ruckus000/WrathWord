// src/components/HelpPopover/HelpPopover.tsx
import React, {useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import {palette} from '../../theme/colors';

interface HelpPopoverProps {
  visible: boolean;
  onClose: () => void;
  onHintPress: () => void;
  onTutorialPress: () => void;
  hintDisabled: boolean;
  /** Position of the anchor button (for proper popover placement) */
  anchorPosition?: {x: number; y: number; width: number; height: number};
}

export function HelpPopover({
  visible,
  onClose,
  onHintPress,
  onTutorialPress,
  hintDisabled,
  anchorPosition,
}: HelpPopoverProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleHint = useCallback(() => {
    if (!hintDisabled) {
      onHintPress();
      onClose();
    }
  }, [hintDisabled, onHintPress, onClose]);

  const handleTutorial = useCallback(() => {
    onTutorialPress();
    onClose();
  }, [onTutorialPress, onClose]);

  // Calculate popover position relative to anchor
  const screenWidth = Dimensions.get('window').width;

  // Default to right-aligned if no anchor provided
  let popoverRight = 20;
  let popoverTop = 60;

  if (anchorPosition) {
    // Position below the anchor button, right-aligned with it
    popoverRight = screenWidth - (anchorPosition.x + anchorPosition.width);
    popoverTop = anchorPosition.y + anchorPosition.height + 8;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      {/* Container holds both backdrop and popover as siblings */}
      <View style={styles.container} pointerEvents="box-none">
        {/* Backdrop - tap to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Popover - positioned absolutely, separate from backdrop */}
        <Animated.View
          style={[
            styles.popover,
            {
              right: popoverRight,
              top: popoverTop,
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          {/* Hint Option */}
          <Pressable
            style={[styles.item, hintDisabled && styles.itemDisabled]}
            onPress={handleHint}
            disabled={hintDisabled}
            accessibilityRole="button"
            accessibilityLabel={
              hintDisabled
                ? 'Hint already used'
                : 'Use hint to reveal one letter'
            }
            accessibilityState={{disabled: hintDisabled}}>
            <View style={styles.itemIconContainer}>
              <Text style={styles.itemIcon}>💡</Text>
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemTitle,
                  hintDisabled && styles.itemTitleDisabled,
                ]}>
                {hintDisabled ? 'Hint Used' : 'Use Hint'}
              </Text>
              <Text style={styles.itemSubtitle}>
                {hintDisabled ? '1 per game' : 'Reveal one correct letter'}
              </Text>
            </View>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Tutorial Option */}
          <Pressable
            style={styles.item}
            onPress={handleTutorial}
            accessibilityRole="button"
            accessibilityLabel="How to play - Learn the rules">
            <View style={styles.itemIconContainer}>
              <Text style={styles.itemIcon}>📖</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>How to Play</Text>
              <Text style={styles.itemSubtitle}>Learn the rules</Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  popover: {
    position: 'absolute',
    minWidth: 220,
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 14,
    padding: 6,
    // Shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  itemDisabled: {
    opacity: 0.4,
  },

  itemIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  itemIcon: {
    fontSize: 20,
  },

  itemContent: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },

  itemTitleDisabled: {
    color: palette.textMuted,
  },

  itemSubtitle: {
    fontSize: 12,
    color: palette.textDim,
    marginTop: 2,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.borderLight,
    marginVertical: 4,
    marginHorizontal: 12,
  },
});
