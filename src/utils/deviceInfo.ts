/**
 * Device Info Utility
 *
 * Collects non-PII device information for feedback emails.
 * Helps debug user-reported issues.
 */

import {Platform} from 'react-native';
import {APP_CONFIG} from '../config/appConfig';

export interface DeviceInfo {
  appName: string;
  appVersion: string;
  buildNumber: string;
  platform: string;
  osVersion: string;
}

export function getDeviceInfo(): DeviceInfo {
  return {
    appName: APP_CONFIG.name,
    appVersion: APP_CONFIG.version,
    buildNumber: APP_CONFIG.buildNumber,
    platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
    osVersion: Platform.Version.toString(),
  };
}

export function formatDeviceInfoForEmail(userId?: string): string {
  const info = getDeviceInfo();

  const lines = [
    '———————————',
    `App: ${info.appName} v${info.appVersion} (${info.buildNumber})`,
    `Platform: ${info.platform} ${info.osVersion}`,
  ];

  if (userId) {
    // Truncate user ID for privacy (show first 8 chars)
    const shortId = userId.length > 8 ? userId.substring(0, 8) + '...' : userId;
    lines.push(`User: ${shortId}`);
  }

  return lines.join('\n');
}
