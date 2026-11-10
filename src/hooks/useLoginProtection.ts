import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

let protectionId = 0;

export function useLoginProtection() {
  const [ready, setReady] = useState(Platform.OS === 'web');
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let disposed = false;
    let acquired = false;
    const key = `login-${++protectionId}`;
    const enable = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync(key);
        acquired = true;
        if (disposed) {
          await ScreenCapture.allowScreenCaptureAsync(key);
        } else {
          setReady(true);
        }
      } catch {
        if (!disposed) setError('Не удалось защитить экран. Перезапустите приложение в development build.');
      }
    };
    void enable();
    return () => {
      disposed = true;
      if (acquired) void ScreenCapture.allowScreenCaptureAsync(key).catch(() => {});
    };
  }, []);

  return { ready, error };
}
