import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const ResetPasswordPage: React.FC = () => {
  const handleResetSuccess = () => {
    // Could add additional logic here if needed
    console.log('Password reset email sent successfully');
  };

  return (
    <AuthLayout 
      title="Password Reset"
      subtitle="Reset your account password"
    >
      <ResetPasswordForm onSuccess={handleResetSuccess} />
    </AuthLayout>
  );
};

export default ResetPasswordPage;