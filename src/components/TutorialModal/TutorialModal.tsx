// src/components/TutorialModal/TutorialModal.tsx
import React, {useState, useCallback, useEffect} from 'react';
import {View, Text, Pressable, Modal} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {styles} from './styles';
import {TutorialStep} from './TutorialStep';
import {TUTORIAL_STEPS} from './tutorialSteps';
import {palette} from '../../theme/colors';

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TutorialModal({visible, onClose}: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = TUTORIAL_STEPS.length;

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
    }
  }, [visible]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentStep, totalSteps, onClose]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const currentStepData = TUTORIAL_STEPS[currentStep - 1];
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Tap outside to close */}
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Step Content */}
          <TutorialStep step={currentStepData} />

          {/* Footer */}
          <View style={styles.footer}>
            {/* Progress Dots */}
            <View style={styles.progressDots}>
              {TUTORIAL_STEPS.map((_, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      isActive && styles.dotActive,
                      isCompleted && styles.dotCompleted,
                    ]}
                  />
                );
              })}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonsRow}>
              {!isFirstStep && (
                <Pressable style={styles.btnBack} onPress={handleBack}>
                  <Text style={styles.btnBackText}>Back</Text>
                </Pressable>
              )}
              {/* Pressable handles layout (flex), LinearGradient handles visuals only */}
              <Pressable
                style={[
                  styles.btnNextWrapper,
                  isFirstStep && styles.btnNextWrapperFull,
                ]}
                onPress={handleNext}>
                <LinearGradient
                  colors={[palette.gradientStart, palette.gradientEnd]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.btnNextGradient}>
                  <Text style={styles.btnNextText}>
                    {isLastStep ? "Let's Play!" : 'Next'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Skip Link */}
            <Pressable style={styles.skipLink} onPress={handleSkip}>
              <Text style={styles.skipLinkText}>Skip tutorial</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
