import React, { createContext, useContext, ReactNode } from 'react';
import { User, AuthSession } from '@/types';
import { mockUser } from '@/lib/mock-data';

// Simplified Auth Context for Emergency Restoration
interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: any;
  sessionWarnings: any[];
  signIn: (credentials: any) => Promise<{ success: boolean; error?: any }>;
  signUp: (data: any) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: any }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: any }>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  clearSessionWarnings: () => void;
  dismissWarning: (warningType: string) => void;
  getSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderBypassProps {
  children: ReactNode;
}

export const AuthProviderBypass: React.FC<AuthProviderBypassProps> = ({ children }) => {
  console.log('🔓 AuthProviderBypass initialized - using mockUser for emergency restoration');

  // Create session with mockUser for emergency testing
  const session: AuthSession = {
    access_token: 'mock-token',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh',
    user: mockUser
  };

  const contextValue: AuthContextType = {
    user: mockUser,
    session: session,
    loading: false,
    error: null,
    sessionWarnings: [],
    
    // Mock auth functions that always succeed
    signIn: async (credentials) => {
      console.log('🔓 Mock signIn called');
      return { success: true };
    },
    
    signUp: async (data) => {
      console.log('🔓 Mock signUp called');
      return { success: true };
    },
    
    signOut: async () => {
      console.log('🔓 Mock signOut called');
    },
    
    resetPassword: async (email) => {
      console.log('🔓 Mock resetPassword called');
      return { success: true };
    },
    
    changePassword: async (currentPassword, newPassword) => {
      console.log('🔓 Mock changePassword called');
      return { success: true };
    },
    
    clearError: () => {},
    refreshUser: async () => {},
    clearSessionWarnings: () => {},
    dismissWarning: (warningType) => {},
    getSessions: async () => [],
    revokeSession: async (sessionId) => ({ success: true })
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthBypass = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthBypass must be used within an AuthProviderBypass');
  }
  return context;
};