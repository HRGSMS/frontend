import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { apiBaseURL } from './config';

export const authClient = createAuthClient({
  baseURL: apiBaseURL.replace(/\/api$/, ''), // Use base server URL (e.g., http://localhost:4000)
  basePath: '/api/auth',
  plugins: [adminClient()],
  fetchOptions: { credentials: 'include' },
});

export type Session = typeof authClient.$Infer.Session;
// Branch membership must be supplied and enforced by the server.
export type User = Session['user'] & { branchId?: string | number | null };
