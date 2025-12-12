/**
 * App Configuration
 *
 * Centralized constants for app metadata, support, and legal content.
 * Version is imported from auto-generated version.ts
 */

import {APP_VERSION, BUILD_NUMBER} from './version';

export const APP_CONFIG = {
  // App metadata
  name: 'WrathWord',
  version: APP_VERSION,
  buildNumber: BUILD_NUMBER,

  // Support - using single email for everything (simpler for indie dev)
  feedbackEmail: 'lordruckus.nb@gmail.com',

  // Last updated dates for legal docs
  termsLastUpdated: 'December 12, 2025',
  privacyLastUpdated: 'December 12, 2025',
};

export const LEGAL_CONTENT = {
  terms: {
    title: 'Terms of Service',
    lastUpdated: APP_CONFIG.termsLastUpdated,
    sections: [
      {
        title: 'Acceptance of Terms',
        content:
          'By downloading, installing, or using WrathWord ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.',
      },
      {
        title: 'Description of Service',
        content:
          'WrathWord is a word puzzle game that allows users to play daily word puzzles, compete on leaderboards, connect with friends, and track personal statistics.',
      },
      {
        title: 'User Accounts',
        content:
          'To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
      },
      {
        title: 'User Conduct',
        content:
          'You agree not to:\n\n• Use the App for any unlawful purpose\n• Attempt to cheat or manipulate game statistics\n• Attempt to gain unauthorized access to our systems\n• Interfere with other users\' enjoyment of the App\n• Share offensive or inappropriate content',
      },
      {
        title: 'Game Data',
        content:
          'Your game statistics are stored to enable features like leaderboards and progress tracking. By participating in leaderboards, you consent to your display name and scores being visible to other users.',
      },
      {
        title: 'Intellectual Property',
        content:
          'All content, features, and functionality of the App are owned by WrathWord and are protected by copyright, trademark, and other intellectual property laws.',
      },
      {
        title: 'Termination',
        content:
          'We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our sole discretion.',
      },
      {
        title: 'Disclaimer',
        content:
          'The App is provided "as is" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose.',
      },
      {
        title: 'Limitation of Liability',
        content:
          'We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.',
      },
      {
        title: 'Changes to Terms',
        content:
          'We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the new terms.',
      },
      {
        title: 'Contact',
        content:
          'For questions about these Terms, please use the Send Feedback option in the app.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: APP_CONFIG.privacyLastUpdated,
    sections: [
      {
        title: 'Overview',
        content:
          'WrathWord is designed with privacy in mind. This policy explains what data we collect and how we use it.',
      },
      {
        title: 'Information We Collect',
        content:
          'Account Information: When you create an account, we collect your email address and display name. You also receive a unique friend code.\n\nGame Data: We store your game statistics, including puzzles completed, win streaks, guess distribution, and scores for leaderboard functionality.\n\nDevice Information: We collect basic device information (platform, OS version) when you submit feedback to help us debug issues.',
      },
      {
        title: "Information We Don't Collect",
        content:
          "• We don't sell your personal information to third parties\n• We don't track your location\n• We don't access your contacts\n• We don't use third-party advertising trackers\n• We don't collect data from other apps on your device",
      },
      {
        title: 'How We Use Your Data',
        content:
          'We use your data to:\n\n• Provide game functionality and save your progress\n• Display leaderboards and statistics\n• Enable friend connections via friend codes\n• Improve the app experience\n• Respond to support requests',
      },
      {
        title: 'Data Storage',
        content:
          'Your data is stored securely using Supabase infrastructure with encryption at rest and in transit. Game progress is also cached locally on your device using MMKV for offline play.',
      },
      {
        title: 'Data Sharing',
        content:
          'Your display name and game scores may be visible to other users on public leaderboards. Your email address and friend code are never shared publicly.',
      },
      {
        title: 'Your Rights',
        content:
          'You have the right to:\n\n• Access your personal data\n• Request deletion of your account and associated data\n• Export your game statistics\n\nTo exercise these rights, use the Send Feedback option in the app.',
      },
      {
        title: "Children's Privacy",
        content:
          'WrathWord is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.',
      },
      {
        title: 'Changes to This Policy',
        content:
          'We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email.',
      },
      {
        title: 'Contact',
        content:
          'For privacy inquiries or to exercise your data rights, please use the Send Feedback option in the app.',
      },
    ],
  },
};
