import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, AuthSession, AuthError, LoginCredentials, RegisterData } from '@/types';
import { 
  signInWithPassword, 
  signUp, 
  signOut, 
  resetPassword, 
  getCurrentUser, 
  getCurrentSession,
  onAuthStateChange,
  getRoleBasedRedirect
} from '@/lib/supabase-auth';
import { 
  logLogin, 
  logLogout, 
  logRegistration, 
  logPasswordReset,
  queueWelcomeEmail
} from '@/lib/audit-logger';
import { useToast } from '@/hooks/use-toast';
import { SessionManager } from '@/lib/session-manager';

// Auth Context Type
interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: AuthError }>;
  signUp: (data: RegisterData) => Promise<{ success: boolean; error?: AuthError }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // First check SessionManager for existing session
        const sessionManagerData = SessionManager.getSession();
        
        // Then get current session from Supabase
        const currentSession = await getCurrentSession();
        
        if (currentSession) {
          setUser(currentSession.user);
          setSession(currentSession);
          // Ensure SessionManager is synchronized
          SessionManager.setSession(currentSession);
        } else if (sessionManagerData) {
          // If SessionManager has data but Supabase doesn't, clear it
          SessionManager.clearSession();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError({ message: 'Failed to initialize authentication' });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (user) {
        setUser(user);
        // We still need to fetch the full session
        getCurrentSession().then(session => {
          setSession(session);
          // Synchronize with SessionManager
          if (session) {
            SessionManager.setSession(session);
          }
        }).catch(err => {
          console.error('Error fetching session:', err);
          setSession(null);
        });
      } else {
        setUser(null);
        setSession(null);
        // Clear SessionManager
        SessionManager.clearSession();
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      setLoading(true);
      setError(null);
      
      // Disable session validation during login to prevent race conditions
      SessionManager.disableValidation();

      const { data, error } = await signInWithPassword(credentials);

      if (error) {
        // Re-enable validation on error
        SessionManager.enableValidation();
        setError(error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        // Synchronize with SessionManager
        SessionManager.setSession(data.session);

        // Log successful login
        await logLogin(data.user.id, data.user.email);

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.name}!`
        });

        return { success: true };
      }

      const authError = { message: 'Login failed - no user data received' };
      // Re-enable validation on error
      SessionManager.enableValidation();
      setError(authError);
      return { success: false, error: authError };
    } catch (err) {
      const authError = { message: 'An unexpected error occurred during login' };
      // Re-enable validation on error
      SessionManager.enableValidation();
      setError(authError);
      console.error('Sign in error:', err);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUpUser = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      setLoading(true);
      setError(null);

      const { data: authData, error } = await signUp(data);

      if (error) {
        setError(error);
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      if (authData.user) {
        // Log successful registration
        await logRegistration(authData.user.id, authData.user.email, authData.user.role, !!data.invite_token);

        // Queue welcome email
        await queueWelcomeEmail(authData.user.id, authData.user.email, authData.user.name);

        if (authData.session) {
          setUser(authData.user);
          setSession(authData.session);
          // Synchronize with SessionManager
          SessionManager.setSession(authData.session);
        }

        toast({
          title: "Registration Successful",
          description: authData.session 
            ? `Welcome, ${authData.user.name}!` 
            : "Please check your email to verify your account."
        });

        return { success: true };
      }

      const authError = { message: 'Registration failed - no user data received' };
      setError(authError);
      return { success: false, error: authError };
    } catch (err) {
      const authError = { message: 'An unexpected error occurred during registration' };
      setError(authError);
      console.error('Sign up error:', err);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOutUser = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      const currentUserId = user?.id;
      
      const { error } = await signOut();
      
      if (error) {
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Log successful logout
      if (currentUserId) {
        await logLogout(currentUserId);
      }

      setUser(null);
      setSession(null);
      setError(null);
      // Clear SessionManager
      SessionManager.clearSession();

      toast({
        title: "Signed Out",
        description: "You have been successfully signed out."
      });
    } catch (err) {
      console.error('Sign out error:', err);
      toast({
        title: "Sign Out Error",
        description: "An unexpected error occurred during sign out",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const resetUserPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await resetPassword(email);

      if (error) {
        setError(error);
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      // Log password reset request
      await logPasswordReset(email);

      toast({
        title: "Password Reset Sent",
        description: "Please check your email for password reset instructions."
      });

      return { success: true };
    } catch (err) {
      const authError = { message: 'An unexpected error occurred during password reset' };
      setError(authError);
      console.error('Password reset error:', err);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser();
      const currentSession = await getCurrentSession();
      
      setUser(currentUser);
      setSession(currentSession);
      
      // Synchronize with SessionManager
      if (currentSession) {
        SessionManager.setSession(currentSession);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
      setError({ message: 'Failed to refresh user data' });
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp: signUpUser,
    signOut: signOutUser,
    resetPassword: resetUserPassword,
    clearError,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};