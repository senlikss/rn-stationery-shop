import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { SelectionLineCard } from '@/components/SelectionLineCard';
import { colors } from '@/theme/colors';
import {
  selectPrescriptionCount,
  selectSelectionCount,
  useSelectionLines,
  useSelectionStore,
} from '@/stores/selectionStore';

export default function SelectionScreen() {
  const lines = useSelectionLines();
  const total = useSelectionStore(selectSelectionCount);
  const prescriptionCount = useSelectionStore(selectPrescriptionCount);
  const clear = useSelectionStore((state) => state.clear);

  if (!lines.length) {
    return (
      <EmptyState
        title="Список пока пуст"
        subtitle="Добавьте препараты из каталога, чтобы ничего не забыть в аптеке."
        icon="☰"
      />
    );
  }

  const confirmList = () => {
    Alert.alert(
      'Список готов',
      `Препаратов: ${total}. ${
        prescriptionCount
          ? `Для ${prescriptionCount} поз. потребуется рецепт.`
          : 'Рецептурных препаратов нет.'
      }`,
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={lines}
        keyExtractor={(line) => line.medicine.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryEyebrow}>Ваш список</Text>
            <Text style={styles.summaryValue}>{total} препаратов</Text>
            <Text style={styles.summaryText}>
              {prescriptionCount
                ? `Рецепт нужен для ${prescriptionCount} поз.`
                : 'Все выбранные позиции отпускаются без рецепта.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <SelectionLineCard line={item} />}
      />

      <View style={styles.footer}>
        <Pressable style={styles.clearButton} onPress={clear}>
          <Text style={styles.clearText}>Очистить</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={confirmList}>
          <Text style={styles.primaryText}>Проверить список</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 110 },
  separator: { height: 12 },
  summary: {
    marginBottom: 14,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.primaryDark,
  },
  summaryEyebrow: { color: '#9ED5C8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { marginTop: 6, color: colors.white, fontSize: 27, fontWeight: '900' },
  summaryText: { marginTop: 7, color: '#C8DDD8', fontSize: 13 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 15,
    backgroundColor: colors.dangerSoft,
  },
  clearText: { color: colors.danger, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.white, fontWeight: '900' },
});
