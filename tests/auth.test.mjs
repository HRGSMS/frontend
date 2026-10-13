import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { authenticate, readSession, endSession } from '../src/lib/auth-session.ts';
import {
  roles,
  getRole,
  homeForRole,
  canAccessPath,
  loginDestination,
} from '../src/lib/auth-policy.ts';

const session = () => ({
  user: { id: 'u1', name: 'Reception', email: 'staff@hotel.test', role: 'front_desk' },
  session: {
    id: 's1',
    userId: 'u1',
    token: 'test-session-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  },
});
function mockClient(responses) {
  const calls = [];
  const client = createAuthClient({
    baseURL: 'http://hotel.test/api/auth',
    plugins: [adminClient()],
    fetchOptions: {
      credentials: 'include',
      customFetchImpl: async (url, init) => {
        calls.push({ url: String(url), init });
        const next = responses.shift();
        assert.ok(next, 'Unexpected authentication request');
        return Response.json(next.body, { status: next.status || 200 });
      },
    },
  });
  return { client, calls };
}

test('real Better Auth client uses email login, cookie credentials and authoritative session', async () => {
  const { client, calls } = mockClient([
    { body: { redirect: false, token: 'test-session-token', user: session().user } },
    { body: session() },
  ]);
  const data = await authenticate(client, ' staff@hotel.test ', 'password');
  assert.equal(data.user.role, 'front_desk');
  assert.equal(new URL(calls[0].url).pathname, '/api/auth/sign-in/email');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    email: 'staff@hotel.test',
    password: 'password',
    rememberMe: false,
  });
  assert.equal(new URL(calls[1].url).pathname, '/api/auth/get-session');
  assert.equal(new URL(calls[1].url).searchParams.get('disableCookieCache'), 'true');
});
test('invalid credentials preserve the server error and do not attempt session retrieval', async () => {
  const { client, calls } = mockClient([
    {
      status: 401,
      body: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
    },
  ]);
  await assert.rejects(
    authenticate(client, 'staff@hotel.test', 'wrong'),
    /Invalid email or password/,
  );
  assert.equal(calls.length, 1);
});
test('null session is an unauthenticated state', async () => {
  const { client } = mockClient([{ body: null }]);
  assert.equal(await readSession(client), null);
});
test('successful credentials without an active session never grant access', async () => {
  const { client } = mockClient([
    { body: { redirect: false, user: session().user } },
    { body: null },
  ]);
  await assert.rejects(authenticate(client, 'staff@hotel.test', 'password'), /no active session/);
});
test('session lookup failures surface rather than masquerading as logout', async () => {
  const { client } = mockClient([{ status: 503, body: { message: 'Service unavailable' } }]);
  await assert.rejects(readSession(client), /Service unavailable/);
});
test('expired sessions are rejected', async () => {
  const expired = session();
  expired.session.expiresAt = new Date(Date.now() - 1000).toISOString();
  const { client } = mockClient([{ body: expired }]);
  assert.equal(await readSession(client), null);
});
test('malformed sessions are rejected', async () => {
  for (const invalid of [
    { user: session().user },
    { ...session(), session: { token: 'x', expiresAt: 'invalid' } },
  ]) {
    await assert.rejects(
      readSession({ getSession: async () => ({ data: invalid, error: null }) }),
      /invalid session/,
    );
  }
});
test('a session must belong to the user returned by the server', async () => {
  const mismatched = session();
  mismatched.session.userId = 'another-user';
  const { client } = mockClient([{ body: mismatched }]);
  await assert.rejects(readSession(client), /invalid session/);
});
test('invalid token and missing expiry never grant access', async () => {
  for (const invalid of [
    { ...session(), session: { ...session().session, token: 123 } },
    { ...session(), session: { ...session().session, expiresAt: null } },
  ]) {
    const { client } = mockClient([{ body: invalid }]);
    await assert.rejects(readSession(client), /invalid session/);
  }
});
test('logout uses the cookie-authenticated server endpoint', async () => {
  const { client, calls } = mockClient([{ body: { success: true } }]);
  await endSession(client);
  assert.equal(new URL(calls[0].url).pathname, '/api/auth/sign-out');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
});
test('failed logout is reported', async () => {
  const { client } = mockClient([{ status: 503, body: { message: 'Unable to revoke session' } }]);
  await assert.rejects(endSession(client), /Unable to revoke session/);
});
test('password changes send the current password and revoke other sessions', async () => {
  const { client, calls } = mockClient([{ body: { token: null, user: session().user } }]);
  const result = await client.changePassword({
    currentPassword: 'old-password',
    newPassword: 'NewPassword123!',
    revokeOtherSessions: true,
  });
  assert.equal(result.error, null);
  assert.equal(new URL(calls[0].url).pathname, '/api/auth/change-password');
  assert.equal(calls[0].init.credentials, 'include');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    currentPassword: 'old-password',
    newPassword: 'NewPassword123!',
    revokeOtherSessions: true,
  });
});
test('incorrect current password surfaces as an error', async () => {
  const { client } = mockClient([
    { status: 400, body: { code: 'INVALID_PASSWORD', message: 'Invalid password' } },
  ]);
  const result = await client.changePassword({
    currentPassword: 'wrong',
    newPassword: 'NewPassword123!',
    revokeOtherSessions: true,
  });
  assert.equal(result.error.message, 'Invalid password');
});

