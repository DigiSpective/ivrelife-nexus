import { createClient, SupabaseClient, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { User, AuthSession, AuthError, LoginCredentials, RegisterData, InviteToken } from '@/types';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
// Note: We're checking for non-empty values rather than specific placeholder values
const hasValidCredentials = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.length > 10 && supabaseAnonKey.length > 50);

// Create Supabase client
export const supabase: SupabaseClient = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : {
      // Mock client for development without Supabase credentials
      auth: {
        signInWithPassword: () => Promise.resolve({ 
          data: { user: null, session: null }, 
          error: { message: 'Supabase not configured' } as SupabaseAuthError 
        }),
        signUp: () => Promise.resolve({ 
          data: { user: null, session: null }, 
          error: { message: 'Supabase not configured' } as SupabaseAuthError 
        }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.resolve({ 
          data: {}, 
          error: { message: 'Supabase not configured' } as SupabaseAuthError 
        }),
        getUser: () => Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Supabase not configured' } as SupabaseAuthError 
        }),
        getSession: () => Promise.resolve({ 
          data: { session: null }, 
          error: { message: 'Supabase not configured' } as SupabaseAuthError 
        }),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null })
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) })
      })
    } as any;

// Authentication Functions

export const signInWithPassword = async (credentials: LoginCredentials): Promise<{
  data: { user: User | null; session: AuthSession | null };
  error: AuthError | null;
}> => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock authentication.');
    // Mock successful login for demo
    if (credentials.email === 'admin@iv-relife.com' && credentials.password === 'admin123') {
      const mockUser: User = {
        id: 'mock-user-id',
        email: credentials.email,
        name: 'Admin User',
        role: 'owner'
      };
      const mockSession: AuthSession = {
        user: mockUser,
        access_token: 'mock-token',
        expires_at: Date.now() + 3600000 // 1 hour
      };
      return { data: { user: mockUser, session: mockSession }, error: null };
    }
    return { 
      data: { user: null, session: null }, 
      error: { message: 'Invalid credentials' } 
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      return { data: { user: null, session: null }, error: { message: error.message } };
    }

    if (!data.user || !data.session) {
      return { data: { user: null, session: null }, error: { message: 'Authentication failed' } };
    }

    // Get additional user data from users table, or create if doesn't exist
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, retailer_id, location_id')
      .eq('id', data.user.id)
      .single();

    // If user doesn't exist in users table, create it (migration)
    if (userError && userError.code === 'PGRST116') {
      console.log('User not found in users table, creating record for:', data.user.email);
      
      // Import migration utility dynamically to avoid circular imports
      const { UserMigration, EXISTING_USERS } = await import('./user-migration');
      
      // Determine role based on email or default to owner for existing users
      const existingUserInfo = EXISTING_USERS[data.user.email || ''];
      const defaultRole = existingUserInfo?.role || 'owner';
      const defaultName = existingUserInfo?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
      
      const migrationResult = await UserMigration.createUserRecord(
        data.user, 
        defaultRole,
        undefined, // retailer_id
        undefined  // location_id
      );
      
      if (migrationResult.success && migrationResult.user) {
        userData = migrationResult.user as typeof userData;
        console.log('Successfully created user record for:', data.user.email);
      } else {
        console.error('Failed to create user record:', migrationResult.error);
        return { data: { user: null, session: null }, error: { message: migrationResult.error || 'Failed to create user record' } };
      }
    } else if (userError) {
      console.error('Error fetching user data:', userError);
      return { data: { user: null, session: null }, error: { message: 'Failed to fetch user data' } };
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name || data.user.email || '',
      role: userData.role,
      retailer_id: userData.retailer_id,
      location_id: userData.location_id,
      avatar: data.user.user_metadata?.avatar_url
    };

    const session: AuthSession = {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at || 0
    };

    return { data: { user, session }, error: null };
  } catch (err) {
    console.error('Sign in error:', err);
    return { 
      data: { user: null, session: null }, 
      error: { message: 'An unexpected error occurred during sign in' } 
    };
  }
};

