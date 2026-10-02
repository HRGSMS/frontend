import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import type { AuthState, LoginCredentials, RegisterData, User, UserRole } from '../types/auth';
import { apiClient, refreshAccessToken } from '../api/apiClient';

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  switchRole: (role: UserRole) => void;
}

const STORAGE_KEY_TOKEN = 'hrgsms_auth_token';
const STORAGE_KEY_USER = 'hrgsms_auth_user';

const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: 'usr_admin_1',
    name: 'ABCD',
    email: 'admin@skynest.lk',
    role: 'admin',
    branchId: 1,
    branchName: 'Sky Nest Colombo',
    avatar: '#',
  },
  manager: {
    id: 'usr_mgr_1',
    name: 'Dilshan Madushanka',
    email: 'manager@skynest.lk',
    role: 'manager',
    branchId: 1,
    branchName: 'Sky Nest Colombo',
    avatar: '#',
  },
  frontdesk: {
    id: 'usr_fd_1',
    name: 'Kamal Perera',
    email: 'frontdesk@skynest.lk',
    role: 'frontdesk',
    branchId: 1,
    branchName: 'Sky Nest Colombo',
    avatar: '#',
  },
  guest: {
    id: 'usr_gst_1',
    name: 'Anushka Idunil',
    email: 'anushka.f@example.com',
    role: 'guest',
    avatar: '#',
  },
};

const isUserRole = (role: unknown): role is UserRole =>
  role === 'admin' || role === 'manager' || role === 'frontdesk' || role === 'guest';

const storeSession = (user: User, token: string) => {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        if (parsedUser.id && parsedUser.email && isUserRole(parsedUser.role)) {
          setAuthState({
            user: parsedUser,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    }

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      try {
        const response = await apiClient.post('/auth/login', credentials, { timeout: 2500 });
        const payload = response.data?.data ?? response.data;
        const user = payload?.user as User | undefined;
        const token = payload?.token ?? payload?.accessToken;

        if (user && token && user.id && isUserRole(user.role)) {
          storeSession(user, token);
          setAuthState({ user, token, isAuthenticated: true, isLoading: false });
          return;
        }

        throw new Error('The authentication response was incomplete.');
      } catch (error) {
        const mockAuthEnabled =
          import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
        if (
          !mockAuthEnabled ||
          (axios.isAxiosError(error) && error.response && error.response.status !== 404)
        ) {
          throw error;
        }
      }

      const email = credentials.email.toLowerCase();
      const matchedUser = email.includes('admin')
        ? DEMO_USERS.admin
        : email.includes('manager')
          ? DEMO_USERS.manager
          : email.includes('front') || email.includes('desk')
            ? DEMO_USERS.frontdesk
            : {
                ...DEMO_USERS.guest,
                email: credentials.email,
                name: credentials.email.split('@')[0],
              };
      const generatedToken = `jwt_${matchedUser.role}_${Date.now()}`;
      storeSession(matchedUser, generatedToken);
      setAuthState({
        user: matchedUser,
        token: generatedToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      try {
        const response = await apiClient.post('/auth/register', data, { timeout: 2500 });
        const payload = response.data?.data ?? response.data;
        const user = payload?.user as User | undefined;
        const token = payload?.token ?? payload?.accessToken;
        if (user && token && user.id && isUserRole(user.role)) {
          storeSession(user, token);
          setAuthState({ user, token, isAuthenticated: true, isLoading: false });
          return;
        }
        throw new Error('The registration response was incomplete.');
      } catch (error) {
        const mockAuthEnabled =
          import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
        if (
          !mockAuthEnabled ||
          (axios.isAxiosError(error) && error.response && error.response.status !== 404)
        ) {
          throw error;
        }
      }

      const user: User = {
        id: `usr_guest_${Date.now()}`,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        role: 'guest',
      };
      const token = `jwt_guest_${Date.now()}`;
      storeSession(user, token);
      setAuthState({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const currentToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!currentToken) return null;

    try {
      const refreshed = await refreshAccessToken(currentToken);
      setAuthState((prev) => ({ ...prev, token: refreshed }));
      return refreshed;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!authState.user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(authState.user.role);
    },
    [authState.user],
  );

  const switchRole = useCallback((role: UserRole) => {
    const newUser = DEMO_USERS[role];
    const newToken = `jwt_${role}_${Date.now()}`;
    storeSession(newUser, newToken);
    setAuthState({
      user: newUser,
      token: newToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        refreshToken,
        hasRole,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
