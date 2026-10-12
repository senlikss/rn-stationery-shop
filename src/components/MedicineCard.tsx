import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Medicine } from '@/types/medicine';
import { colors } from '@/theme/colors';
import { useSelectionStore } from '@/stores/selectionStore';

interface MedicineCardProps {
  medicine: Medicine;
  onPress: () => void;
}

export function MedicineCard({ medicine, onPress }: MedicineCardProps) {
  const add = useSelectionStore((state) => state.add);
  const selectedQuantity = useSelectionStore(
    (state) => state.lines[medicine.id]?.quantity ?? 0,
  );

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{medicine.name.slice(0, 1)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {medicine.name}
          </Text>
          {medicine.prescription_required ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxText}>Rx</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.latinName}>{medicine.latin_name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {medicine.form} · {medicine.dosage}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.stock}>В наличии {medicine.stock}</Text>
          <Pressable
            accessibilityLabel={`Добавить ${medicine.name} в список`}
            onPress={(event) => {
              event.stopPropagation();
              add(medicine);
            }}
            style={styles.addButton}
          >
            <Text style={styles.addText}>
              {selectedQuantity ? `Ещё · ${selectedQuantity}` : 'Добавить'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: { fontSize: 23, fontWeight: '900', color: colors.primary },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  latinName: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  meta: { marginTop: 8, fontSize: 13, color: colors.text },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stock: { fontSize: 12, fontWeight: '700', color: colors.primary },
  addButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  addText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  rxBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.dangerSoft,
  },
  rxText: { fontSize: 11, fontWeight: '900', color: colors.danger },
});