export const signUp = async (registerData: RegisterData): Promise<{
  data: { user: User | null; session: AuthSession | null };
  error: AuthError | null;
}> => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Mock registration not implemented.');
    return { 
      data: { user: null, session: null }, 
      error: { message: 'Registration not available in demo mode' } 
    };
  }

  try {
    // Validate invite token if provided
    if (registerData.invite_token) {
      const { data: inviteData, error: inviteError } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('id', registerData.invite_token)
        .eq('email', registerData.email)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !inviteData) {
        return { 
          data: { user: null, session: null }, 
          error: { message: 'Invalid or expired invite token' } 
        };
      }

      // Update role and associations from invite
      registerData.role = inviteData.role;
      registerData.retailer_id = inviteData.retailer_id;
      registerData.location_id = inviteData.location_id;
    }

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        data: {
          name: registerData.name,
          role: registerData.role
        }
      }
    });

    if (error) {
      return { data: { user: null, session: null }, error: { message: error.message } };
    }

    if (!data.user) {
      return { data: { user: null, session: null }, error: { message: 'User creation failed' } };
    }

    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: registerData.email,
        name: registerData.name,
        role: registerData.role,
        retailer_id: registerData.retailer_id,
        location_id: registerData.location_id
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      // Clean up auth user if user record creation fails
      await supabase.auth.admin.deleteUser(data.user.id);
      return { data: { user: null, session: null }, error: { message: 'Failed to create user profile' } };
    }

    // Mark invite token as used if applicable
    if (registerData.invite_token) {
      await supabase
        .from('invite_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', registerData.invite_token);
    }

    const user: User = {
      id: data.user.id,
      email: registerData.email,
      name: registerData.name,
      role: registerData.role,
      retailer_id: registerData.retailer_id,
      location_id: registerData.location_id
    };

    const session: AuthSession | null = data.session ? {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at || 0
    } : null;

    return { data: { user, session }, error: null };
  } catch (err) {
    console.error('Sign up error:', err);
    return { 
      data: { user: null, session: null }, 
      error: { message: 'An unexpected error occurred during registration' } 
    };
  }
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (err) {
    console.error('Sign out error:', err);
    return { error: { message: 'An unexpected error occurred during sign out' } };
  }
};

export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return { error: { message: 'Password reset not available in demo mode' } };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err) {
    console.error('Password reset error:', err);
    return { error: { message: 'An unexpected error occurred during password reset' } };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning null user.');
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get additional user data from users table, or create if doesn't exist
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, retailer_id, location_id')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in users table, create it (migration)
    if (userError && userError.code === 'PGRST116') {
      console.log('User not found in users table during getCurrentUser, creating record for:', user.email);
      
      // Import migration utility dynamically to avoid circular imports
      const { UserMigration, EXISTING_USERS } = await import('./user-migration');
      
      // Determine role based on email or default to owner for existing users
      const existingUserInfo = EXISTING_USERS[user.email || ''];
      const defaultRole = existingUserInfo?.role || 'owner';
      
      const migrationResult = await UserMigration.createUserRecord(
        user, 
        defaultRole,
        undefined, // retailer_id
        undefined  // location_id
      );
      
      if (migrationResult.success && migrationResult.user) {
        userData = migrationResult.user as typeof userData;
        console.log('Successfully created user record during getCurrentUser for:', user.email);
      } else {
        console.error('Failed to create user record during getCurrentUser:', migrationResult.error);
        return null;
      }
    } else if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name || user.email || '',
      role: userData.role,
      retailer_id: userData.retailer_id,
      location_id: userData.location_id,
      avatar: user.user_metadata?.avatar_url
    };
  } catch (err) {
    console.error('Get current user error:', err);
    return null;
  }
};

export const getCurrentSession = async (): Promise<AuthSession | null> => {
  if (!hasValidCredentials) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    return {
      user,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || 0
    };
  } catch (err) {
    console.error('Get current session error:', err);
    return null;
  }
};

// Invite Token Functions

export const createInviteToken = async (invite: Omit<InviteToken, 'id' | 'created_at'>): Promise<{
  data: InviteToken | null;
  error: AuthError | null;
}> => {
  if (!hasValidCredentials) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data, error } = await supabase
      .from('invite_tokens')
      .insert({
        ...invite,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Create invite token error:', err);
    return { data: null, error: { message: 'Failed to create invite token' } };
  }
};

export const validateInviteToken = async (tokenId: string, email: string): Promise<{
  data: InviteToken | null;
  error: AuthError | null;
}> => {
  if (!hasValidCredentials) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('id', tokenId)
      .eq('email', email)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error) {
      return { data: null, error: { message: 'Invalid or expired invite token' } };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Validate invite token error:', err);
    return { data: null, error: { message: 'Failed to validate invite token' } };
  }
};

// Role-based redirect logic
export const getRoleBasedRedirect = (role: User['role']): string => {
  // All roles redirect to the unified dashboard
  // Role-based access control is handled within the dashboard and individual components
  return '/dashboard';
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!hasValidCredentials) {
    return { data: { subscription: null }, error: null };
  }

  return supabase.auth.onAuthStateChange(async (event, session) => {
    
    if (event === 'SIGNED_OUT') {
      callback(null);
      return;
    }
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session) {
        const user = await getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
      return;
    }
    
    // For INITIAL_SESSION or other events
    if (session) {
      const user = await getCurrentUser();
      callback(user);
    } else if (event === 'INITIAL_SESSION') {
      // For initial session with no session, call callback with null
      // This ensures the loading state is cleared
      callback(null);
    }
    // For other events with no session, don't call callback(null)
    // This prevents premature sign-outs during authentication flow
  });
};