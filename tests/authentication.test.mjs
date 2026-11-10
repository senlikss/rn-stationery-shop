import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticateDemo, requestDeviceCode, completeDeviceLogin } from '../src/services/authentication.ts';

const code = { device_code: 'device-test', user_code: 'ABCD-EFGH', expires_in: 30, interval: 0.001 };
const signal = () => new AbortController().signal;

test('demo accepts only the expected password and trims the login', () => {
  assert.equal(authenticateDemo(' demo ', 'Pharmacy123!').provider, 'demo');
  for (const [login, password] of [['demo', 'wrong'], ['', ''], ['other', 'Pharmacy123!'], ['demo', 'Pharmacy123! ']]) {
    assert.throws(() => authenticateDemo(login, password), /Неверный/);
  }
});

test('device request encodes a public client ID without requesting private scopes', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://github.com/login/device/code');
    const params = new URLSearchParams(options.body);
    assert.equal(params.get('client_id'), 'client+id');
    assert.equal(params.has('client_secret'), false);
    assert.equal(params.has('scope'), false);
    return Response.json({ ...code, interval: 5 });
  });
  assert.equal((await requestDeviceCode('client+id', signal())).user_code, code.user_code);
});

test('pending authorization is retried and only a verified GitHub profile becomes a user', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push(url);
    if (calls.length === 1) return Response.json({ error: 'authorization_pending' });
    if (calls.length === 2) return Response.json({ access_token: 'test-token' });
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return Response.json({ id: 42, login: 'test-user', name: null });
  });
  assert.deepEqual(await completeDeviceLogin('client', code, signal()), {
    id: '42', name: 'test-user', provider: 'github',
  });
  assert.equal(calls.length, 3);
});

test('GitHub rejection and disabled Device Flow are actionable errors', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'access_denied' }));
  await assert.rejects(completeDeviceLogin('client', code, signal()), /отменили/);
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ error: 'device_flow_disabled' }));
  await assert.rejects(requestDeviceCode('client', signal()), /Device Flow/);
});

test('cancelled polling never requests an access token', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected fetch'); });
  const controller = new AbortController();
  const result = completeDeviceLogin('client', code, controller.signal);
  controller.abort();
  await assert.rejects(result, /отменён/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('slow_down increases the polling interval by five seconds', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1;
    if (calls === 1) return Response.json({ error: 'slow_down', interval: 10 });
    if (calls === 2) return Response.json({ access_token: 'test-token' });
    return Response.json({ id: 42, login: 'test-user' });
  });
  const result = completeDeviceLogin('client', { ...code, interval: 5 }, signal());
  t.mock.timers.tick(4999);
  assert.equal(calls, 0);
  t.mock.timers.tick(1);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  t.mock.timers.tick(9999);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  t.mock.timers.tick(1);
  assert.equal((await result).provider, 'github');
  assert.equal(calls, 3);
});

test('expired codes do not poll GitHub', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected fetch'); });
  await assert.rejects(completeDeviceLogin('client', { ...code, expires_in: 0 }, signal()), /истёк/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('HTTP failures, malformed device codes and invalid profiles do not log in', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  await assert.rejects(requestDeviceCode('client', signal()), /недоступен/);
  globalThis.fetch.mock.mockImplementation(async () => Response.json({}));
  await assert.rejects(requestDeviceCode('client', signal()), /некорректный код/);
  globalThis.fetch.mock.mockImplementation(async (url) => Response.json(
    url === 'https://api.github.com/user' ? {} : { access_token: 'test-token' },
  ));
  await assert.rejects(completeDeviceLogin('client', code, signal()), /некорректный профиль/);
});
