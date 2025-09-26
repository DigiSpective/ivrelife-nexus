import React, { ReactNode } from 'react';
import { useAuthBypass } from './AuthProviderBypass';
import { mockUser } from '@/lib/mock-data';

interface AuthGuardBypassProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export const AuthGuardBypass: React.FC<AuthGuardBypassProps> = ({ 
  children, 
  allowedRoles = ['owner', 'backoffice', 'retailer', 'location'] 
}) => {
  const { user, loading } = useAuthBypass();

  console.log('🛡️ AuthGuardBypass - user:', user?.email, 'role:', user?.role);

  // For emergency restoration, always allow access with mockUser
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Use mockUser as authenticated user for emergency restoration
  const currentUser = user || mockUser;
  
  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    console.log('🚫 AuthGuardBypass - Access denied for role:', currentUser.role, 'Required:', allowedRoles);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <p className="text-sm text-muted-foreground mt-2">Required roles: {allowedRoles.join(', ')}</p>
          <p className="text-sm text-muted-foreground">Your role: {currentUser.role}</p>
        </div>
      </div>
    );
  }

  console.log('✅ AuthGuardBypass - Access granted for role:', currentUser.role);
  return <>{children}</>;
};