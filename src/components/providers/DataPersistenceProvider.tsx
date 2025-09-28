/**
 * Data Persistence Provider
 * Wraps the entire app to provide automatic data persistence and synchronization
 * Ensures all data operations are cached and synced appropriately
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { persistentStorage, syncPersistedData } from '@/lib/persistent-storage';
import { dataManager } from '@/lib/data-manager';
import { useAuth } from '@/components/auth/AuthProvider';


interface DataPersistenceContextValue {
  isOnline: boolean;
  lastSyncTime: number | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  forcSync: () => Promise<void>;
}

const DataPersistenceContext = createContext<DataPersistenceContextValue>({
  isOnline: navigator.onLine,
  lastSyncTime: null,
  syncStatus: 'idle',
  forcSync: async () => {},
});

export const useDataPersistence = () => {
  const context = useContext(DataPersistenceContext);
  if (!context) {
    throw new Error('useDataPersistence must be used within a DataPersistenceProvider');
  }
  return context;
};

interface DataPersistenceProviderProps {
  children: ReactNode;
}

export function DataPersistenceProvider({ children }: DataPersistenceProviderProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = React.useState<number | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'error'>('idle');
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Memoize performDataSync to prevent infinite re-renders
  const performDataSync = React.useCallback(async () => {
    if (!user || !isOnline) return;

    try {
      setSyncStatus('syncing');
      await syncPersistedData(user.id);
      setLastSyncTime(Date.now());
      setSyncStatus('idle');
      
      // Only invalidate specific queries to avoid cascade
      console.log('Data sync completed successfully');
    } catch (error) {
      console.warn('Data sync failed:', error);
      setSyncStatus('error');
    }
  }, [user?.id, isOnline]);

  // Initialize flag immediately but sync data after short delay
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Sync data when user changes or comes back online (with minimal delay)
  useEffect(() => {
    if (!user || !isOnline || !isInitialized) return;
    
    // Small delay to allow auth to settle
    const syncTimeout = setTimeout(() => {
      performDataSync();
    }, 1000); // 1 second delay

    return () => clearTimeout(syncTimeout);
  }, [user?.id, isOnline, isInitialized, performDataSync]);

  // Periodic sync every 5 minutes when online (only after initialization)
  useEffect(() => {
    if (!isOnline || !user || !isInitialized) return;

    const interval = setInterval(() => {
      performDataSync();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isOnline, user?.id, isInitialized, performDataSync]);

  // Auto-save critical data before page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Force save any pending changes
      if (user) {
        try {
          await dataManager.exportData(user.id);
        } catch (error) {
          console.warn('Error saving data before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user?.id]);

  const forcSync = async () => {
    await performDataSync();
  };

  // Simplified persistence - removed QueryClient override to prevent conflicts
  React.useEffect(() => {
    // Cache management is now handled by individual hooks
    // This prevents conflicts during auth state changes
    console.log('Data persistence provider initialized for user:', user?.id);
  }, [user?.id]);

  const contextValue: DataPersistenceContextValue = {
    isOnline,
    lastSyncTime,
    syncStatus,
    forcSync
  };

  return (
    <DataPersistenceContext.Provider value={contextValue}>
      {children}
    </DataPersistenceContext.Provider>
  );
}

// Hook to automatically persist component state
export function usePersistentComponentState<T>(
  componentName: string,
  initialState: T
): [T, (state: T) => void] {
  const { user } = useAuth();
  const [state, setState] = React.useState<T>(initialState);

  // Load persisted state on mount
  React.useEffect(() => {
    const loadState = async () => {
      try {
        const persistedState = await persistentStorage.get<T>(
          `component_${componentName}`,
          user?.id
        );
        if (persistedState !== null) {
          setState(persistedState);
        }
      } catch (error) {
        console.warn(`Error loading state for ${componentName}:`, error);
      }
    };

    loadState();
  }, [componentName, user?.id]);

  // Persist state changes
  const setPersistentState = React.useCallback((newState: T) => {
    setState(newState);
    
    // Debounced persistence
    const timeoutId = setTimeout(async () => {
      try {
        await persistentStorage.set(`component_${componentName}`, newState, user?.id);
      } catch (error) {
        console.warn(`Error persisting state for ${componentName}:`, error);
      }
    }, 1000);

    // Cleanup timeout on next call
    return () => clearTimeout(timeoutId);
  }, [componentName, user?.id]);

  return [state, setPersistentState];
}

// Status component to show sync status
export function DataSyncStatus() {
  const { isOnline, lastSyncTime, syncStatus, forcSync } = useDataPersistence();
  
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (syncStatus === 'syncing') return 'text-yellow-500';
    if (syncStatus === 'error') return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'syncing') return 'Syncing...';
    if (syncStatus === 'error') return 'Sync Error';
    return 'Online';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
      <span className={getStatusColor()}>{getStatusText()}</span>
      {lastSyncTime && (
        <span>• Last sync: {formatLastSync()}</span>
      )}
      {isOnline && syncStatus !== 'syncing' && (
        <button 
          onClick={forcSync}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Sync now
        </button>
      )}
    </div>
  );
}