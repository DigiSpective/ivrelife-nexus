import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, AuthSession, AuthError, LoginCredentials, RegisterData } from '@/types';
import { createSupabaseClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

// Create single Supabase client instance
const supabase = createSupabaseClient();

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

// Auth Context Type
interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionWarnings] = useState<any[]>([]);
  const { toast } = useToast();

  // Initialize authentication
  useEffect(() => {
    console.log('[Auth] Initializing Supabase authentication...');
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          setError({ message: sessionError.message });
        } else if (session?.user) {
          console.log('[Auth] Found existing session:', session.user.email);
          const mappedUser = mapUser(session.user);
          setUser(mappedUser);
          setSession({ ...session, user: mappedUser });
          setError(null);
        } else {
          console.log('[Auth] No existing session');
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
        if (mounted) {
          setError({ message: 'Authentication initialization failed' });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state change:', event, session?.user?.email);
      
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
    });

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    try {
      console.log('[Auth] Attempting login:', credentials.email);
      setLoading(true);
      setError(null);

      const { data, error: authError } = await supabase.auth.signInWithPassword(credentials);

      if (authError) {
        console.error('[Auth] Login error:', authError);
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
        console.log('[Auth] Login successful:', data.user.email);
        const mappedUser = mapUser(data.user);
        setUser(mappedUser);
        setSession({ ...data.session, user: mappedUser });
        
        toast({ 
          title: "Login Successful", 
          description: `Welcome back, ${mappedUser.name}!` 
        });
        
        return { success: true };
      }

      const error = { message: 'Login failed - no user data received' };
      setError(error);
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      return { success: false, error };

    } catch (err) {
      console.error('[Auth] Login exception:', err);
      const error = { message: 'Login failed - unexpected error' };
      setError(error);
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUp = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

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

      toast({ 
        title: "Registration Successful", 
        description: authData.session ? "Welcome!" : "Please check your email to verify your account." 
      });

      return { success: true };
    } catch (err) {
      const error = { message: 'Registration failed - unexpected error' };
      setError(error);
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setError(null);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
      toast({ title: "Sign Out Error", description: "An error occurred during sign out", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

      if (resetError) {
        setError(resetError);
        toast({ title: "Password Reset Failed", description: resetError.message, variant: "destructive" });
        return { success: false, error: resetError };
      }

      toast({ 
        title: "Password Reset Sent", 
        description: "Please check your email for password reset instructions." 
      });
      return { success: true };
    } catch (err) {
      const error = { message: 'Password reset failed - unexpected error' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError(updateError);
        toast({ title: "Password Change Failed", description: updateError.message, variant: "destructive" });
        return { success: false, error: updateError };
      }

      toast({ 
        title: "Password Changed", 
        description: "Your password has been successfully updated." 
      });
      return { success: true };
    } catch (err) {
      const error = { message: 'Password change failed - unexpected error' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearError = useCallback(() => setError(null), []);
  
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[Auth] Refresh user error:', error);
        return;
      }
      
      if (user) {
        const mappedUser = mapUser(user);
        setUser(mappedUser);
      }
    } catch (err) {
      console.error('[Auth] Refresh user exception:', err);
    }
  }, []);

  const clearSessionWarnings = useCallback(() => {}, []);
  const dismissWarning = useCallback(() => {}, []);
  const getSessions = useCallback(async () => [], []);
  const revokeSession = useCallback(async () => ({ success: true }), []);

  const contextValue: AuthContextType = {
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
    revokeSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};