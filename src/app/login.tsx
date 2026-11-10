import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useLoginProtection } from '@/hooks/useLoginProtection';
import { authenticateDemo, completeDeviceLogin, requestDeviceCode } from '@/services/authentication';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';

const clientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID?.trim();

export default function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const { ready, error: protectionError } = useLoginProtection();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [userCode, setUserCode] = useState('');
  const pending = useRef<AbortController | null>(null);
  const passwordInput = useRef<TextInput>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      if (state !== 'active') setVisible(false);
    });
    return () => {
      subscription.remove();
      pending.current?.abort();
    };
  }, []);

  const submitDemo = () => {
    if (pending.current) return;
    setError('');
    try {
      const user = authenticateDemo(login, password);
      setPassword('');
      setVisible(false);
      signIn(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось войти.');
    }
  };

  const submitGitHub = async () => {
    if (pending.current) return;
    setError('');
    if (Platform.OS === 'web') {
      setError('Вход через GitHub доступен в мобильном приложении. Для браузера используйте тестовый вход.');
      return;
    }
    if (!clientId) {
      setError('GitHub пока не настроен. Укажите EXPO_PUBLIC_GITHUB_CLIENT_ID по инструкции в README.');
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setPassword('');
    setVisible(false);
    try {
      const code = await requestDeviceCode(clientId, controller.signal);
      if (controller.signal.aborted) return;
      setUserCode(code.user_code);
      const user = await completeDeviceLogin(clientId, code, controller.signal);
      if (!controller.signal.aborted) signIn(user);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Не удалось связаться с GitHub.');
      }
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
        setUserCode('');
      }
    }
  };

  const cancelGitHub = () => {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setUserCode('');
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.center}>
        {protectionError ? <Text accessibilityRole="alert" style={styles.error}>{protectionError}</Text> : <ActivityIndicator color={colors.primary} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.brand}>АПТЕКА РЯДОМ</Text>
            <Text accessibilityRole="header" style={styles.title}>Добро пожаловать</Text>
            <Text style={styles.subtitle}>Войдите, чтобы найти лекарства и собрать список к покупке.</Text>

            <Text nativeID="login-label" style={styles.label}>Логин</Text>
            <TextInput
              accessibilityLabel="Логин" accessibilityLabelledBy="login-label"
              style={styles.input} value={login} onChangeText={setLogin}
              placeholder="Введите логин" autoCapitalize="none" autoCorrect={false}
              autoComplete="username" textContentType="username" editable={!busy}
              returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()}
            />
            <Text nativeID="password-label" style={styles.label}>Пароль</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordInput} accessibilityLabel="Пароль" accessibilityLabelledBy="password-label"
                style={styles.passwordInput} value={password} onChangeText={setPassword}
                placeholder="Введите пароль" secureTextEntry={!visible}
                autoCapitalize="none" autoCorrect={false} autoComplete="current-password"
                textContentType="password" editable={!busy} returnKeyType="go"
                onSubmitEditing={submitDemo}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Скрыть пароль' : 'Показать пароль'}
                accessibilityState={{ disabled: busy }} disabled={busy}
                onPress={() => setVisible((value) => !value)} style={styles.toggle}>
                <Text style={styles.link}>{visible ? 'Скрыть' : 'Показать'}</Text>
              </Pressable>
            </View>

            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }}
              disabled={busy} onPress={submitDemo} style={[styles.primary, busy && styles.disabled]}>
              <Text style={styles.primaryText}>Войти</Text>
            </Pressable>
            <Text style={styles.demo}>Тестовый вход: demo / Pharmacy123!</Text>
            <Text style={styles.divider}>или</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }}
              disabled={busy} onPress={() => void submitGitHub()} style={[styles.secondary, busy && styles.disabled]}>
              <Text style={styles.link}>Войти через GitHub</Text>
            </Pressable>

            {busy && (
              <View style={styles.device}>
                <ActivityIndicator color={colors.primary} />
                {userCode ? <>
                  <Text style={styles.subtitle}>Введите этот код на странице GitHub, затем вернитесь в приложение:</Text>
                  <Text selectable style={styles.code}>{userCode}</Text>
                  <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => {
                    void WebBrowser.openBrowserAsync('https://github.com/login/device').catch(() => {
                      setError('Не удалось открыть браузер. Откройте github.com/login/device самостоятельно.');
                    });
                  }}><Text style={styles.link}>Открыть GitHub</Text></Pressable>
                </> : <Text style={styles.subtitle}>Получаем код GitHub…</Text>}
                <Pressable accessibilityRole="button" onPress={cancelGitHub} style={styles.toggle}>
                  <Text style={styles.link}>Отменить вход</Text>
                </Pressable>
              </View>
            )}
            <Text style={styles.note}>{Platform.OS === 'web'
              ? 'Браузер не позволяет запретить скриншоты. Защита экрана доступна на Android и iOS.'
              : 'Экран входа защищён от скриншотов и записи экрана.'}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {!active && Platform.OS !== 'web' && <View style={styles.privacy} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 24, padding: 24, gap: 12 },
  brand: { color: colors.primary, fontWeight: '800', letterSpacing: 2, fontSize: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  label: { color: colors.text, fontWeight: '700', marginTop: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, color: colors.text, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  passwordInput: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 14, color: colors.text, fontSize: 16 },
  toggle: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '700', textAlign: 'center' },
  primary: { minHeight: 52, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  secondary: { minHeight: 52, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  demo: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  divider: { textAlign: 'center', color: colors.textMuted, marginVertical: 4 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  device: { backgroundColor: colors.surfaceMuted, padding: 16, borderRadius: 12, gap: 12 },
  code: { fontSize: 26, fontWeight: '800', letterSpacing: 3, textAlign: 'center', color: colors.primaryDark },
  privacy: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.background },
});
