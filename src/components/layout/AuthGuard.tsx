import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, hasAnyRole } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'backoffice' | 'retailer' | 'location')[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  // Mock authentication - replace with actual Supabase auth
  const user = getCurrentUser();
  const isAuthenticated = true; // Mock auth state
  const location = useLocation();

  console.log('AuthGuard - User:', user);
  console.log('AuthGuard - IsAuthenticated:', isAuthenticated);
  console.log('AuthGuard - AllowedRoles:', allowedRoles);

  if (!isAuthenticated) {
    console.log('AuthGuard - Redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If no specific roles are required, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    console.log('AuthGuard - No roles required, allowing access');
    return <>{children}</>;
  }

  // Check if user has any of the allowed roles
  if (hasAnyRole(user, allowedRoles)) {
    console.log('AuthGuard - User has required roles, allowing access');
    return <>{children}</>;
  }

  // Redirect to dashboard if user doesn't have required roles
  console.log('AuthGuard - User does not have required roles, redirecting to dashboard');
  return <Navigate to="/dashboard" replace />;
}