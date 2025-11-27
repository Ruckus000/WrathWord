import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {palette} from '../../theme/colors';
import {ChevronRight} from '../../components/icons/SettingsIcons';

type Props = {
  friendsPlayedCount: number;
  onPlayNow?: () => void;
};

export default function NotPlayedCard({friendsPlayedCount, onPlayNow}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🎯</Text>
      <Text style={styles.title}>Today's puzzle awaits</Text>
      <Text style={styles.subtitle}>
        {friendsPlayedCount} friends have already played. Will you beat them?
      </Text>
      <Pressable style={styles.btn} onPress={onPlayNow}>
        <Text style={styles.btnText}>Play Now</Text>
        <ChevronRight size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.cardBorder,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.success,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
