/**
 * Smart Persistence Manager
 * Intelligently routes data to the best available persistence method
 * Handles fallbacks and data migration automatically
 */

import { checkPersistenceStatus, type PersistenceStatus } from './persistence-status';
import { supabase } from './supabase';
import { STORAGE_KEYS } from './persistent-storage';

export interface SmartPersistenceOptions {
  preferSupabase?: boolean;
  fallbackToLocalStorage?: boolean;
  enableMigration?: boolean;
}

export class SmartPersistenceManager {
  private status: PersistenceStatus | null = null;
  private initialized = false;
  
  constructor(private options: SmartPersistenceOptions = {}) {
    this.options = {
      preferSupabase: true,
      fallbackToLocalStorage: true,
      enableMigration: true,
      ...options
    };
  }
  
  private async ensureInitialized() {
    if (!this.initialized) {
      this.status = await checkPersistenceStatus();
      this.initialized = true;
    }
  }
  
  async get<T>(key: string, userId?: string): Promise<T | null> {
    await this.ensureInitialized();
    
    console.log(`📖 SmartPersistence.get(${key}) for user:`, userId);
    
    // Strategy 1: Try Supabase if available and preferred
    if (this.options.preferSupabase && this.status?.supabaseUserStorage && userId) {
      try {
        const { data, error } = await supabase
          .from('user_storage')
          .select('data, updated_at')
          .eq('user_id', userId)
          .eq('storage_key', key)
          .single();
        
        if (!error && data) {
          console.log(`✅ Retrieved from Supabase:`, key);
          return JSON.parse(data.data);
        } else if (error && error.code !== 'PGRST116') {
          console.warn(`⚠️ Supabase error for ${key}:`, error);
        }
      } catch (error) {
        console.warn(`❌ Supabase exception for ${key}:`, error);
      }
    }
    
    // Strategy 2: Fall back to localStorage
    if (this.options.fallbackToLocalStorage && this.status?.localStorage) {
      try {
        const storageKey = userId ? `${key}:${userId}` : key;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log(`✅ Retrieved from localStorage:`, key);
          return parsed.data || parsed; // Handle both wrapped and unwrapped data
        }
      } catch (error) {
        console.warn(`❌ localStorage error for ${key}:`, error);
      }
    }
    
    console.log(`🔍 No data found for ${key}`);
    return null;
  }
  
  async set<T>(key: string, value: T, userId?: string): Promise<boolean> {
    await this.ensureInitialized();
    
    console.log(`💾 SmartPersistence.set(${key}) for user:`, userId);
    
    let supabaseSuccess = false;
    let localStorageSuccess = false;
    
    const wrappedData = {
      data: value,
      timestamp: Date.now(),
      userId,
      version: '1.0'
    };
    
    // Strategy 1: Save to Supabase if available
    if (this.status?.supabaseUserStorage && userId) {
      try {
        const { error } = await supabase
          .from('user_storage')
          .upsert({
            user_id: userId,
            storage_key: key,
            data: JSON.stringify(wrappedData),
            updated_at: new Date().toISOString()
          });
        
        if (!error) {
          supabaseSuccess = true;
          console.log(`✅ Saved to Supabase:`, key);
        } else {
          console.warn(`⚠️ Supabase save error for ${key}:`, error);
        }
      } catch (error) {
        console.warn(`❌ Supabase save exception for ${key}:`, error);
      }
    }
    
    // Strategy 2: Always save to localStorage as backup
    if (this.status?.localStorage) {
      try {
        const storageKey = userId ? `${key}:${userId}` : key;
        localStorage.setItem(storageKey, JSON.stringify(wrappedData));
        localStorageSuccess = true;
        console.log(`✅ Saved to localStorage:`, key);
      } catch (error) {
        console.warn(`❌ localStorage save error for ${key}:`, error);
      }
    }
    
    const success = supabaseSuccess || localStorageSuccess;
    console.log(`📊 Save result for ${key}: Supabase=${supabaseSuccess}, localStorage=${localStorageSuccess}`);
    
    return success;
  }
  
  async remove(key: string, userId?: string): Promise<boolean> {
    await this.ensureInitialized();
    
    console.log(`🗑️ SmartPersistence.remove(${key}) for user:`, userId);
    
    let supabaseSuccess = false;
    let localStorageSuccess = false;
    
    // Remove from Supabase
    if (this.status?.supabaseUserStorage && userId) {
      try {
        const { error } = await supabase
          .from('user_storage')
          .delete()
          .eq('user_id', userId)
          .eq('storage_key', key);
        
        if (!error) {
          supabaseSuccess = true;
          console.log(`✅ Removed from Supabase:`, key);
        }
      } catch (error) {
        console.warn(`❌ Supabase remove error for ${key}:`, error);
      }
    }
    
    // Remove from localStorage
    if (this.status?.localStorage) {
      try {
        const storageKey = userId ? `${key}:${userId}` : key;
        localStorage.removeItem(storageKey);
        localStorageSuccess = true;
        console.log(`✅ Removed from localStorage:`, key);
      } catch (error) {
        console.warn(`❌ localStorage remove error for ${key}:`, error);
      }
    }
    
    return supabaseSuccess || localStorageSuccess;
  }
  
  async migrateFromLocalStorageToSupabase(userId: string): Promise<number> {
    if (!this.options.enableMigration || !this.status?.supabaseUserStorage) {
      return 0;
    }
    
    console.log(`🔄 Migrating localStorage data to Supabase for user:`, userId);
    
    let migratedCount = 0;
    
    // Find all localStorage keys that belong to this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.includes('iv-relife-')) continue;
      
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;
        
        const parsed = JSON.parse(data);
        
        // Extract the actual storage key (remove iv-relife- prefix and user suffix)
        let storageKey = key.replace(/^iv-relife-/, '');
        if (storageKey.endsWith(`:${userId}`)) {
          storageKey = storageKey.slice(0, -userId.length - 1);
        }
        
        // Skip if this data is not for the current user
        if (parsed.userId && parsed.userId !== userId) {
          continue;
        }
        
        // Migrate to Supabase
        const { error } = await supabase
          .from('user_storage')
          .upsert({
            user_id: userId,
            storage_key: storageKey,
            data: JSON.stringify(parsed),
            updated_at: new Date().toISOString()
          });
        
        if (!error) {
          migratedCount++;
          console.log(`✅ Migrated ${storageKey} to Supabase`);
        } else {
          console.warn(`⚠️ Failed to migrate ${storageKey}:`, error);
        }
      } catch (error) {
        console.warn(`❌ Migration error for ${key}:`, error);
      }
    }
    
    console.log(`🏁 Migration complete: ${migratedCount} items migrated`);
    return migratedCount;
  }
  
  async getStatus(): Promise<PersistenceStatus> {
    await this.ensureInitialized();
    return this.status!;
  }
  
  async refreshStatus(): Promise<PersistenceStatus> {
    this.status = await checkPersistenceStatus(true);
    return this.status;
  }
}

// Export default instance
export const smartPersistence = new SmartPersistenceManager();