import { createContext, useContext } from 'react';
import type { User, Session } from '../lib/auth-client';
export interface AuthContextType {
  user: User | null;
  session: Session['session'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
