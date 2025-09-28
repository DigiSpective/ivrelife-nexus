/**
 * Comprehensive Persistent Storage System
 * Handles data persistence across app restarts, page refreshes, and user sessions
 * Provides fallback to localStorage when Supabase is not available
 */

import { supabase } from './supabase';

// Storage keys for different data types
export const STORAGE_KEYS = {
  // User data
  USER_SESSION: 'iv-relife-user-session',
  USER_PREFERENCES: 'iv-relife-user-preferences',
  
  // Business data
  CUSTOMERS: 'iv-relife-customers',
  ORDERS: 'iv-relife-orders',
  PRODUCTS: 'iv-relife-products',
  RETAILERS: 'iv-relife-retailers',
  LOCATIONS: 'iv-relife-locations',
  CLAIMS: 'iv-relife-claims',
  SHIPMENTS: 'iv-relife-shipments',
  
  // UI state
  CART: 'iv-relife-cart',
  NOTIFICATIONS: 'iv-relife-notifications',
  FILTER_SETTINGS: 'iv-relife-filter-settings',
  VIEW_PREFERENCES: 'iv-relife-view-preferences',
  
  // App metadata
  LAST_SYNC: 'iv-relife-last-sync',
  OFFLINE_CHANGES: 'iv-relife-offline-changes'
} as const;

// Type definitions for stored data
export interface StoredData<T = any> {
  data: T;
  timestamp: number;
  version: string;
  userId?: string;
}

export interface OfflineChange {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  userId?: string;
}

// Utility class for persistent storage
export class PersistentStorage {
  private static instance: PersistentStorage;
  private readonly version = '1.0.0';
  private syncQueue: Array<{
    operation: 'set' | 'remove';
    key: string;
    data?: any;
    userId?: string;
    timestamp: number;
  }> = [];
  
  private constructor() {}
  
  static getInstance(): PersistentStorage {
    if (!PersistentStorage.instance) {
      PersistentStorage.instance = new PersistentStorage();
    }
    return PersistentStorage.instance;
  }

  // Get data with automatic fallback to localStorage
  async get<T>(key: string, userId?: string): Promise<T | null> {
    try {
      // Try Supabase first (for user-specific data that should sync across devices)
      if (userId && this.shouldUseSupabase(key)) {
        const { data, error } = await supabase
          .from('user_storage')
          .select('data')
          .eq('user_id', userId)
          .eq('storage_key', key)
          .single();
          
        if (!error && data) {
          return JSON.parse(data.data);
        }
        
        // If there's a 404 error or table doesn't exist, it's expected during initial setup
        if (error && (error.code === 'PGRST116' || error.message?.includes('user_storage'))) {
          console.log(`ℹ️ user_storage table not set up yet. Using localStorage for ${key}.`);
        } else if (error) {
          console.warn(`Error accessing Supabase for key ${key}:`, error);
        }
      }
      
      // Fallback to localStorage
      return this.getFromLocalStorage<T>(key);
    } catch (error) {
      // Check if it's a user_storage table issue
      if (error instanceof Error && error.message?.includes('user_storage')) {
        console.log(`ℹ️ user_storage table not available. Using localStorage for ${key}.`);
      } else {
        console.warn(`Error getting data for key ${key}:`, error);
      }
      return this.getFromLocalStorage<T>(key);
    }
  }

