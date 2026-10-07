import { createAuthClient } from '@better-auth/client';
import type { Auth } from 'better-auth';

// BetterAuth client configuration
// createAuthClient takes Auth server type as generic, returns a function that takes options
const getAuthClient = createAuthClient<Auth>();

export const authClient = getAuthClient({
  baseURL: 'http://localhost:4000',
  // Enable cookie-based auth for SSR/Next.js compatibility
  fetchOptions: {
    credentials: 'include',
  },
});

// Export types for use in components
export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  branchId?: string;
  image?: string;
};

export type Session = {
  user: User;
  expiresAt: Date;
  token: string;
};

// Auth methods - using the client directly
export const signIn = async (email: string, password: string) => {
  // @ts-expect-error - dynamic access to email provider
  return authClient.signIn.email({
    email,
    password,
    rememberMe: true,
  });
};

export const signOut = async () => {
  return authClient.signOut();
};

export const getSession = async () => {
  return authClient.getSession();
};

export const useSession = authClient.useSession;