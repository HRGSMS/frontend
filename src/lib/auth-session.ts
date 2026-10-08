import type { Session } from './auth-client';
type Result<T> = { data: T | null; error: { message?: string } | null };
export interface SessionClient {
  getSession: (options: { query: { disableCookieCache: boolean } }) => Promise<Result<Session>>;
  signIn: {
    email: (input: {
      email: string;
      password: string;
      rememberMe: boolean;
    }) => Promise<{ error: { message?: string } | null }>;
  };
  signOut: () => Promise<{ error: { message?: string } | null }>;
}
export async function readSession(client: SessionClient): Promise<Session | null> {
  const { data, error } = await client.getSession({ query: { disableCookieCache: true } });
  if (error) throw new Error(error.message || 'Unable to verify your session. Please try again.');
  if (!data) return null;
  if (
    typeof data.user?.id !== 'string' ||
    !data.user.id ||
    typeof data.session?.token !== 'string' ||
    !data.session.token ||
    data.session.userId !== data.user.id ||
    data.session.expiresAt == null ||
    !Number.isFinite(new Date(data.session.expiresAt).getTime())
  ) {
    throw new Error('The server returned an invalid session.');
  }
  return new Date(data.session.expiresAt).getTime() > Date.now() ? data : null;
}
export async function authenticate(
  client: SessionClient,
  email: string,
  password: string,
): Promise<Session> {
  const { error } = await client.signIn.email({ email: email.trim(), password, rememberMe: false });
  if (error) throw new Error(error.message || 'Unable to sign in.');
  const session = await readSession(client);
  if (!session)
    throw new Error('Sign in succeeded, but no active session was returned. Please try again.');
  return session;
}
export async function endSession(client: SessionClient): Promise<void> {
  const { error } = await client.signOut();
  if (error) throw new Error(error.message || 'Unable to sign out. Please try again.');
}
