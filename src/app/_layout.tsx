import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/colors';
import { SelectionHeaderButton } from '@/components/SelectionHeaderButton';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primaryDark,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Аптека рядом',
            headerRight: () => <SelectionHeaderButton />,
          }}
        />
        <Stack.Screen
          name="medicine/[id]"
          options={{
            title: 'О препарате',
            headerRight: () => <SelectionHeaderButton />,
          }}
        />
        <Stack.Screen name="selection" options={{ title: 'Список к покупке' }} />
      </Stack>
    </>
  );
}
