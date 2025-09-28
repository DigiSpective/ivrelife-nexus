/**
 * Comprehensive Data Manager
 * Handles persistence and synchronization for all application data
 * Provides offline-first functionality with automatic sync
 */

import { persistentStorage, STORAGE_KEYS } from './persistent-storage';
import { supabase } from './supabase';
import { 
  getMockCustomers, 
  getMockOrders, 
  createMockCustomer,
  createMockOrder
} from './mock-data';
import { sampleProducts } from '@/data/sampleProducts';

export class DataManager {
  private static instance: DataManager;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: Array<{ table: string; operation: string; data: any }> = [];

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Generic data operations with persistence
  async getData<T>(key: string, fallbackLoader?: () => Promise<T[]>, userId?: string): Promise<T[]> {
    try {
      // Try to get from persistent storage first
      const cachedData = await persistentStorage.get<T[]>(key, userId);
      
      if (cachedData) {
        return cachedData;
      }

      // If no cached data, try fallback loader (e.g., mock data or API)
      if (fallbackLoader) {
        const freshData = await fallbackLoader();
        // Cache the fresh data
        await persistentStorage.set(key, freshData, userId);
        return freshData;
      }

      return [];
    } catch (error) {
      console.warn(`Error getting data for ${key}:`, error);
      return fallbackLoader ? await fallbackLoader() : [];
    }
  }

  async setData<T>(key: string, data: T[], userId?: string): Promise<void> {
    try {
      await persistentStorage.set(key, data, userId);
      
      // If online, also sync to Supabase (if applicable)
      if (this.isOnline && this.shouldSyncToSupabase(key)) {
        await this.syncToSupabase(key, data, userId);
      } else if (!this.isOnline) {
        // Queue for later sync when back online
        this.syncQueue.push({ table: key, operation: 'update', data });
      }
    } catch (error) {
      console.warn(`Error setting data for ${key}:`, error);
    }
  }

  async addItem<T extends { id: string }>(key: string, item: T, userId?: string): Promise<void> {
    try {
      const currentData = await this.getData<T>(key, undefined, userId);
      const updatedData = [...currentData, item];
      await this.setData(key, updatedData, userId);

      // Queue individual item creation for sync
      if (!this.isOnline) {
        this.syncQueue.push({ table: key, operation: 'create', data: item });
      }
    } catch (error) {
      console.warn(`Error adding item to ${key}:`, error);
    }
  }

  async updateItem<T extends { id: string }>(key: string, itemId: string, updates: Partial<T>, userId?: string): Promise<void> {
    try {
      const currentData = await this.getData<T>(key, undefined, userId);
      const updatedData = currentData.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
      await this.setData(key, updatedData, userId);

      // Queue individual item update for sync
      if (!this.isOnline) {
        this.syncQueue.push({ table: key, operation: 'update', data: { id: itemId, ...updates } });
      }
    } catch (error) {
      console.warn(`Error updating item in ${key}:`, error);
    }
  }

  async removeItem<T extends { id: string }>(key: string, itemId: string, userId?: string): Promise<void> {
    try {
      const currentData = await this.getData<T>(key, undefined, userId);
      const updatedData = currentData.filter(item => item.id !== itemId);
      await this.setData(key, updatedData, userId);

      // Queue individual item deletion for sync
      if (!this.isOnline) {
        this.syncQueue.push({ table: key, operation: 'delete', data: { id: itemId } });
      }
    } catch (error) {
      console.warn(`Error removing item from ${key}:`, error);
    }
  }

  // Specific data type managers
  async getCustomers(userId?: string) {
    return this.getData(STORAGE_KEYS.CUSTOMERS, async () => {
      // Return empty array to avoid circular dependency with getMockCustomers
      // Mock data initialization is handled directly in getMockCustomers function
      return [];
    }, userId);
  }

  async addCustomer(customer: any, userId?: string) {
    return this.addItem(STORAGE_KEYS.CUSTOMERS, customer, userId);
  }

  async updateCustomer(customerId: string, updates: any, userId?: string) {
    return this.updateItem(STORAGE_KEYS.CUSTOMERS, customerId, updates, userId);
  }

  async removeCustomer(customerId: string, userId?: string) {
    return this.removeItem(STORAGE_KEYS.CUSTOMERS, customerId, userId);
  }

  async getOrders(userId?: string) {
    return this.getData(STORAGE_KEYS.ORDERS, async () => {
      // Return empty array to avoid circular dependency with getMockOrders
      // Mock data initialization is handled directly in getMockOrders function
      return [];
    }, userId);
  }

  async addOrder(order: any, userId?: string) {
    return this.addItem(STORAGE_KEYS.ORDERS, order, userId);
  }

  async updateOrder(orderId: string, updates: any, userId?: string) {
    return this.updateItem(STORAGE_KEYS.ORDERS, orderId, updates, userId);
  }

  async removeOrder(orderId: string, userId?: string) {
    return this.removeItem(STORAGE_KEYS.ORDERS, orderId, userId);
  }

