import { useEffect, useCallback, useState } from 'react';
import { SessionManager } from '@/lib/session-manager';
import { useAuth } from '@/hooks/useAuth';

interface SessionActivityState {
  timeUntilExpiry: number;
  timeUntilActivityTimeout: number;
  isSessionExpired: boolean;
  isActivityExpired: boolean;
}

export const useSessionActivity = () => {
  const { signOut, user, loading } = useAuth();
  const [activityState, setActivityState] = useState<SessionActivityState>({
    timeUntilExpiry: 0,
    timeUntilActivityTimeout: 0,
    isSessionExpired: false,
    isActivityExpired: false
  });

  // Handle session expiration
  const handleSessionExpired = useCallback(async () => {
    console.log('Session expired, signing out...');
    await signOut();
  }, [signOut]);

  // Update activity state
  const updateActivityState = useCallback(() => {
    const timeUntilExpiry = SessionManager.getTimeUntilExpiry();
    const timeUntilActivityTimeout = SessionManager.getTimeUntilActivityTimeout();
    
    setActivityState({
      timeUntilExpiry,
      timeUntilActivityTimeout,
      isSessionExpired: timeUntilExpiry <= 0,
      isActivityExpired: timeUntilActivityTimeout <= 0
    });

    // Auto-signout if expired, but only if we're not in the middle of authentication
    // and we have a user (meaning we're in an authenticated state)
    if (!loading && user && !SessionManager.isValidationDisabled()) {
      // Check for session expiration - only sign out if we have a negative time (truly expired)
      if (timeUntilExpiry < 0) {
        console.log('Session expired, signing out...');
        handleSessionExpired();
      }
      // Check for activity timeout - only if we had valid activity tracking
      else if (timeUntilActivityTimeout <= 0 && SessionManager.getSession() !== null) {
        console.log('Activity timeout, signing out...');
        handleSessionExpired();
      }
    }
  }, [handleSessionExpired, loading, user]);

  // Initialize session monitoring
  useEffect(() => {
    // Set up activity tracking
    const cleanupActivity = SessionManager.initActivityTracking();
    
    // Set up session monitoring
    const cleanupSessionMonitoring = SessionManager.startSessionMonitoring(handleSessionExpired);
    
    // Update state immediately and then every minute
    updateActivityState();
    const stateUpdateInterval = setInterval(updateActivityState, 60 * 1000);

    return () => {
      cleanupActivity();
      cleanupSessionMonitoring();
      clearInterval(stateUpdateInterval);
    };
  }, [handleSessionExpired, updateActivityState]);

  // Manually refresh session
  const refreshSession = useCallback((newExpiresAt: number) => {
    return SessionManager.refreshSession(newExpiresAt);
  }, []);

  // Get formatted time strings
  const getFormattedTimeUntilExpiry = useCallback(() => {
    const minutes = Math.floor(activityState.timeUntilExpiry / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }, [activityState.timeUntilExpiry]);

  const getFormattedTimeUntilActivityTimeout = useCallback(() => {
    const minutes = Math.floor(activityState.timeUntilActivityTimeout / (1000 * 60));
    return `${minutes}m`;
  }, [activityState.timeUntilActivityTimeout]);

  return {
    ...activityState,
    refreshSession,
    getFormattedTimeUntilExpiry,
    getFormattedTimeUntilActivityTimeout,
    updateActivity: SessionManager.updateActivity
  };
};

// Hook for warning users about session expiry
export const useSessionWarning = (warningThresholdMinutes: number = 5) => {
  const { timeUntilExpiry, timeUntilActivityTimeout } = useSessionActivity();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const warningThreshold = warningThresholdMinutes * 60 * 1000; // Convert to milliseconds
    const shouldShowWarning = 
      (timeUntilExpiry > 0 && timeUntilExpiry <= warningThreshold) ||
      (timeUntilActivityTimeout > 0 && timeUntilActivityTimeout <= warningThreshold);

    setShowWarning(shouldShowWarning);
  }, [timeUntilExpiry, timeUntilActivityTimeout, warningThresholdMinutes]);

  return {
    showWarning,
    timeUntilExpiry,
    timeUntilActivityTimeout
  };
};