const access = {
  admin: ['admin', 'manager', 'frontdesk', 'services'],
  manager: ['manager', 'frontdesk', 'services'],
  front_desk: ['frontdesk', 'services'],
  service_staff: ['services'],
  guest: ['guest'],
};
for (const role of roles) {
  test(`permission matrix and dashboard for ${role}`, () => {
    for (const area of ['admin', 'manager', 'frontdesk', 'services', 'guest']) {
      assert.equal(
        canAccessPath(role, `/${area}/dashboard`),
        access[role].includes(area),
        `${role}: ${area}`,
      );
    }
    assert.equal(canAccessPath(role, homeForRole(role)), true);
    assert.equal(canAccessPath(role, '/account'), true);
  });
}
test('missing, unknown and combined roles fail closed', () => {
  for (const role of [
    undefined,
    null,
    '',
    'user',
    'Admin',
    'admin,manager',
    'frontdesk',
    {},
    ['admin'],
  ]) {
    assert.equal(getRole(role), null);
    assert.equal(homeForRole(role), '/unauthorized');
    assert.equal(canAccessPath(role, '/frontdesk/payment-processing'), false);
  }
});
test('login always selects the assigned dashboard, including after a permitted deep link', () => {
  assert.equal(
    loginDestination('front_desk', '/frontdesk/reservations/123?tab=bill'),
    '/frontdesk/dashboard',
  );
  assert.equal(loginDestination('guest', '/admin/settings'), '/guest/dashboard');
  assert.equal(
    loginDestination('service_staff', '/frontdesk/payment-processing'),
    '/services/dashboard',
  );
});
test('each staff role has a distinct login URL even when another workspace was requested', () => {
  const destinations = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    front_desk: '/frontdesk/dashboard',
  };
  for (const [role, expected] of Object.entries(destinations)) {
    for (const requested of [
      '/frontdesk/dashboard',
      '/manager/dashboard',
      '/admin/dashboard',
      '/account',
    ]) {
      assert.equal(loginDestination(role, requested), expected);
    }
  }
});
test('redirect destinations cannot escape their permitted application area', () => {
  for (const destination of [
    'https://evil.test',
    '//evil.test',
    '/frontdesk/../admin/settings',
    '/frontdesk/%2e%2e/admin/settings',
    '/frontdesk/\\evil',
    '/frontdesk/\nadmin',
    '/login',
    '/unknown',
  ]) {
    assert.equal(loginDestination('front_desk', destination), '/frontdesk/dashboard', destination);
  }
});
test('front desk staff cannot access reports pages while managers and admins can', () => {
  assert.equal(canAccessPath('front_desk', '/frontdesk/reports'), false);
  assert.equal(canAccessPath('front_desk', '/manager/reports'), false);
  assert.equal(canAccessPath('front_desk', '/admin/reports'), false);
  assert.equal(canAccessPath('manager', '/manager/reports'), true);
  assert.equal(canAccessPath('admin', '/admin/reports'), true);
  assert.equal(canAccessPath('admin', '/manager/reports'), true);
});
