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
  refreshSession,
  changePassword,
  listSessions,
  revokeSession,
  verifySessionServerSide
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
import type { SessionWarning } from '@/lib/session-manager';

// Auth Context Type
interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  sessionWarnings: SessionWarning[];
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: AuthError; requiresMfa?: boolean }>;
  signUp: (data: RegisterData) => Promise<{ success: boolean; error?: AuthError }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: AuthError }>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  clearSessionWarnings: () => void;
  dismissWarning: (warningType: string) => void;
  getSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<{ success: boolean; error?: AuthError }>;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionWarnings, setSessionWarnings] = useState<SessionWarning[]>([]);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const { toast } = useToast();

  // Initialize session manager and auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Initialize SessionManager with client-side capabilities
        const sm = new SessionManager();
        setSessionManager(sm);
        
        // Set up session warning handler
        const unsubscribeWarnings = sm.onWarning((warning: SessionWarning) => {
          setSessionWarnings(prev => {
            // Prevent duplicate warnings
            const exists = prev.some(w => w.type === warning.type);
            if (!exists) {
              return [...prev, warning];
            }
            return prev;
          });

          // Show toast for critical warnings
          if (warning.severity === 'critical' || warning.severity === 'high') {
            toast({
              title: "Security Alert",
              description: warning.message,
              variant: "destructive",
              duration: warning.severity === 'critical' ? 0 : 10000
            });
          }
        });

        // First check SessionManager for existing session
        const sessionManagerData = SessionManager.getSession();
        
        // Then get current session from Supabase
        const currentSession = await getCurrentSession();
        
        if (currentSession) {
          // Verify session server-side for security
          const verification = await verifySessionServerSide(currentSession.access_token);
          
          if (verification.valid) {
            setUser(currentSession.user);
            setSession(currentSession);
            SessionManager.setSession(currentSession);
          } else {
            // Invalid session, clear everything
            SessionManager.clearSession();
            await signOut();
          }
        } else if (sessionManagerData) {
          // If SessionManager has data but Supabase doesn't, clear it
          SessionManager.clearSession();
        }

        // Cleanup function for warnings
        return () => {
          unsubscribeWarnings();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError({ message: 'Failed to initialize authentication' });
      } finally {
        setLoading(false);
      }
    };

    const cleanup = initializeAuth();

    // Fallback timeout to ensure loading doesn't get stuck
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 second timeout

    // Set up auth state change listener
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      if (user) {
        setUser(user);
        // Fetch the full session
        try {
          const session = await getCurrentSession();
          setSession(session);
          // Synchronize with SessionManager
          if (session) {
            SessionManager.setSession(session);
          }
        } catch (err) {
          console.error('Error fetching session:', err);
          setSession(null);
        }
      } else {
        setUser(null);
        setSession(null);
        SessionManager.clearSession();
        setSessionWarnings([]);
      }
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription?.unsubscribe?.();
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => cleanupFn?.());
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [toast]);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: AuthError; requiresMfa?: boolean }> => {
    try {
      setLoading(true);
      setError(null);
      
      // Disable session validation during login to prevent race conditions
      SessionManager.disableValidation();

      const { data, error } = await signInWithPassword(credentials);

      if (error) {
        SessionManager.enableValidation();
        setError(error);
        
        // Show different toast messages based on error type
        const isCredentialError = error.message?.toLowerCase().includes('invalid') || 
                                  error.message?.toLowerCase().includes('email') ||
                                  error.message?.toLowerCase().includes('password');
        
        toast({
          title: "Login Failed",
          description: isCredentialError ? "Invalid email or password" : error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        SessionManager.setSession(data.session);
        SessionManager.enableValidation();

        // Log successful login with enhanced security context
        await logLogin(data.user.id, data.user.email);

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.name || 'User'}!`
        });

        return { success: true };
      }

      // Check if MFA is required
      if (data.user?.mfa_enabled && !data.session) {
        return { success: false, requiresMfa: true };
      }

      const authError = { message: 'Login failed - no user data received' };
      SessionManager.enableValidation();
      setError(authError);
      return { success: false, error: authError };
    } catch (err) {
      const authError = { message: 'An unexpected error occurred during login' };
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
        // Log successful registration with enhanced context
        await logRegistration(authData.user.id, authData.user.email, authData.user.role, !!data.invite_token);

        // Queue welcome email
        await queueWelcomeEmail(authData.user.id, authData.user.email, authData.user.name);

        if (authData.session) {
          setUser(authData.user);
          setSession(authData.session);
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
      setSessionWarnings([]);
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

  const changeUserPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await changePassword(currentPassword, newPassword);

      if (error) {
        setError(error);
        toast({
          title: "Password Change Failed",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated."
      });

      return { success: true };
    } catch (err) {
      const authError = { message: 'An unexpected error occurred during password change' };
      setError(authError);
      console.error('Password change error:', err);
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
      
      if (currentSession) {
        // Verify session is still valid
        const verification = await verifySessionServerSide(currentSession.access_token);
        if (verification.valid) {
          setUser(currentUser);
          setSession(currentSession);
          SessionManager.setSession(currentSession);
        } else {
          // Session invalid, sign out
          await signOutUser();
        }
      } else {
        setUser(null);
        setSession(null);
        SessionManager.clearSession();
      }
    } catch (err) {
      console.error('Refresh user error:', err);
      setError({ message: 'Failed to refresh user data' });
    }
  }, [signOutUser]);

  const clearSessionWarnings = useCallback(() => {
    setSessionWarnings([]);
  }, []);

  const dismissWarning = useCallback((warningType: string) => {
    setSessionWarnings(prev => prev.filter(warning => warning.type !== warningType));
  }, []);

  const getSessions = useCallback(async (): Promise<any[]> => {
    try {
      if (!user?.id) return [];
      return await listSessions(user.id);
    } catch (err) {
      console.error('Get sessions error:', err);
      return [];
    }
  }, [user?.id]);

  const revokeUserSession = useCallback(async (sessionId: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await revokeSession(sessionId);
      
      if (error) {
        return { success: false, error };
      }

      toast({
        title: "Session Revoked",
        description: "The session has been successfully revoked."
      });

      return { success: true };
    } catch (err) {
      const authError = { message: 'Failed to revoke session' };
      console.error('Revoke session error:', err);
      return { success: false, error: authError };
    }
  }, [toast]);

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    error,
    sessionWarnings,
    signIn,
    signUp: signUpUser,
    signOut: signOutUser,
    resetPassword: resetUserPassword,
    changePassword: changeUserPassword,
    clearError,
    refreshUser,
    clearSessionWarnings,
    dismissWarning,
    getSessions,
    revokeSession: revokeUserSession
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