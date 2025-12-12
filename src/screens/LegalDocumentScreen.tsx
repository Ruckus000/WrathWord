/**
 * Legal Document Screen
 *
 * Full-screen modal for displaying Terms of Service or Privacy Policy.
 * Reusable component that renders legal content with proper scroll behavior.
 */

import React from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '../theme/colors';
import {XIcon} from '../components/icons/SettingsIcons';
import {LEGAL_CONTENT} from '../config/appConfig';

type DocumentType = 'terms' | 'privacy';

type Props = {
  documentType: DocumentType;
  onClose: () => void;
};

export default function LegalDocumentScreen({documentType, onClose}: Props) {
  const insets = useSafeAreaInsets();
  const content = LEGAL_CONTENT[documentType];

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>{content.title}</Text>
        <Pressable
          style={styles.closeBtn}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button">
          <XIcon size={14} color={palette.textMuted} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {paddingBottom: insets.bottom + 40},
        ]}
        showsVerticalScrollIndicator={true}>
        {/* Last Updated */}
        <Text style={styles.lastUpdated}>
          Last updated: {content.lastUpdated}
        </Text>

        {/* Sections */}
        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.cardBorder,
  },
  headerSpacer: {
    width: 28, // Match close button width for centering
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  closeBtn: {
    width: 28,
    height: 28,
    backgroundColor: palette.card,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
});
