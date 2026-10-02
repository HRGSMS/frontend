import React, { createContext, useContext, useState } from 'react';

// Define a simple user object for frontdesk
interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'FrontDesk' | 'ServiceStaff' | 'Manager' | 'Admin';
  branchId: number | null;
}

// Define the shape of our Auth Context (simplified - no auth)
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  // No login/logout functions
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Mock user for frontdesk - no authentication required
  const mockUser: User = {
    id: 1,
    fullName: 'Front Desk User',
    email: 'frontdesk@hotel.com',
    role: 'FrontDesk',
    branchId: 1,
  };

  const [user] = useState<User | null>(mockUser);
  const [accessToken] = useState<string | null>('mock-token');
  const [isLoading] = useState(false);

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
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