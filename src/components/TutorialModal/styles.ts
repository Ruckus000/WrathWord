// src/components/TutorialModal/styles.ts
import {StyleSheet} from 'react-native';
import {palette} from '../../theme/colors';

export const styles = StyleSheet.create({
  // ============================================
  // MODAL OVERLAY
  // ============================================
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Pressable area behind modal to dismiss
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // ============================================
  // MODAL CARD
  // ============================================
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.bg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.borderLight,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 25},
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 24,
  },

  // ============================================
  // STEP CONTENT AREA
  // ============================================
  stepContainer: {
    padding: 32,
    paddingBottom: 24,
  },

  stepIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 20,
  },

  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },

  stepDescription: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  // ============================================
  // VISUAL CONTAINER (for step-specific content)
  // ============================================
  visualContainer: {
    backgroundColor: palette.tileEmpty,
    borderRadius: 16,
    padding: 20,
  },

  // ============================================
  // COLOR LEGEND (Step 2)
  // ============================================
  colorLegend: {
    gap: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  legendColor: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  legendColorCorrect: {
    backgroundColor: palette.correct,
  },

  legendColorPresent: {
    backgroundColor: palette.present,
  },

  legendColorAbsent: {
    backgroundColor: palette.absent,
  },

  legendLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },

  legendLetterDark: {
    color: '#000000',
  },

  legendText: {
    fontSize: 14,
    color: palette.textMuted,
    flex: 1,
  },

  legendTextBold: {
    fontWeight: '600',
    color: palette.textPrimary,
  },

  // ============================================
  // EXAMPLE TILES (Steps 1, 3)
  // ============================================
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },

  exampleRowLast: {
    marginBottom: 0,
  },

  miniTile: {
    width: 36,
    height: 40,
    borderRadius: 6,
    backgroundColor: palette.borderLight,
    borderWidth: 2,
    borderColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniTileCorrect: {
    backgroundColor: palette.correct,
    borderColor: palette.correct,
  },

  miniTilePresent: {
    backgroundColor: palette.present,
    borderColor: palette.present,
  },

  miniTileAbsent: {
    backgroundColor: palette.absent,
    borderColor: palette.absent,
  },

  miniTileEmpty: {
    backgroundColor: 'transparent',
    borderColor: palette.borderLight,
  },

  miniTileLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
  },

  miniTileLetterDark: {
    color: '#000000',
  },

  exampleExplanation: {
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 20,
    marginTop: 16,
  },

  // ============================================
  // KEYBOARD PREVIEW (Step 4)
  // ============================================
  keyboardPreview: {
    alignItems: 'center',
    gap: 6,
  },

  keyRow: {
    flexDirection: 'row',
    gap: 4,
  },

  key: {
    minWidth: 26,
    height: 36,
    borderRadius: 6,
    backgroundColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  keyCorrect: {
    backgroundColor: palette.correct,
  },

  keyPresent: {
    backgroundColor: palette.present,
  },

  keyAbsent: {
    backgroundColor: palette.absent,
  },

  keyLetter: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textPrimary,
  },

  keyLetterDark: {
    color: '#000000',
  },

  // ============================================
  // MODE CARDS (Step 5)
  // ============================================
  modeCards: {
    flexDirection: 'row',
    gap: 12,
  },

  modeCard: {
    flex: 1,
    backgroundColor: palette.borderLight,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  modeCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  modeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 4,
  },

  modeCardDesc: {
    fontSize: 11,
    color: palette.textDim,
    lineHeight: 16,
    textAlign: 'center',
  },

  // ============================================
  // READY STEP (Step 6)
  // ============================================
  readyContainer: {
    alignItems: 'center',
    padding: 24,
  },

  readyEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },

  readyTip: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
  },

  readyTipBold: {
    fontWeight: '600',
    color: palette.textPrimary,
  },

  // ============================================
  // FOOTER
  // ============================================
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // Progress dots
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.borderLight,
  },

  dotActive: {
    backgroundColor: palette.gradientStart,
    width: 24,
    borderRadius: 4,
  },

  dotCompleted: {
    backgroundColor: palette.correct,
  },

  // Buttons
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  btnBack: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: palette.tileEmpty,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
  },

  btnBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textMuted,
  },

  // Wrapper handles layout (flex) in the button row
  btnNextWrapper: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Full width variant when Back button is hidden
  btnNextWrapperFull: {
    flex: 1,
  },

  // Gradient handles visuals only (padding, alignment)
  btnNextGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  btnNextText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },

  // Skip link
  skipLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },

  skipLinkText: {
    fontSize: 13,
    color: palette.textDim,
  },
});
