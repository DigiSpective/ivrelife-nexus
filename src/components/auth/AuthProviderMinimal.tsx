import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, AuthSession, AuthError, LoginCredentials } from '@/types';

// Minimal auth context - no complex operations
interface MinimalAuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: AuthError }>;
  signOut: () => Promise<void>;
}

const MinimalAuthContext = createContext<MinimalAuthContextType | undefined>(undefined);

export const MinimalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  console.log('[MinimalAuth] Provider initialized');

  // Minimal initialization - no Supabase
  useEffect(() => {
    console.log('[MinimalAuth] Initialization complete');
    setLoading(false);
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    console.log('[MinimalAuth] Sign in attempt:', credentials.email);
    setLoading(true);
    setError(null);

    // Simulate auth without Supabase - just for testing
    return new Promise<{ success: boolean; error?: AuthError }>((resolve) => {
      setTimeout(() => {
        if (credentials.email === 'test@test.com' && credentials.password === 'password') {
          const mockUser: User = {
            id: 'test-user-id',
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

          setUser(mockUser);
          setSession(mockSession);
          setLoading(false);
          resolve({ success: true });
        } else {
          setError({ message: 'Invalid credentials' });
          setLoading(false);
          resolve({ success: false, error: { message: 'Invalid credentials' } });
        }
      }, 1000);
    });
  };

  const signOut = async () => {
    console.log('[MinimalAuth] Sign out');
    setUser(null);
    setSession(null);
    setError(null);
  };

  const contextValue: MinimalAuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut
  };

  return (
    <MinimalAuthContext.Provider value={contextValue}>
      {children}
    </MinimalAuthContext.Provider>
  );
};

export const useMinimalAuth = () => {
  const context = useContext(MinimalAuthContext);
  if (!context) {
    throw new Error('useMinimalAuth must be used within a MinimalAuthProvider');
  }
  return context;
};