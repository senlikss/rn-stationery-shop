export interface AuthUser {
  id: string;
  name: string;
  provider: 'demo' | 'github';
}

export function authenticateDemo(login: string, password: string): AuthUser {
  if (login.trim() !== 'demo' || password !== 'Pharmacy123!') {
    throw new Error('Неверный логин или пароль.');
  }
  return { id: 'demo', name: 'Демо-пользователь', provider: 'demo' };
}

export interface DeviceCode {
  device_code: string;
  user_code: string;
  expires_in: number;
  interval: number;
}

const messages: Record<string, string> = {
  access_denied: 'Вы отменили вход через GitHub.',
  expired_token: 'Код истёк. Начните вход заново.',
  device_flow_disabled: 'Включите Device Flow в настройках GitHub OAuth App.',
  incorrect_client_credentials: 'Проверьте Client ID GitHub OAuth App.',
};

async function post(path: string, params: Record<string, string>, signal: AbortSignal) {
  const response = await fetch(`https://github.com/login/${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    signal,
  });
  if (!response.ok) throw new Error('GitHub недоступен. Попробуйте позже.');
  return response.json();
}

export async function requestDeviceCode(clientId: string, signal: AbortSignal): Promise<DeviceCode> {
  const data = await post('device/code', { client_id: clientId }, signal);
  if (data.error) throw new Error(messages[data.error] ?? 'Не удалось начать вход через GitHub.');
  if (!data.device_code || !data.user_code || !(data.expires_in > 0) || !(data.interval > 0)) {
    throw new Error('GitHub вернул некорректный код входа.');
  }
  return data;
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Error('Вход отменён.'));
    const cancel = () => {
      clearTimeout(timer);
      reject(new Error('Вход отменён.'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

export async function completeDeviceLogin(
  clientId: string,
  code: DeviceCode,
  signal: AbortSignal,
): Promise<AuthUser> {
  const expiresAt = Date.now() + code.expires_in * 1000;
  let interval = code.interval * 1000;
  while (Date.now() < expiresAt) {
    await wait(interval, signal);
    if (Date.now() >= expiresAt) break;
    const data = await post('oauth/access_token', {
      client_id: clientId,
      device_code: code.device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }, signal);
    if (data.error === 'authorization_pending') continue;
    if (data.error === 'slow_down') {
      interval = Math.max(interval + 5000, Number(data.interval || 0) * 1000);
      continue;
    }
    if (data.error) throw new Error(messages[data.error] ?? 'Не удалось войти через GitHub.');
    if (!data.access_token) throw new Error('GitHub не вернул токен входа.');
    const response = await fetch('https://api.github.com/user', {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${data.access_token}` },
      signal,
    });
    if (!response.ok) throw new Error('Не удалось получить профиль GitHub.');
    const profile = await response.json();
    if (!profile.id || !profile.login) throw new Error('GitHub вернул некорректный профиль.');
    // The token is used only for this request; neither tokens nor passwords are persisted.
    return { id: String(profile.id), name: profile.name || profile.login, provider: 'github' };
  }
  throw new Error(messages.expired_token);
}
