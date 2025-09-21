import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStatus, useRole } from '@/hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStatus();
  const { getRoleRedirect } = useRole();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname || getRoleRedirect();
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.state, getRoleRedirect]);

  const handleLoginSuccess = () => {
    const from = location.state?.from?.pathname || getRoleRedirect();
    navigate(from, { replace: true });
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthLayout>
  );
};

export default LoginPage;