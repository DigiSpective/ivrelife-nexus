import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthFixed } from '@/components/auth/AuthProviderFixed';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'backoffice' | 'retailer' | 'location_user')[];
}

export function AuthGuardFixed({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading, error } = useAuthFixed();
  const location = useLocation();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an authentication error
  if (error) {
    console.warn('[AuthGuardFixed] Authentication error:', error.message);
    // Still try to redirect to login rather than showing error
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('[AuthGuardFixed] User not authenticated, redirecting to login');
    const redirectPath = location.pathname + location.search;
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.includes(user.role);
    if (!hasAccess) {
      console.log('[AuthGuardFixed] User lacks required role, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('[AuthGuardFixed] Access granted for user:', user.email);
  return <>{children}</>;
}