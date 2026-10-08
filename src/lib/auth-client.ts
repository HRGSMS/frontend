import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { authBaseURL } from './config';

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  basePath: '/api/auth',
  plugins: [adminClient()],
  fetchOptions: { credentials: 'include' },
});

export type Session = typeof authClient.$Infer.Session;
// Branch membership must be supplied and enforced by the server.
export type User = Session['user'] & { branchId?: string | number | null };
