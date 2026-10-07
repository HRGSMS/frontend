import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authClient, type User, type Session } from '../lib/auth-client';

// Define the shape of our Auth Context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!session;

  // Fetch session on mount
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await authClient.getSession();
      if (data) {
        setUser(data.user);
        setSession(data);
      } else {
        setUser(null);
        setSession(null);
      }
      if (error) {
        console.error('Session fetch error:', error);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // @ts-expect-error - dynamic access to email provider
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });
      if (data) {
        setUser(data.user);
        setSession(data);
        return { error: undefined };
      }
      return { error: error || new Error('Sign in failed') };
    } catch (err) {
      return { error: err as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access auth context in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};