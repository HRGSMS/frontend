import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { authBaseURL } from './config';

// Ensure baseURL and basePath are cleanly extracted from the configured authBaseURL
const authUrl = new URL(
  authBaseURL,
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000',
);
const baseURL = authUrl.origin;
const basePath = authUrl.pathname.replace(/\/$/, '') || '/api/auth';

export const authClient = createAuthClient({
  baseURL,
  basePath,
  plugins: [adminClient()],
  fetchOptions: { credentials: 'include' },
});

export type Session = typeof authClient.$Infer.Session;
// Branch membership must be supplied and enforced by the server.
export type User = Session['user'] & { branchId?: string | number | null };
