import React, { useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSessionWarning } from '@/hooks/useSessionActivity';
import { useAuth } from '@/hooks/useAuth';

interface SessionWarningProps {
  warningThresholdMinutes?: number;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({ 
  warningThresholdMinutes = 5 
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { showWarning, timeUntilExpiry, timeUntilActivityTimeout } = useSessionWarning(warningThresholdMinutes);
  const { refreshUser } = useAuth();

  if (!showWarning || dismissed) {
    return null;
  }

  const isSessionExpiring = timeUntilExpiry > 0 && timeUntilExpiry <= (warningThresholdMinutes * 60 * 1000);
  const isActivityExpiring = timeUntilActivityTimeout > 0 && timeUntilActivityTimeout <= (warningThresholdMinutes * 60 * 1000);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.ceil(milliseconds / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const handleExtendSession = async () => {
    try {
      await refreshUser();
      setDismissed(true);
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  return (
    <Alert variant="destructive" className="fixed top-4 right-4 w-96 z-50 shadow-lg">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="pr-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium mb-1">Session Warning</p>
            {isSessionExpiring && (
              <p className="text-sm">
                Your session will expire in {formatTime(timeUntilExpiry)}.
              </p>
            )}
            {isActivityExpiring && (
              <p className="text-sm">
                You'll be signed out due to inactivity in {formatTime(timeUntilActivityTimeout)}.
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleExtendSession}
                className="bg-background"
              >
                <Clock className="w-3 h-3 mr-1" />
                Extend Session
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setDismissed(true)}
                className="text-destructive-foreground hover:bg-destructive/10"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive-foreground hover:bg-destructive/10"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};