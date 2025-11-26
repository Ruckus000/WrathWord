/**
 * Haptics Utility - Currently Disabled (No-Op)
 * 
 * Haptic feedback is disabled due to compatibility issues with React Native 0.79
 * and Legacy Architecture. Neither react-native-haptic-feedback nor expo-haptics
 * work with the current project configuration.
 * 
 * TO RE-ENABLE HAPTICS:
 * 
 * Option A: Use expo-haptics (recommended)
 *   1. Add to ios/Podfile before use_react_native!:
 *      require 'json'
 *      podfile_properties = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
 *      use_expo_modules!
 *   2. npm install expo expo-haptics
 *   3. cd ios && pod install
 *   4. Replace these no-op functions with:
 *      import * as Haptics from 'expo-haptics';
 *      export const triggerImpact = (style) => Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
 *      export const triggerNotification = (type) => Haptics.notificationAsync(Haptics.NotificationFeedbackType[type]);
 * 
 * Option B: Enable New Architecture
 *   1. Set :new_arch_enabled => true in ios/Podfile
 *   2. Upgrade react-native-mmkv to 3.x
 *   3. npm install react-native-haptic-feedback
 *   4. cd ios && pod install
 *   5. Replace these no-op functions with react-native-haptic-feedback calls
 * 
 * See README.md "Technical Notes" for more details.
 */

export const triggerImpact = (_style?: 'Light' | 'Medium' | 'Heavy') => {
  // No-op: haptics disabled for Legacy Architecture compatibility
};

export const triggerNotification = (_type: 'Success' | 'Warning' | 'Error') => {
  // No-op: haptics disabled for Legacy Architecture compatibility
};
