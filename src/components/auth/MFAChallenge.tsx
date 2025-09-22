/**
 * MFA Challenge Component
 * 
 * React component for handling MFA verification during login including:
 * - TOTP code verification
 * - SMS/Email code entry
 * - Backup code recovery
 * - Device selection and fallback options
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { createMFAManager, type MFAVerificationResult } from '@/lib/mfa-manager';
import { useToast } from '@/hooks/use-toast';

interface MFAChallengeProps {
  userId: string;
  challengeId: string;
  challengeType: 'totp' | 'sms' | 'email';
  maskedDestination?: string;
  onSuccess: (result: MFAVerificationResult) => void;
  onCancel: () => void;
  onFallback: () => void;
}

export const MFAChallenge: React.FC<MFAChallengeProps> = ({
  userId,
  challengeId,
  challengeType,
  maskedDestination,
  onSuccess,
  onCancel,
  onFallback
}) => {
  const { toast } = useToast();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mfaManager = createMFAManager();

  useEffect(() => {
    // Auto-focus the input
    inputRef.current?.focus();

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Handle resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleTimeout = () => {
    setError('Verification code has expired. Please request a new one.');
    toast({
      title: 'Code Expired',
      description: 'The verification code has expired',
      variant: 'destructive'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await mfaManager.verifyMFAChallenge(challengeId, code.trim());
      
      if (result.success) {
        toast({
          title: 'Verification Successful',
          description: `Verified using ${result.device_used}`,
        });
        onSuccess(result);
      } else {
        setError(result.error?.message || 'Verification failed');
        
        if (result.error?.attempts_remaining !== undefined) {
          setAttemptsRemaining(result.error.attempts_remaining);
          
          if (result.error.attempts_remaining === 0) {
            toast({
              title: 'Maximum Attempts Exceeded',
              description: 'Please try again later or use a backup code',
              variant: 'destructive'
            });
          }
        }
        
        // Clear the input for retry
        setCode('');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendCooldown(60); // 60 second cooldown
      
      // Create a new challenge
      const challenge = await mfaManager.createMFAChallenge(userId, challengeType);
      
      toast({
        title: 'Code Sent',
        description: `A new verification code has been sent to ${maskedDestination}`,
      });
      
      // Reset state
      setCode('');
      setError(null);
      setTimeRemaining(300);
      
    } catch (error) {
      toast({
        title: 'Failed to Send Code',
        description: 'Please try again or use a backup method',
        variant: 'destructive'
      });
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits for verification codes
    const cleanCode = value.replace(/\D/g, '');
    
    if (challengeType === 'totp') {
      setCode(cleanCode.slice(0, 6));
      
      // Auto-submit when 6 digits are entered for TOTP
      if (cleanCode.length === 6 && !loading) {
        setTimeout(() => {
          const form = inputRef.current?.form;
          if (form) {
            form.requestSubmit();
          }
        }, 100);
      }
    } else {
      setCode(cleanCode.slice(0, 8)); // SMS/Email codes can be longer
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMethodIcon = () => {
    switch (challengeType) {
      case 'totp':
        return <Smartphone className="h-5 w-5" />;
      case 'sms':
        return <Smartphone className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getMethodTitle = () => {
    switch (challengeType) {
      case 'totp':
        return 'Enter Authenticator Code';
      case 'sms':
        return 'Enter SMS Code';
      case 'email':
        return 'Enter Email Code';
      default:
        return 'Enter Verification Code';
    }
  };

  const getMethodDescription = () => {
    switch (challengeType) {
      case 'totp':
        return 'Open your authenticator app and enter the 6-digit code';
      case 'sms':
        return `Enter the code sent to ${maskedDestination}`;
      case 'email':
        return `Enter the code sent to ${maskedDestination}`;
      default:
        return 'Enter your verification code';
    }
  };

  if (showBackupCode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Key className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Use Backup Code</CardTitle>
          <CardDescription>
            Enter one of your backup recovery codes to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter backup code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center font-mono tracking-wider"
                autoComplete="off"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Backup codes are case-insensitive
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button type="submit" disabled={!code || loading} className="w-full">
                {loading ? 'Verifying...' : 'Verify Backup Code'}
              </Button>
              
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowBackupCode(false)}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {challengeType.toUpperCase()}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getMethodIcon()}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {getMethodTitle()}
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(timeRemaining)}
          </Badge>
        </CardTitle>
        <CardDescription>{getMethodDescription()}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder={challengeType === 'totp' ? '000000' : '00000000'}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="text-center text-lg tracking-wider font-mono"
              maxLength={challengeType === 'totp' ? 6 : 8}
              autoComplete="one-time-code"
              disabled={loading || timeRemaining === 0}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {challengeType === 'totp' ? '6-digit code' : 'Verification code'}
              </p>
              {attemptsRemaining < 3 && (
                <p className="text-xs text-red-600">
                  {attemptsRemaining} attempts remaining
                </p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              type="submit" 
              disabled={!code || loading || timeRemaining === 0} 
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            {(challengeType === 'sms' || challengeType === 'email') && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="w-full"
              >
                {resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 pt-4 border-t space-y-2">
          <Button
            variant="ghost"
            onClick={() => setShowBackupCode(true)}
            className="w-full text-sm"
            disabled={loading}
          >
            <Key className="h-4 w-4 mr-2" />
            Use Backup Code Instead
          </Button>
          
          <Button
            variant="ghost"
            onClick={onFallback}
            className="w-full text-sm"
            disabled={loading}
          >
            Try Different Method
          </Button>
          
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-sm text-gray-500"
            disabled={loading}
          >
            Cancel Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MFAChallenge;