  // Set data with automatic sync to both Supabase and localStorage
  async set<T>(key: string, value: T, userId?: string): Promise<void> {
    try {
      const storedData: StoredData<T> = {
        data: value,
        timestamp: Date.now(),
        version: this.version,
        userId
      };

      // Always save to localStorage for immediate access
      this.setToLocalStorage(key, storedData);

      // Also save to Supabase for syncing (non-blocking during auth)
      if (userId && this.shouldUseSupabase(key)) {
        this.saveToSupabase(key, storedData, userId).catch(error => {
          // Check if it's a user_storage table issue
          if (error?.code === 'PGRST116' || error?.message?.includes('user_storage')) {
            console.log(`ℹ️ user_storage table not set up yet. Skipping Supabase sync for ${key}.`);
          } else {
            console.warn(`Non-blocking Supabase save failed for key ${key}:`, error);
            // Add to sync queue for retry
            this.syncQueue.push({
              operation: 'set',
              key,
              data: storedData,
              userId,
              timestamp: Date.now()
            });
          }
        });
      }
      
      // Update last sync timestamp
      this.setToLocalStorage(STORAGE_KEYS.LAST_SYNC, {
        data: Date.now(),
        timestamp: Date.now(),
        version: this.version
      });
      
    } catch (error) {
      console.warn(`Error setting data for key ${key}:`, error);
      // Still save to localStorage even if Supabase fails
      this.setToLocalStorage(key, {
        data: value,
        timestamp: Date.now(),
        version: this.version,
        userId
      });
    }
  }

  // Remove data from both storage systems
  async remove(key: string, userId?: string): Promise<void> {
    try {
      // Remove from localStorage
      localStorage.removeItem(key);

      // Remove from Supabase if applicable
      if (userId && this.shouldUseSupabase(key)) {
        await supabase
          .from('user_storage')
          .delete()
          .eq('user_id', userId)
          .eq('storage_key', key);
      }
    } catch (error) {
      console.warn(`Error removing data for key ${key}:`, error);
    }
  }

