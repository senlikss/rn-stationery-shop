import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SelectionLine } from '@/types/medicine';
import { colors } from '@/theme/colors';
import { useSelectionStore } from '@/stores/selectionStore';

export function SelectionLineCard({ line }: { line: SelectionLine }) {
  const add = useSelectionStore((state) => state.add);
  const decrement = useSelectionStore((state) => state.decrement);
  const remove = useSelectionStore((state) => state.remove);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{line.medicine.name}</Text>
          {line.medicine.prescription_required ? (
            <Text style={styles.rx}>по рецепту</Text>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {line.medicine.form} · {line.medicine.dosage}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.stepButton} onPress={() => decrement(line.medicine.id)}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.quantity}>{line.quantity}</Text>
        <Pressable style={styles.stepButton} onPress={() => add(line.medicine)}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
        <Pressable style={styles.removeButton} onPress={() => remove(line.medicine.id)}>
          <Text style={styles.removeText}>Убрать</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  info: { gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
  rx: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 13 },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  stepText: { fontSize: 20, fontWeight: '800', color: colors.primary },
  quantity: { minWidth: 24, textAlign: 'center', fontWeight: '900', color: colors.text },
  removeButton: { marginLeft: 'auto', paddingVertical: 7 },
  removeText: { fontSize: 13, fontWeight: '700', color: colors.danger },
});
