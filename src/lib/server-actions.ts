// Server actions for auth operations
// Since this is a Vite React app, these are actually client-side functions
// that interact with Supabase directly

import { 
  signInWithPassword, 
  signUp, 
  signOut, 
  resetPassword, 
  createInviteToken, 
  validateInviteToken,
  getCurrentUser
} from './supabase-auth';
import { 
  logLogin, 
  logLogout, 
  logRegistration, 
  logPasswordReset, 
  logInviteAccepted,
  queueWelcomeEmail,
  queuePasswordResetEmail,
  queueInviteEmail 
} from './audit-logger';
import { LoginCredentials, RegisterData, InviteToken, AuthError } from '@/types';

// Login action
export const loginAction = async (credentials: LoginCredentials) => {
  try {
    const { data, error } = await signInWithPassword(credentials);
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user && data.session) {
      // Log successful login
      await logLogin(data.user.id, data.user.email);
      
      return { 
        success: true, 
        user: data.user, 
        session: data.session,
        redirectTo: getRoleBasedRedirect(data.user.role)
      };
    }

    return { success: false, error: 'Login failed' };
  } catch (err) {
    console.error('Login action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Register action
export const registerAction = async (registerData: RegisterData) => {
  try {
    const { data, error } = await signUp(registerData);
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Log successful registration
      await logRegistration(data.user.id, data.user.email, data.user.role, !!registerData.invite_token);
      
      // Queue welcome email
      await queueWelcomeEmail(data.user.id, data.user.email, data.user.name);
      
      return { 
        success: true, 
        user: data.user, 
        session: data.session,
        redirectTo: data.session ? getRoleBasedRedirect(data.user.role) : '/auth/verify-email'
      };
    }

    return { success: false, error: 'Registration failed' };
  } catch (err) {
    console.error('Register action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Logout action
export const logoutAction = async (userId?: string) => {
  try {
    const { error } = await signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    // Log successful logout
    if (userId) {
      await logLogout(userId);
    }

    return { success: true, redirectTo: '/auth/login' };
  } catch (err) {
    console.error('Logout action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Password reset action
export const resetPasswordAction = async (email: string) => {
  try {
    const { error } = await resetPassword(email);
    
    if (error) {
      return { success: false, error: error.message };
    }

    // Log password reset request
    await logPasswordReset(email);
    
    return { success: true, message: 'Password reset email sent' };
  } catch (err) {
    console.error('Password reset action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Create invite token action
export const createInviteAction = async (
  email: string,
  role: 'owner' | 'backoffice' | 'retailer' | 'location_user',
  createdBy: string,
  retailerId?: string,
  locationId?: string
) => {
  try {
    const { data, error } = await createInviteToken({
      email,
      role,
      retailer_id: retailerId,
      location_id: locationId,
      created_by: createdBy
    });
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (data) {
      // Queue invite email
      await queueInviteEmail(email, data.id, 'System Admin', role);
      
      return { success: true, inviteToken: data };
    }

    return { success: false, error: 'Failed to create invite' };
  } catch (err) {
    console.error('Create invite action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Validate invite token action
export const validateInviteAction = async (tokenId: string, email: string) => {
  try {
    const { data, error } = await validateInviteToken(tokenId, email);
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, inviteData: data };
  } catch (err) {
    console.error('Validate invite action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Register with invite action
export const registerWithInviteAction = async (
  tokenId: string,
  email: string,
  password: string,
  name: string
) => {
  try {
    // First validate the invite
    const { success: validateSuccess, inviteData, error: validateError } = await validateInviteAction(tokenId, email);
    
    if (!validateSuccess || !inviteData) {
      return { success: false, error: validateError || 'Invalid invite token' };
    }

    // Register with invite data
    const registerData: RegisterData = {
      email,
      password,
      name,
      role: inviteData.role,
      retailer_id: inviteData.retailer_id,
      location_id: inviteData.location_id,
      invite_token: tokenId
    };

    const result = await registerAction(registerData);
    
    if (result.success && result.user) {
      // Log invite acceptance
      await logInviteAccepted(result.user.id, email, tokenId);
    }

    return result;
  } catch (err) {
    console.error('Register with invite action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Helper function for role-based redirects
const getRoleBasedRedirect = (role: string): string => {
  // All roles redirect to the unified dashboard
  // Role-based access control is handled within the dashboard and individual components
  return '/dashboard';
};

// Session verification action
export const verifySessionAction = async () => {
  try {
    const { data: { user }, error } = await getCurrentUser();
    
    if (error || !user) {
      return { success: false, error: 'No valid session' };
    }

    return { 
      success: true, 
      user, 
      redirectTo: getRoleBasedRedirect(user.role) 
    };
  } catch (err) {
    console.error('Session verification error:', err);
    return { success: false, error: 'Session verification failed' };
  }
};

// Change password action (for authenticated users)
export const changePasswordAction = async (
  currentPassword: string,
  newPassword: string,
  userId: string
) => {
  try {
    // This would need to be implemented with proper Supabase auth methods
    // For now, we'll return a placeholder
    console.log('Change password not implemented yet');
    
    return { success: false, error: 'Password change not implemented' };
  } catch (err) {
    console.error('Change password action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Update profile action
export const updateProfileAction = async (
  userId: string,
  updates: { name?: string; email?: string }
) => {
  try {
    // This would need to be implemented with proper Supabase operations
    console.log('Profile update not implemented yet');
    
    return { success: false, error: 'Profile update not implemented' };
  } catch (err) {
    console.error('Update profile action error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};