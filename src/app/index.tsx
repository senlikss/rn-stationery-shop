import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { getMedicines } from '@/services/medicineRepository';
import type { Medicine } from '@/types/medicine';
import { MedicineCard } from '@/components/MedicineCard';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/theme/colors';

const ALL_CATEGORIES = 'Все';

export default function CatalogScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMedicines()
      .then((data) => {
        if (active) setMedicines(data);
      })
      .catch(() => {
        if (active) setError('Не удалось прочитать данные из db.json');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...new Set(medicines.map((item) => item.category))],
    [medicines],
  );

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');

    return medicines.filter((medicine) => {
      const matchesCategory =
        category === ALL_CATEGORIES || medicine.category === category;
      const matchesSearch =
        !query ||
        [medicine.name, medicine.latin_name, medicine.active_substance]
          .join(' ')
          .toLocaleLowerCase('ru')
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, medicines, search]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Открываем аптечный каталог…</Text>
      </View>
    );
  }

  if (error) {
    return <EmptyState title="Ошибка загрузки" subtitle={error} icon="!" />;
  }

  return (
    <FlatList
      data={filteredMedicines}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Каталог лекарств</Text>
            <Text style={styles.heroTitle}>Найдите препарат по названию или веществу</Text>
            <Text style={styles.heroSubtitle}>
              Проверяйте форму выпуска, дозировку и необходимость рецепта.
            </Text>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск: ибупрофен, витамин C…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categories.map((item) => {
              const selected = item === category;
              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                >
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.resultCount}>Найдено: {filteredMedicines.length}</Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Ничего не найдено"
          subtitle="Попробуйте изменить запрос или выбрать другую категорию."
          icon="⌕"
        />
      }
      renderItem={({ item }) => (
        <MedicineCard
          medicine={item}
          onPress={() => router.push({ pathname: '/medicine/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 36 },
  separator: { height: 12 },
  header: { marginBottom: 14 },
  hero: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: colors.primaryDark,
    marginBottom: 14,
  },
  eyebrow: {
    color: '#9ED5C8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    marginTop: 8,
    color: colors.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  heroSubtitle: { marginTop: 10, color: '#C8DDD8', fontSize: 14, lineHeight: 20 },
  searchInput: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  categories: { gap: 8, paddingVertical: 14 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: colors.white },
  resultCount: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: 12, color: colors.textMuted },
});
