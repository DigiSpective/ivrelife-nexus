import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, loading, error, clearError } = useAuth();

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setError,
    getValues
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    clearError();
    
    const { success, error: resetError } = await resetPassword(data.email);
    
    if (success) {
      setIsSuccess(true);
      onSuccess?.();
    } else if (resetError) {
      setError('root', { message: resetError.message });
    }
  };

  const handleResend = async () => {
    const email = getValues('email');
    if (email) {
      const { success } = await resetPassword(email);
      if (success) {
        // Show success message or update UI
      }
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent password reset instructions to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <Mail className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={handleResend}
                disabled={loading}
              >
                click here to resend
              </Button>
            </p>
          </div>

          <Button asChild className="w-full">
            <Link to="/auth/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader className="text-center">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(error || errors.root) && (
            <Alert variant="destructive">
              <AlertDescription>
                {error?.message || errors.root?.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
              disabled={loading}
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full shadow-elegant"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="link" asChild>
            <Link to="/auth/login" className="text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> If you don't receive an email within a few minutes, 
            please check your spam folder or contact support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};