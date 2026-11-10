import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/colors';
import { SelectionHeaderButton } from '@/components/SelectionHeaderButton';
import { useAuthStore } from '@/stores/authStore';
import { Pressable, Text } from 'react-native';

export default function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
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
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen
            name="index"
            options={{
              title: 'Аптека рядом',
              headerLeft: () => (
                <Pressable accessibilityRole="button" accessibilityLabel="Выйти из аккаунта"
                  onPress={signOut} style={{ paddingRight: 16, minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Выйти</Text>
                </Pressable>
              ),
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
        </Stack.Protected>
      </Stack>
    </>
  );
}
