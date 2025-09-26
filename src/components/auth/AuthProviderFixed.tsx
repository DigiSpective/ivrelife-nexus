import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, AuthSession, AuthError, LoginCredentials, RegisterData } from '@/types';
import { createSupabaseClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

// Fixed Auth Context Type
interface FixedAuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  sessionWarnings: any[];
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

const FixedAuthContext = createContext<FixedAuthContextType | undefined>(undefined);

// Lazy Supabase client creation to prevent module-level blocking
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    console.log('[AuthFixed] Creating Supabase client...');
    supabaseInstance = createSupabaseClient();
    console.log('[AuthFixed] Supabase client created successfully');
  }
  return supabaseInstance;
};

// Convert Supabase user to our User type
const mapUser = (supabaseUser: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email,
  name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
  role: 'owner',
  retailer_id: null,
  location_id: null,
  avatar: supabaseUser.user_metadata?.avatar_url
});

export const AuthProviderFixed: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionWarnings] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Simplified initialization with timeout protection
  useEffect(() => {
    console.log('[AuthFixed] Starting initialization...');
    let mounted = true;
    let authStateSubscription: any;

    const initAuth = async () => {
      try {
        // Add a small delay to prevent blocking the main thread
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted) return;

        const supabase = getSupabase();
        
        // Set up auth state listener first (more reliable than getSession)
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[AuthFixed] Auth state change:', event, session?.user?.email);
          
          if (!mounted) return;

          if (session?.user) {
            const mappedUser = mapUser(session.user);
            setUser(mappedUser);
            setSession({ ...session, user: mappedUser });
            setError(null);
          } else {
            setUser(null);
            setSession(null);
          }
          
          // Mark as initialized after first auth state change
          if (!isInitialized) {
            setIsInitialized(true);
            setLoading(false);
          }
        });
        
        authStateSubscription = data.subscription;

        // Get current session (but don't rely solely on it)
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (mounted && currentSession?.user) {
            console.log('[AuthFixed] Found existing session:', currentSession.user.email);
            const mappedUser = mapUser(currentSession.user);
            setUser(mappedUser);
            setSession({ ...currentSession, user: mappedUser });
            setError(null);
          }
        } catch (sessionError) {
          console.warn('[AuthFixed] Session check failed:', sessionError);
          // Don't fail initialization if session check fails
        }

        // Ensure loading is set to false after initialization
        setTimeout(() => {
          if (mounted && !isInitialized) {
            console.log('[AuthFixed] Initialization timeout, setting loading to false');
            setIsInitialized(true);
            setLoading(false);
          }
        }, 3000);

      } catch (err) {
        console.error('[AuthFixed] Init error:', err);
        if (mounted) {
          setError({ message: 'Authentication initialization failed' });
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
    };
  }, [isInitialized]);

  // Memoized auth functions to prevent re-renders
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    try {
      console.log('[AuthFixed] Attempting login:', credentials.email);
      setLoading(true);
      setError(null);

      const supabase = getSupabase();
      
      // Add timeout protection
      const signInPromise = supabase.auth.signInWithPassword(credentials);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout')), 15000)
      );

      const { data, error: authError } = await Promise.race([
        signInPromise, 
        timeoutPromise
      ]) as any;

      if (authError) {
        console.error('[AuthFixed] Login error:', authError);
        setError(authError);
        
        let errorMessage = authError.message;
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        }
        
        toast({ 
          title: "Login Failed", 
          description: errorMessage, 
          variant: "destructive" 
        });
        return { success: false, error: authError };
      }

      if (data.user && data.session) {
        console.log('[AuthFixed] Login successful:', data.user.email);
        // Don't set user/session here, let onAuthStateChange handle it
        
        toast({ 
          title: "Login Successful", 
          description: `Welcome back!` 
        });
        
        return { success: true };
      }

      return { success: false, error: { message: 'Login failed' } };
    } catch (err: any) {
      console.error('[AuthFixed] Sign in error:', err);
      const errorMessage = err.message || 'Login failed';
      setError({ message: errorMessage });
      toast({ 
        title: "Login Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
      return { success: false, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUp = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } }
      });

      if (authError) {
        setError(authError);
        toast({ title: "Registration Failed", description: authError.message, variant: "destructive" });
        return { success: false, error: authError };
      }

      if (authData.user) {
        toast({ title: "Registration Successful", description: "Please check your email to verify your account." });
        return { success: true };
      }

      return { success: false, error: { message: 'Registration failed' } };
    } catch (err: any) {
      setError({ message: err.message });
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      await supabase.auth.signOut();
      // Don't set user/session here, let onAuthStateChange handle it
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (err: any) {
      console.error('[AuthFixed] Sign out error:', err);
      setError({ message: err.message });
      toast({ title: "Sign Out Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

      if (resetError) {
        setError(resetError);
        toast({ title: "Password Reset Failed", description: resetError.message, variant: "destructive" });
        return { success: false, error: resetError };
      }

      toast({ title: "Password Reset Sent", description: "Please check your email for password reset instructions." });
      return { success: true };
    } catch (err: any) {
      setError({ message: err.message });
      toast({ title: "Password Reset Failed", description: err.message, variant: "destructive" });
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError(updateError);
        toast({ title: "Password Change Failed", description: updateError.message, variant: "destructive" });
        return { success: false, error: updateError };
      }

      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
      return { success: true };
    } catch (err: any) {
      setError({ message: err.message });
      toast({ title: "Password Change Failed", description: err.message, variant: "destructive" });
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Other methods (simplified)
  const clearError = useCallback(() => setError(null), []);
  
  const refreshUser = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[AuthFixed] Refresh user error:', error);
        return;
      }
      
      if (user) {
        const mappedUser = mapUser(user);
        setUser(mappedUser);
      }
    } catch (err) {
      console.error('[AuthFixed] Refresh user failed:', err);
    }
  }, []);

  const clearSessionWarnings = useCallback(() => {
    // Implementation for session warnings if needed
  }, []);

  const dismissWarning = useCallback((warningType: string) => {
    // Implementation for dismissing warnings if needed
  }, []);

  const getSessions = useCallback(async () => {
    // Implementation for getting sessions if needed
    return [];
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    // Implementation for revoking sessions if needed
    return { success: true };
  }, []);

  const contextValue: FixedAuthContextType = {
    user,
    session,
    loading,
    error,
    sessionWarnings,
    signIn,
    signUp,
    signOut,
    resetPassword,
    changePassword,
    clearError,
    refreshUser,
    clearSessionWarnings,
    dismissWarning,
    getSessions,
    revokeSession
  };

  return (
    <FixedAuthContext.Provider value={contextValue}>
      {children}
    </FixedAuthContext.Provider>
  );
};

export const useAuthFixed = () => {
  const context = useContext(FixedAuthContext);
  if (!context) {
    throw new Error('useAuthFixed must be used within an AuthProviderFixed');
  }
  return context;
};