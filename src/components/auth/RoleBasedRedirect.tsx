import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface RoleBasedRedirectProps {
  children?: React.ReactNode;
}

export const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getRoleRedirect } = useRole();

  useEffect(() => {
    if (user && location.pathname === '/dashboard') {
      // Only redirect if on the generic dashboard path
      const roleBasedPath = getRoleRedirect();
      if (roleBasedPath !== '/dashboard') {
        navigate(roleBasedPath, { replace: true });
      }
    }
  }, [user, location.pathname, navigate, getRoleRedirect]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};