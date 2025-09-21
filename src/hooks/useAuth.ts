import { useCallback } from 'react';
import { User } from '@/types';
import { getRoleBasedRedirect } from '@/lib/supabase-auth';
import { useAuth as useAuthContext } from '@/components/auth/AuthProvider';

// Re-export the main auth hook and provider from the component
export { useAuth, AuthProvider } from '@/components/auth/AuthProvider';

// Legacy hook for compatibility
export const useCurrentUser = () => {
  const { user, loading, error } = useAuthContext();
  return { data: user, loading, error };
};

// Hook for role-based access control
export const useRole = () => {
  const { user } = useAuthContext();
  
  const hasRole = useCallback((requiredRole: User['role']): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true; // Owner has access to everything
    return user.role === requiredRole;
  }, [user]);

  const hasAnyRole = useCallback((allowedRoles: User['role'][]): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true; // Owner has access to everything
    return allowedRoles.includes(user.role);
  }, [user]);

  const canAccessRetailer = useCallback((retailerId: string): boolean => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'backoffice') return true;
    return user.role === 'retailer' && user.retailer_id === retailerId;
  }, [user]);

  const canAccessLocation = useCallback((locationId: string): boolean => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'backoffice') return true;
    if (user.role === 'retailer' && user.retailer_id) return true;
    return user.role === 'location_user' && user.location_id === locationId;
  }, [user]);

  const getRoleRedirect = useCallback((): string => {
    if (!user) return '/auth/login';
    return getRoleBasedRedirect(user.role);
  }, [user]);

  return {
    user,
    hasRole,
    hasAnyRole,
    canAccessRetailer,
    canAccessLocation,
    getRoleRedirect
  };
};

// Hook for checking authentication status
export const useAuthStatus = () => {
  const { user, loading } = useAuthContext();
  
  const isAuthenticated = !!user;
  const isUnauthenticated = !user && !loading;
  
  return {
    isAuthenticated,
    isUnauthenticated,
    isLoading: loading,
    user
  };
};