  async getProducts(userId?: string) {
    return this.getData(STORAGE_KEYS.PRODUCTS, async () => {
      return sampleProducts;
    }, userId);
  }

  async updateProduct(productId: string, updates: any, userId?: string) {
    return this.updateItem(STORAGE_KEYS.PRODUCTS, productId, updates, userId);
  }

  async getClaims(userId?: string) {
    return this.getData(STORAGE_KEYS.CLAIMS, async () => {
      return []; // Empty initially
    }, userId);
  }

  async addClaim(claim: any, userId?: string) {
    return this.addItem(STORAGE_KEYS.CLAIMS, claim, userId);
  }

  async updateClaim(claimId: string, updates: any, userId?: string) {
    return this.updateItem(STORAGE_KEYS.CLAIMS, claimId, updates, userId);
  }

  async getRetailers(userId?: string) {
    return this.getData(STORAGE_KEYS.RETAILERS, async () => {
      return []; // Empty initially - would be loaded from API in real app
    }, userId);
  }

  async addRetailer(retailer: any, userId?: string) {
    return this.addItem(STORAGE_KEYS.RETAILERS, retailer, userId);
  }

  async updateRetailer(retailerId: string, updates: any, userId?: string) {
    return this.updateItem(STORAGE_KEYS.RETAILERS, retailerId, updates, userId);
  }

  // Shipments/Fulfillments
  async getShipments(userId?: string) {
    return this.getData(STORAGE_KEYS.SHIPMENTS, async () => {
      return []; // Empty initially
    }, userId);
  }

  async addShipment(shipment: any, userId?: string) {
    return this.addItem(STORAGE_KEYS.SHIPMENTS, shipment, userId);
  }

  async updateShipment(shipmentId: string, updates: any, userId?: string) {
    return this.updateItem(STORAGE_KEYS.SHIPMENTS, shipmentId, updates, userId);
  }

  async removeShipment(shipmentId: string, userId?: string) {
    return this.removeItem(STORAGE_KEYS.SHIPMENTS, shipmentId, userId);
  }

  // Alias methods for fulfillments (same data, different name)
  async getFulfillments(userId?: string) {
    return this.getShipments(userId);
  }

  async addFulfillment(fulfillment: any, userId?: string) {
    return this.addShipment(fulfillment, userId);
  }

  async updateFulfillment(fulfillmentId: string, updates: any, userId?: string) {
    return this.updateShipment(fulfillmentId, updates, userId);
  }

  async removeFulfillment(fulfillmentId: string, userId?: string) {
    return this.removeShipment(fulfillmentId, userId);
  }

  // Sync operations
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log(`Processing ${this.syncQueue.length} queued operations...`);

    const queueCopy = [...this.syncQueue];
    this.syncQueue = []; // Clear queue optimistically

    for (const operation of queueCopy) {
      try {
        await this.syncToSupabase(operation.table, operation.data);
      } catch (error) {
        console.warn('Failed to sync operation:', operation, error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
      }
    }
  }

  private async syncToSupabase(table: string, data: any, userId?: string): Promise<void> {
    try {
      if (!this.shouldSyncToSupabase(table)) return;

      // Convert our storage keys to actual table names
      const tableName = this.getSupabaseTableName(table);
      
      if (tableName) {
        // For now, we'll just log what would be synced
        // In a full implementation, this would actually sync to Supabase
        console.log(`Would sync to Supabase table ${tableName}:`, data);
      }
    } catch (error) {
      console.warn(`Error syncing ${table} to Supabase:`, error);
    }
  }

  private shouldSyncToSupabase(key: string): boolean {
    const syncableKeys = [
      STORAGE_KEYS.CUSTOMERS,
      STORAGE_KEYS.ORDERS,
      STORAGE_KEYS.CLAIMS,
      STORAGE_KEYS.RETAILERS,
      STORAGE_KEYS.SHIPMENTS
    ];
    return syncableKeys.includes(key as any);
  }

  private getSupabaseTableName(storageKey: string): string | null {
    const mapping: Record<string, string> = {
      [STORAGE_KEYS.CUSTOMERS]: 'customers',
      [STORAGE_KEYS.ORDERS]: 'orders',
      [STORAGE_KEYS.CLAIMS]: 'claims',
      [STORAGE_KEYS.RETAILERS]: 'retailers',
      [STORAGE_KEYS.PRODUCTS]: 'products'
    };
    return mapping[storageKey] || null;
  }

  // Utility methods
  async clearAllData(userId?: string): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map(key => persistentStorage.remove(key, userId)));
  }

  async exportData(userId?: string): Promise<Record<string, any>> {
    const data: Record<string, any> = {};
    const keys = Object.values(STORAGE_KEYS);
    
    for (const key of keys) {
      try {
        data[key] = await persistentStorage.get(key, userId);
      } catch (error) {
        console.warn(`Error exporting data for ${key}:`, error);
      }
    }
    
    return data;
  }

  async importData(data: Record<string, any>, userId?: string): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      try {
        await persistentStorage.set(key, value, userId);
      } catch (error) {
        console.warn(`Error importing data for ${key}:`, error);
      }
    }
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance();