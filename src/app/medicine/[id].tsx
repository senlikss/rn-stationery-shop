import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getMedicineById } from '@/services/medicineRepository';
import type { Medicine } from '@/types/medicine';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/theme/colors';
import { useSelectionStore } from '@/stores/selectionStore';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function MedicineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const add = useSelectionStore((state) => state.add);
  const quantity = useSelectionStore((state) => (id ? state.lines[id]?.quantity ?? 0 : 0));

  useEffect(() => {
    let active = true;

    if (!id) {
      return () => {
        active = false;
      };
    }

    getMedicineById(id).then((item) => {
      if (active) {
        setMedicine(item ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [id]);

  if (!id) {
    return <EmptyState title="Препарат не найден" subtitle="В адресе не указан идентификатор препарата." icon="!" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!medicine) {
    return <EmptyState title="Препарат не найден" subtitle="Вернитесь в каталог и выберите другой препарат." icon="!" />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.monogram}>
            <Text style={styles.monogramText}>{medicine.name.slice(0, 1)}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{medicine.name}</Text>
            <Text style={styles.latinName}>{medicine.latin_name}</Text>
          </View>
          {medicine.prescription_required ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxText}>Rx</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Основная информация</Text>
        <View style={styles.card}>
          <InfoRow label="Действующее вещество" value={medicine.active_substance} />
          <InfoRow label="Форма и дозировка" value={`${medicine.form}, ${medicine.dosage}`} />
          <InfoRow label="Категория" value={medicine.category} />
          <InfoRow label="Производитель" value={medicine.manufacturer} />
          <InfoRow label="Отпуск" value={medicine.prescription_required ? 'По рецепту' : 'Без рецепта'} />
          <InfoRow label="Остаток" value={`${medicine.stock} шт.`} />
        </View>

        <Text style={styles.sectionTitle}>Описание</Text>
        <View style={styles.card}>
          <Text style={styles.description}>{medicine.description}</Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Важно</Text>
          <Text style={styles.noticeText}>
            Информация в приложении носит справочный характер. Перед применением ознакомьтесь с инструкцией и проконсультируйтесь со специалистом.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {quantity ? `В списке: ${quantity}` : 'Добавьте препарат в список'}
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => add(medicine)}>
          <Text style={styles.primaryButtonText}>{quantity ? 'Добавить ещё' : 'Добавить'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 26,
    backgroundColor: colors.primaryDark,
  },
  monogram: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C806F',
  },
  monogramText: { color: colors.white, fontSize: 27, fontWeight: '900' },
  heroText: { flex: 1 },
  name: { color: colors.white, fontSize: 23, fontWeight: '900' },
  latinName: { marginTop: 4, color: '#BBD7D1', fontSize: 13 },
  rxBadge: { padding: 9, borderRadius: 12, backgroundColor: colors.dangerSoft },
  rxText: { color: colors.danger, fontWeight: '900' },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 9,
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { flex: 1, color: colors.textMuted, fontSize: 13 },
  infoValue: { flex: 1.3, textAlign: 'right', color: colors.text, fontSize: 13, fontWeight: '700' },
  description: { color: colors.text, fontSize: 15, lineHeight: 23 },
  notice: {
    marginTop: 16,
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFF5E6',
  },
  noticeTitle: { color: '#8D5B12', fontWeight: '900' },
  noticeText: { marginTop: 5, color: '#745C39', fontSize: 13, lineHeight: 19 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerText: { flex: 1, color: colors.textMuted, fontSize: 13 },
  primaryButton: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 15, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
});
