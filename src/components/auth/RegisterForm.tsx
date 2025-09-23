import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
// Removed heavy server-actions import to prevent module loading issues
// import { validateInviteAction } from '@/lib/server-actions';
import { RegisterData, InviteToken } from '@/types';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['owner', 'backoffice', 'retailer', 'location_user']).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteData, setInviteData] = useState<InviteToken | null>(null);
  const [inviteValidating, setInviteValidating] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { signUp, loading, error, clearError } = useAuth();

  const inviteToken = searchParams.get('token');
  const inviteEmail = searchParams.get('email');

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setError, 
    setValue,
    watch 
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const watchedRole = watch('role');

  // Validate invite token on component mount
  useEffect(() => {
    const validateInvite = async () => {
      if (inviteToken && inviteEmail) {
        setInviteValidating(true);
        setInviteError(null);
        
        try {
          const { success, inviteData: data, error } = await validateInviteAction(inviteToken, inviteEmail);
          
          if (success && data) {
            setInviteData(data);
            setValue('email', data.email);
            setValue('role', data.role);
          } else {
            setInviteError(error || 'Invalid invite token');
          }
        } catch (err) {
          setInviteError('Failed to validate invite token');
        } finally {
          setInviteValidating(false);
        }
      }
    };

    validateInvite();
  }, [inviteToken, inviteEmail, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    
    const registerData: RegisterData = {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || 'location_user',
      invite_token: inviteToken || undefined,
      retailer_id: inviteData?.retailer_id,
      location_id: inviteData?.location_id
    };

    const { success, error: signUpError } = await signUp(registerData);
    
    if (success) {
      onSuccess?.();
    } else if (signUpError) {
      setError('root', { message: signUpError.message });
    }
  };

  const isInviteRegistration = !!inviteToken && !!inviteEmail;

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {isInviteRegistration && <UserCheck className="w-5 h-5 text-green-600" />}
          {isInviteRegistration ? 'Complete Registration' : 'Create Account'}
        </CardTitle>
        <CardDescription>
          {isInviteRegistration 
            ? 'Complete your registration using your invite link'
            : 'Sign up for IV RELIFE Internal System'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inviteValidating && (
          <Alert className="mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <AlertDescription>Validating invite token...</AlertDescription>
          </Alert>
        )}

        {inviteError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{inviteError}</AlertDescription>
          </Alert>
        )}

        {inviteData && (
          <Alert className="mb-4">
            <AlertDescription>
              Welcome! You've been invited to join as a <strong>{inviteData.role}</strong>.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(error || errors.root) && (
            <Alert variant="destructive">
              <AlertDescription>
                {error?.message || errors.root?.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
              disabled={loading || inviteValidating}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
              disabled={loading || inviteValidating || isInviteRegistration}
              readOnly={isInviteRegistration}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {!isInviteRegistration && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                onValueChange={(value) => setValue('role', value as any)}
                disabled={loading || inviteValidating}
              >
                <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location_user">Location User</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="backoffice">Back Office</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                {...register('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                disabled={loading || inviteValidating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || inviteValidating}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                disabled={loading || inviteValidating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading || inviteValidating}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full shadow-elegant"
            disabled={loading || inviteValidating || !!inviteError}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {!isInviteRegistration && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Registration for Owner and Back Office roles requires an invitation. 
              Location Users and Retailers can self-register.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};