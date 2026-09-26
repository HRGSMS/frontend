import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: null | {
    id: number;
    fullName: string;
    email: string;
    role: 'Guest' | 'FrontDesk' | 'ServiceStaff' | 'Manager' | 'Admin';
    branchId: number | null;
    mfaSecret?: string;
  };
  accessToken: string | null;
  refreshTokenValue: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfa: (challengeToken: string, code: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // Renamed from `refreshToken` — that name collided with the imported
  // authApi.refreshToken function and shadowed it everywhere in this file.
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Attempt to restore session on app load
    const restoreSession = async () => {
      try {
        const response = await authApi.refreshToken();
        setUser(response.user);
        setAccessToken(response.accessToken);
        setRefreshTokenValue(response.refreshToken);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      } catch (error) {
        // Session restoration failed — make sure no stale auth state lingers
        console.log('Session restoration failed');
        logoutHandler();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginHandler = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);

      if (response.mfaRequired) {
        // Store challenge token temporarily (in real app, use state or context)
        localStorage.setItem('mfaChallengeToken', response.challengeToken);
        // In a real implementation, you'd navigate to MFA page
        throw new Error('MFA required');
      } else {
        setUser(response.user);
        setAccessToken(response.accessToken);
        setRefreshTokenValue(response.refreshToken);

        // Store tokens (in production, use httpOnly cookies or secure storage)
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfaHandler = async (challengeToken: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.verifyMfa(challengeToken, code);
      setUser(response.user);
      setAccessToken(response.accessToken);
      setRefreshTokenValue(response.refreshToken);

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Clear temporary challenge token
      localStorage.removeItem('mfaChallengeToken');
    } finally {
      setIsLoading(false);
    }
  };

  const registerHandler = async (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      // In a real app, you might auto-login or show success message
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPasswordHandler = async (email: string) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordHandler = async (token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHandler = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.refreshToken();
      setAccessToken(response.accessToken);
      setRefreshTokenValue(response.refreshToken);

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (error) {
      // Refresh failed, clear tokens and force re-login
      logoutHandler();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutHandler = () => {
    authApi.logout();
    setUser(null);
    setAccessToken(null);
    setRefreshTokenValue(null);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mfaChallengeToken');
  };

  if (isLoading) {
    return null; // Don't render children while loading
  }

  const value: AuthContextType = {
    user,
    accessToken,
    refreshTokenValue,
    isLoading: false, // We've already handled loading state above
    login: loginHandler,
    verifyMfa: verifyMfaHandler,
    register: registerHandler,
    forgotPassword: forgotPasswordHandler,
    resetPassword: resetPasswordHandler,
    refresh: refreshHandler,
    logout: logoutHandler,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};