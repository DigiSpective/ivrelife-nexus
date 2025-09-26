import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMinimalAuth } from '@/components/auth/AuthProviderMinimal';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'backoffice' | 'retailer' | 'location_user')[];
}

export function AuthGuardMinimal({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useMinimalAuth();
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

  // Redirect to login if not authenticated
  if (!user) {
    console.log('[AuthGuard] User not authenticated, redirecting to login');
    const redirectPath = location.pathname + location.search;
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  // Check role-based access (simplified for testing)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.includes(user.role);
    if (!hasAccess) {
      console.log('[AuthGuard] User lacks required role, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('[AuthGuard] Access granted for user:', user.email);
  return <>{children}</>;
}