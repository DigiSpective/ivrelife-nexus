import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, AuthSession, AuthError, LoginCredentials, RegisterData } from '@/types';
import { createSupabaseClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

// Simplified auth functions to avoid complex import chains
const createSimpleAuth = () => {
  const supabase = createSupabaseClient();
  
  return {
    signInWithPassword: async (credentials: LoginCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      return { data, error };
    },
    signUp: async (data: RegisterData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } }
      });
      return { data: authData, error };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    },
    getCurrentUser: () => supabase.auth.getUser(),
    getCurrentSession: () => supabase.auth.getSession(),
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return supabase.auth.onAuthStateChange(callback);
    }
  };
};

const auth = createSimpleAuth();

// Function to convert Supabase user to our User type
const mapSupabaseUserToUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    role: 'owner', // Default role for demo purposes
    retailer_id: null,
    location_id: null,
    avatar: supabaseUser.user_metadata?.avatar_url
  };
};

// Remove custom session manager - let Supabase handle session persistence natively
// Supabase automatically manages session persistence in localStorage

// Simplified types
interface SessionWarning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

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
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Starting initialization...');
        
        // Check for existing session
        const { data: { session }, error: sessionError } = await auth.getCurrentSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('[Auth] Session check error:', sessionError);
          setError({ message: `Session error: ${sessionError.message}` });
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('[Auth] Found existing session for:', session.user.email);
          const mappedUser = mapSupabaseUserToUser(session.user);
          setUser(mappedUser);
          setSession({ ...session, user: mappedUser });
        } else {
          console.log('[Auth] No existing session found');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('[Auth] Initialization failed:', err);
        if (mounted) {
          setError({ message: 'Authentication initialization failed' });
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener first
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change:', event, session?.user?.email);
      
      if (!mounted) return;
      
      try {
        if (session?.user) {
          const mappedUser = mapSupabaseUserToUser(session.user);
          const mappedSession = { ...session, user: mappedUser };
          setUser(mappedUser);
          setSession(mappedSession);
          setError(null); // Clear any previous errors
        } else {
          setUser(null);
          setSession(null);
          setSessionWarnings([]);
        }
      } catch (err) {
        console.error('[Auth] State change error:', err);
        setError({ message: 'Authentication state update failed' });
      }
    });

    // Initialize after setting up listener
    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: AuthError; requiresMfa?: boolean }> => {
    try {
      console.log('[Auth] Starting sign in for:', credentials.email);
      setLoading(true);
      setError(null);

      const { data, error } = await auth.signInWithPassword(credentials);

      if (error) {
        console.error('[Auth] Sign in error:', error);
        setError(error);
        
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
        console.log('[Auth] Sign in successful for:', data.user.email);
        const mappedUser = mapSupabaseUserToUser(data.user);
        const mappedSession = { ...data.session, user: mappedUser };
        
        setUser(mappedUser);
        setSession(mappedSession);

        toast({
          title: "Login Successful",
          description: `Welcome back, ${mappedUser.name}!`
        });

        return { success: true };
      }

      console.error('[Auth] Sign in failed - no user data received');
      const authError = { message: 'Login failed - no user data received' };
      setError(authError);
      toast({
        title: "Login Failed", 
        description: "Load failed - authentication data not received",
        variant: "destructive"
      });
      return { success: false, error: authError };
    } catch (err) {
      console.error('[Auth] Sign in exception:', err);
      const authError = { message: 'Login failed - load failed' };
      setError(authError);
      toast({
        title: "Login Failed",
        description: "Load failed - connection error",
        variant: "destructive"
      });
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUpUser = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      setLoading(true);
      setError(null);

      const { data: authData, error } = await auth.signUp(data);

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
        const mappedUser = mapSupabaseUserToUser(authData.user);
        
        if (authData.session) {
          const mappedSession = { ...authData.session, user: mappedUser };
          setUser(mappedUser);
          setSession(mappedSession);
          // Session is handled by Supabase automatically
        }

        toast({
          title: "Registration Successful",
          description: authData.session 
            ? `Welcome, ${mappedUser.name}!` 
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
      
      const { error } = await auth.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setUser(null);
      setSession(null);
      setError(null);
      setSessionWarnings([]);

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
  }, [toast]);

  const resetUserPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await auth.resetPassword(email);

      if (error) {
        setError(error);
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

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

      // Simplified password change - just update password
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

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
      const { data: { user } } = await auth.getCurrentUser();
      const { data: { session } } = await auth.getCurrentSession();
      
      if (session && user) {
        const mappedUser = mapSupabaseUserToUser(user);
        const mappedSession = { ...session, user: mappedUser };
        setUser(mappedUser);
        setSession(mappedSession);
      } else {
        setUser(null);
        setSession(null);
        // Session cleared by Supabase automatically
      }
    } catch (err) {
      console.error('Refresh user error:', err);
      setError({ message: 'Failed to refresh user data' });
    }
  }, []);

  const clearSessionWarnings = useCallback(() => {
    setSessionWarnings([]);
  }, []);

  const dismissWarning = useCallback((warningType: string) => {
    setSessionWarnings(prev => prev.filter(warning => warning.type !== warningType));
  }, []);

  const getSessions = useCallback(async (): Promise<any[]> => {
    // Simplified - return empty array for now
    return [];
  }, []);

  const revokeUserSession = useCallback(async (sessionId: string): Promise<{ success: boolean; error?: AuthError }> => {
    // Simplified - just sign out current session
    await signOutUser();
    return { success: true };
  }, [signOutUser]);

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