  // Clear all stored data (useful for logout)
  async clearUserData(userId?: string): Promise<void> {
    try {
      // Clear localStorage (except system preferences)
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.USER_PREFERENCES) {
          localStorage.removeItem(key);
        }
      });

      // Clear Supabase user data
      if (userId) {
        await supabase
          .from('user_storage')
          .delete()
          .eq('user_id', userId);
      }
    } catch (error) {
      console.warn('Error clearing user data:', error);
    }
  }

  // Sync data between localStorage and Supabase
  async syncData(userId: string): Promise<void> {
    try {
      const lastSync = this.getFromLocalStorage<number>(STORAGE_KEYS.LAST_SYNC);
      const syncTimestamp = lastSync?.data || 0;

      // Get all user data from Supabase that's newer than last sync
      const { data: remoteData, error } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', new Date(syncTimestamp).toISOString());

      if (!error && remoteData) {
        // Update localStorage with newer remote data
        for (const item of remoteData) {
          const localData = this.getFromLocalStorage(item.storage_key);
          const remoteTimestamp = new Date(item.updated_at).getTime();
          
          if (!localData || localData.timestamp < remoteTimestamp) {
            this.setToLocalStorage(item.storage_key, JSON.parse(item.data));
          }
        }
      }

      // Upload any offline changes to Supabase
      await this.uploadOfflineChanges(userId);

      // Process any queued sync operations
      await this.processSyncQueue();
      
    } catch (error) {
      console.warn('Error syncing data:', error);
    }
  }

  // Handle offline changes
  async queueOfflineChange(change: Omit<OfflineChange, 'id' | 'timestamp'>): Promise<void> {
    const offlineChange: OfflineChange = {
      ...change,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    const existingChanges = this.getFromLocalStorage<OfflineChange[]>(STORAGE_KEYS.OFFLINE_CHANGES)?.data || [];
    existingChanges.push(offlineChange);
    
    this.setToLocalStorage(STORAGE_KEYS.OFFLINE_CHANGES, {
      data: existingChanges,
      timestamp: Date.now(),
      version: this.version
    });
  }

  // Process sync queue for failed operations
  async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const queueCopy = [...this.syncQueue];
    this.syncQueue = []; // Clear queue optimistically

    for (const queueItem of queueCopy) {
      try {
        if (queueItem.operation === 'set') {
          await this.saveToSupabase(queueItem.key, queueItem.data, queueItem.userId!);
        } else if (queueItem.operation === 'remove') {
          await supabase
            .from('user_storage')
            .delete()
            .eq('user_id', queueItem.userId!)
            .eq('storage_key', queueItem.key);
        }
      } catch (error) {
        console.warn(`Failed to process sync queue item for key ${queueItem.key}:`, error);
        // Re-add to queue for retry
        this.syncQueue.push(queueItem);
      }
    }
  }

  // Upload offline changes when back online
  private async uploadOfflineChanges(userId: string): Promise<void> {
    try {
      const offlineChanges = this.getFromLocalStorage<OfflineChange[]>(STORAGE_KEYS.OFFLINE_CHANGES);
      
      if (!offlineChanges?.data?.length) return;

      // Process each offline change
      for (const change of offlineChanges.data) {
        try {
          // Apply the change to Supabase based on operation type
          switch (change.operation) {
            case 'create':
              await supabase.from(change.table).insert(change.data);
              break;
            case 'update':
              await supabase.from(change.table).update(change.data).eq('id', change.data.id);
              break;
            case 'delete':
              await supabase.from(change.table).delete().eq('id', change.data.id);
              break;
          }
        } catch (error) {
          console.warn(`Failed to upload offline change ${change.id}:`, error);
        }
      }

      // Clear offline changes after successful upload
      this.setToLocalStorage(STORAGE_KEYS.OFFLINE_CHANGES, {
        data: [],
        timestamp: Date.now(),
        version: this.version
      });
      
    } catch (error) {
      console.warn('Error uploading offline changes:', error);
    }
  }

  // Private helper methods
  private getFromLocalStorage<T>(key: string): StoredData<T> | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Error parsing localStorage data for key ${key}:`, error);
      return null;
    }
  }

  private setToLocalStorage<T>(key: string, value: StoredData<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error saving to localStorage for key ${key}:`, error);
    }
  }

  private async saveToSupabase<T>(key: string, value: StoredData<T>, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_storage')
        .upsert({
          user_id: userId,
          storage_key: key,
          data: JSON.stringify(value),
          updated_at: new Date().toISOString()
        });

      if (error) {
        // Check if it's a user_storage table issue
        if (error.code === 'PGRST116' || error.message?.includes('user_storage')) {
          console.log(`ℹ️ user_storage table not set up yet. Data saved locally for ${key}.`);
        } else {
          console.warn('Error saving to Supabase:', error);
        }
        throw error; // Re-throw to trigger retry queue
      }
    } catch (error) {
      // Check if it's a user_storage table issue
      if (error instanceof Error && error.message?.includes('user_storage')) {
        console.log(`ℹ️ user_storage table not available. Data saved locally for ${key}.`);
      } else {
        console.warn('Error in saveToSupabase:', error);
      }
      throw error; // Re-throw to trigger retry queue
    }
  }

  private shouldUseSupabase(key: string): boolean {
    // Determine which data should be synced via Supabase
    const syncableKeys = [
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.CUSTOMERS,
      STORAGE_KEYS.ORDERS,
      STORAGE_KEYS.CLAIMS,
      STORAGE_KEYS.RETAILERS,
      STORAGE_KEYS.LOCATIONS,
      STORAGE_KEYS.NOTIFICATIONS
    ];
    
    return syncableKeys.includes(key as any);
  }
}

// Export singleton instance
export const persistentStorage = PersistentStorage.getInstance();

// Convenience functions for common operations
export const getPersistedData = <T>(key: string, userId?: string): Promise<T | null> => {
  return persistentStorage.get<T>(key, userId);
};

export const setPersistedData = <T>(key: string, value: T, userId?: string): Promise<void> => {
  return persistentStorage.set(key, value, userId);
};

export const removePersistedData = (key: string, userId?: string): Promise<void> => {
  return persistentStorage.remove(key, userId);
};

export const clearPersistedUserData = (userId?: string): Promise<void> => {
  return persistentStorage.clearUserData(userId);
};

export const syncPersistedData = (userId: string): Promise<void> => {
  return persistentStorage.syncData(userId);
};