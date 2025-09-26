/**
 * React Hook for Persistent State Management
 * Automatically syncs component state with persistent storage
 */

import { useState, useEffect, useCallback } from 'react';
import { persistentStorage, STORAGE_KEYS } from '@/lib/persistent-storage';
import { useAuth } from '@/components/auth/AuthProvider';

export interface UsePersistentStateOptions {
  // Storage key to use
  key: string;
  // Default value if no stored value exists
  defaultValue: any;
  // Whether this data should be user-specific
  userSpecific?: boolean;
  // Whether to sync immediately on mount
  syncOnMount?: boolean;
  // Debounce delay for saving changes (ms)
  saveDelay?: number;
}

/**
 * Hook for managing persistent state that survives app restarts
 * @param options Configuration options
 * @returns [state, setState, isLoading, error]
 */
export function usePersistentState<T>(options: UsePersistentStateOptions) {
  const {
    key,
    defaultValue,
    userSpecific = false,
    syncOnMount = true,
    saveDelay = 500
  } = options;

  const { user } = useAuth();
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const userId = userSpecific && user ? user.id : undefined;

  // Load initial data
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const storedData = await persistentStorage.get<T>(key, userId);
        
        if (mounted) {
          if (storedData !== null) {
            setState(storedData);
          } else {
            setState(defaultValue);
            // Save default value to storage
            await persistentStorage.set(key, defaultValue, userId);
          }
        }
      } catch (err) {
        if (mounted) {
          console.warn(`Error loading persistent state for key ${key}:`, err);
          setError(err as Error);
          setState(defaultValue);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [key, userId, defaultValue]);

  // Sync data if user changes (for user-specific data) with longer debounce during auth
  useEffect(() => {
    if (userSpecific && user && syncOnMount) {
      // Longer debounce to prevent auth interference
      const syncTimeout = setTimeout(async () => {
        try {
          console.log(`[PersistentState] Syncing data for key: ${key}`);
          await persistentStorage.syncData(user.id);
          // Reload data after sync
          const storedData = await persistentStorage.get<T>(key, user.id);
          if (storedData !== null) {
            setState(storedData);
          }
        } catch (err) {
          console.warn(`Error syncing data for key ${key}:`, err);
        }
      }, 2000); // 2 second delay to allow auth to stabilize

      return () => clearTimeout(syncTimeout);
    }
  }, [user?.id, userSpecific, syncOnMount, key]);

  // Debounced save function
  const debouncedSave = useCallback((value: T) => {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        await persistentStorage.set(key, value, userId);
      } catch (err) {
        console.warn(`Error saving persistent state for key ${key}:`, err);
        setError(err as Error);
      }
    }, saveDelay);

    setSaveTimeout(timeout);
  }, [key, userId, saveDelay, saveTimeout]);

  // Enhanced setState that triggers persistence
  const setPersistentState = useCallback((value: T | ((prevState: T) => T)) => {
    setState(prevState => {
      const newState = typeof value === 'function' 
        ? (value as (prevState: T) => T)(prevState)
        : value;

      // Save to persistent storage (debounced)
      debouncedSave(newState);

      return newState;
    });
  }, [debouncedSave]);

  // Manually trigger save (useful for critical operations)
  const saveNow = useCallback(async () => {
    try {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        setSaveTimeout(null);
      }
      
      await persistentStorage.set(key, state, userId);
    } catch (err) {
      console.warn(`Error manually saving persistent state for key ${key}:`, err);
      setError(err as Error);
    }
  }, [key, state, userId, saveTimeout]);

  // Reset to default value
  const reset = useCallback(async () => {
    try {
      setState(defaultValue);
      await persistentStorage.set(key, defaultValue, userId);
    } catch (err) {
      console.warn(`Error resetting persistent state for key ${key}:`, err);
      setError(err as Error);
    }
  }, [key, defaultValue, userId]);

  // Clear from storage
  const clear = useCallback(async () => {
    try {
      setState(defaultValue);
      await persistentStorage.remove(key, userId);
    } catch (err) {
      console.warn(`Error clearing persistent state for key ${key}:`, err);
      setError(err as Error);
    }
  }, [key, defaultValue, userId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return {
    state,
    setState: setPersistentState,
    isLoading,
    error,
    saveNow,
    reset,
    clear
  };
}

// Convenience hooks for common use cases
export function usePersistentUserState<T>(key: string, defaultValue: T) {
  return usePersistentState<T>({
    key,
    defaultValue,
    userSpecific: true,
    syncOnMount: true
  });
}

export function usePersistentGlobalState<T>(key: string, defaultValue: T) {
  return usePersistentState<T>({
    key,
    defaultValue,
    userSpecific: false,
    syncOnMount: false
  });
}

// Hook for managing application-wide persistent settings
export function useAppSettings() {
  return usePersistentUserState('app_settings', {
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      email: true,
      push: true,
      desktop: true
    },
    defaultView: {
      orders: 'table',
      customers: 'grid',
      products: 'grid'
    }
  });
}

// Hook for UI preferences
export function useUIPreferences() {
  return usePersistentUserState('ui_preferences', {
    sidebarCollapsed: false,
    defaultPageSize: 25,
    showAdvancedFilters: false,
    compactMode: false
  });
}