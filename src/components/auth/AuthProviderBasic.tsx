import React, { useState, createContext, useContext } from 'react';
import { User, AuthSession, AuthError, LoginCredentials } from '@/types';

// Ultra-basic auth context for testing
interface BasicAuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: AuthError }>;
  signOut: () => Promise<void>;
}

const BasicAuthContext = createContext<BasicAuthContextType | undefined>(undefined);

export const AuthProviderBasic: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  console.log('[AuthBasic] Provider initialized');

  const signIn = async (credentials: LoginCredentials) => {
    console.log('[AuthBasic] Sign in attempt:', credentials.email);
    setLoading(true);
    
    // Mock successful auth for testing
    const mockUser: User = {
      id: 'test-user',
      email: credentials.email,
      name: 'Test User',
      role: 'owner',
      retailer_id: null,
      location_id: null
    };
    
    const mockSession: AuthSession = {
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_at: Date.now() + 3600000
    };

    setTimeout(() => {
      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
    }, 500);
    
    return { success: true };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
  };

  const contextValue: BasicAuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut
  };

  return (
    <BasicAuthContext.Provider value={contextValue}>
      {children}
    </BasicAuthContext.Provider>
  );
};

export const useAuthBasic = () => {
  const context = useContext(BasicAuthContext);
  if (!context) {
    throw new Error('useAuthBasic must be used within an AuthProviderBasic');
  }
  return context;
};