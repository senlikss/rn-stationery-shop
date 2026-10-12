import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { selectSelectionCount, useSelectionStore } from '@/stores/selectionStore';

export function SelectionHeaderButton() {
  const count = useSelectionStore(selectSelectionCount);

  return (
    <Pressable
      accessibilityLabel={`Список к покупке, препаратов: ${count}`}
      onPress={() => router.push('/selection')}
      style={styles.button}
    >
      <Text style={styles.icon}>☰</Text>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 8, paddingVertical: 6 },
  icon: { color: colors.primaryDark, fontSize: 22, fontWeight: '800' },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  badgeText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
});
