import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuthStatus, useRole } from '@/hooks/useAuth';

export const RegisterPage: React.FC = () => {
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

  const handleRegisterSuccess = () => {
    // After successful registration, redirect based on role
    const redirectTo = getRoleRedirect();
    navigate(redirectTo, { replace: true });
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
    <AuthLayout 
      title="Join IV RELIFE"
      subtitle="Create your account"
    >
      <RegisterForm onSuccess={handleRegisterSuccess} />
    </AuthLayout>
  );
};

export default RegisterPage;