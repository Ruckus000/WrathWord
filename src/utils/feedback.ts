/**
 * Feedback Utility
 *
 * Opens native email composer with pre-filled feedback template.
 * Includes device info for debugging.
 */

import {Linking, Alert} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {APP_CONFIG} from '../config/appConfig';
import {formatDeviceInfoForEmail} from './deviceInfo';
import {triggerImpact} from './haptics';

export async function openFeedbackEmail(userId?: string): Promise<void> {
  const deviceInfo = formatDeviceInfoForEmail(userId);

  const subject = encodeURIComponent(`${APP_CONFIG.name} Feedback`);
  const body = encodeURIComponent(`\n\n\n${deviceInfo}`);

  const mailtoUrl = `mailto:${APP_CONFIG.feedbackEmail}?subject=${subject}&body=${body}`;

  try {
    const supported = await Linking.canOpenURL(mailtoUrl);

    if (supported) {
      await Linking.openURL(mailtoUrl);
    } else {
      // Fallback for devices without mail app configured
      Alert.alert(
        'No Email App',
        `Please email us at:\n${APP_CONFIG.feedbackEmail}`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Copy Email',
            onPress: () => {
              Clipboard.setString(APP_CONFIG.feedbackEmail);
              triggerImpact('Light');
              // Show confirmation
              Alert.alert('Copied', 'Email address copied to clipboard');
            },
          },
        ],
      );
    }
  } catch {
    Alert.alert(
      'Error',
      'Failed to open email app. Please contact us at ' +
        APP_CONFIG.feedbackEmail,
    );
  }
}
