import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Loader2 } from 'lucide-react';

export const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut();
        // Redirect to login page after successful logout
        navigate('/auth/login', { replace: true });
      } catch (error) {
        // If logout fails, still redirect to login
        console.error('Logout error:', error);
        navigate('/auth/login', { replace: true });
      }
    };

    performLogout();
  }, [signOut, navigate]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Signing you out...</p>
      </div>
    </AuthLayout>
  );
};

export default LogoutPage;