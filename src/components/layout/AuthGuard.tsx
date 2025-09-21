import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStatus, useRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'backoffice' | 'retailer' | 'location_user')[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isUnauthenticated, isLoading, user } = useAuthStatus();
  const { hasAnyRole } = useRole();
  const location = useLocation();

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (isUnauthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // If no specific roles are required, allow access for any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has any of the allowed roles
  if (user && hasAnyRole(allowedRoles)) {
    return <>{children}</>;
  }

  // Redirect to dashboard if user doesn't have required roles
  return <Navigate to="/dashboard" replace />;
}

export default AuthGuard;