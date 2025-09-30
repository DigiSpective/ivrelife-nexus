/**
 * Supabase Persistence Manager
 * Handles direct Supabase database operations for proper data persistence
 */

import { supabase } from './supabase';
import { waitForAuth, getCurrentUserId } from './auth-context-guard';

export interface SupabasePersistenceOptions {
  enableFallback?: boolean;
  logOperations?: boolean;
}

export class SupabasePersistenceManager {
  private options: SupabasePersistenceOptions;

  constructor(options: SupabasePersistenceOptions = {}) {
    this.options = {
      enableFallback: true,
      logOperations: true,
      ...options
    };
  }

  private log(message: string, data?: any) {
    if (this.options.logOperations) {
      console.log(`🔗 SupabasePersistence: ${message}`, data || '');
    }
  }

  /**
   * Save customers to Supabase customers table
   */
  async saveCustomers(customers: any[], userId?: string): Promise<boolean> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        throw new Error('No authenticated user for saving customers');
      }

      this.log('Saving customers to Supabase customers table', { count: customers.length, userId: effectiveUserId });

      // First, delete existing customers for this user to replace them
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('created_by', effectiveUserId);

      if (deleteError) {
        this.log('Warning: Could not delete existing customers', deleteError);
        // Continue anyway - might be first time
      }

      // Insert new customers
      const customersToInsert = customers.map(customer => ({
        id: customer.id,
        name: customer.name || '',
        email: customer.email || null,
        phone: customer.phone || null,
        default_address: customer.address || customer.default_address || null,
        notes: customer.notes || null,
        retailer_id: customer.retailer_id || '550e8400-e29b-41d4-a716-446655440000',
        created_by: effectiveUserId,
        created_at: customer.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('customers')
        .insert(customersToInsert)
        .select();

      if (error) {
        this.log('Error saving customers to Supabase', error);
        return false;
      }

      this.log('Successfully saved customers to Supabase', { inserted: data?.length });
      return true;

    } catch (error) {
      this.log('Exception saving customers', error);
      return false;
    }
  }

  /**
   * Load customers from Supabase customers table
   */
  async loadCustomers(userId?: string): Promise<any[]> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        this.log('No authenticated user for loading customers');
        return [];
      }

      this.log('Loading customers from Supabase customers table', { userId: effectiveUserId });

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('created_by', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        this.log('Error loading customers from Supabase', error);
        return [];
      }

      const customers = data || [];
      this.log('Successfully loaded customers from Supabase', { count: customers.length });

      // Convert Supabase format to app format
      return customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.default_address,
        notes: customer.notes,
        retailer_id: customer.retailer_id,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        // Add any missing fields with defaults
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        orders: [],
        totalSpent: 0,
        loyaltyPoints: 0,
        tags: [],
        isActive: true,
        source: 'supabase',
        preferredContactMethod: 'email'
      }));

    } catch (error) {
      this.log('Exception loading customers', error);
      return [];
    }
  }

  /**
   * Save data to user_storage table (for app persistence)
   */
  async saveToUserStorage(key: string, data: any, userId?: string): Promise<boolean> {
    try {
      const effectiveUserId = userId || (await waitForAuth())?.id;
      if (!effectiveUserId) {
        throw new Error('No authenticated user for user storage');
      }

      this.log('Saving to user_storage table', { key, userId: effectiveUserId });

      const { error } = await supabase
        .from('user_storage')
        .upsert({
          user_id: effectiveUserId,
          storage_key: key,
          data: JSON.stringify({
            data: data,
            timestamp: Date.now(),
            userId: effectiveUserId,
            version: '1.0'
          }),
          updated_at: new Date().toISOString()
        });

      if (error) {
        this.log('Error saving to user_storage', error);
        return false;
      }

      this.log('Successfully saved to user_storage');
      return true;

    } catch (error) {
      this.log('Exception saving to user_storage', error);
      return false;
    }
  }

  /**
   * Load data from user_storage table
   */
  async loadFromUserStorage(key: string, userId?: string): Promise<any> {
    try {
      const effectiveUserId = userId || (await waitForAuth())?.id;
      if (!effectiveUserId) {
        this.log('No authenticated user for user storage');
        return null;
      }

      this.log('Loading from user_storage table', { key, userId: effectiveUserId });

      const { data, error } = await supabase
        .from('user_storage')
        .select('data, updated_at')
        .eq('user_id', effectiveUserId)
        .eq('storage_key', key)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found is OK
          this.log('Error loading from user_storage', error);
        }
        return null;
      }

      if (!data) {
        return null;
      }

      const parsedData = JSON.parse(data.data);
      this.log('Successfully loaded from user_storage');
      return parsedData.data || parsedData;

    } catch (error) {
      this.log('Exception loading from user_storage', error);
      return null;
    }
  }

  /**
   * Save orders to Supabase orders table
   */
  async saveOrders(orders: any[], userId?: string): Promise<boolean> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        throw new Error('No authenticated user for saving orders');
      }

      this.log('Saving orders to Supabase orders table', { count: orders.length, userId: effectiveUserId });

      // Use standardized data transform
      const { appOrderToSupabaseRecord, validateOrderData } = await import('./data-transforms');
      
      const ordersToInsert = orders.map(order => {
        // Validate order data
        const validation = validateOrderData(order);
        if (!validation.isValid) {
          this.log('Order validation failed', { orderId: order.id, errors: validation.errors });
          throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
        }
        
        return appOrderToSupabaseRecord(order, effectiveUserId);
      });

      const { data, error } = await supabase
        .from('orders')
        .upsert(ordersToInsert, { onConflict: 'id' })
        .select();

      if (error) {
        this.log('Error saving orders to Supabase', error);
        return false;
      }

      this.log('Successfully saved orders to Supabase', { upserted: data?.length });
      return true;

    } catch (error) {
      this.log('Exception saving orders', error);
      return false;
    }
  }

  /**
   * Load orders from Supabase orders table
   */
  async loadOrders(userId?: string): Promise<any[]> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        this.log('No authenticated user for loading orders');
        return [];
      }

      this.log('Loading orders from Supabase orders table', { userId: effectiveUserId });

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('created_by', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        this.log('Error loading orders from Supabase', error);
        return [];
      }

      const orders = data || [];
      this.log('Successfully loaded orders from Supabase', { count: orders.length });

      // Use standardized data transform
      const { supabaseRecordToAppOrder } = await import('./data-transforms');
      return orders.map(order => ({
        ...supabaseRecordToAppOrder(order),
        createdAt: order.created_at, // Alias for compatibility
        updatedAt: order.updated_at, // Alias for compatibility
        source: 'supabase'
      }));

    } catch (error) {
      this.log('Exception loading orders', error);
      return [];
    }
  }

  /**
   * Save claims to Supabase claims table
   */
  async saveClaims(claims: any[], userId?: string): Promise<boolean> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        throw new Error('No authenticated user for saving claims');
      }

      this.log('Saving claims to Supabase claims table', { count: claims.length, userId: effectiveUserId });

      const claimsToInsert = claims.map(claim => ({
        id: claim.id,
        retailer_id: claim.retailer_id || '550e8400-e29b-41d4-a716-446655440000',
        location_id: claim.location_id || null,
        order_id: claim.order_id || null,
        product_id: claim.product_id || null,
        customer_id: claim.customer_id || null,
        reason: claim.reason || '',
        status: claim.status || 'submitted',
        resolution_notes: claim.resolution_notes || null,
        description: claim.description || null,
        attachments: JSON.stringify(claim.attachments || []),
        metadata: JSON.stringify(claim.metadata || {}),
        created_by: effectiveUserId,
        created_at: claim.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('claims')
        .upsert(claimsToInsert, { onConflict: 'id' })
        .select();

      if (error) {
        this.log('Error saving claims to Supabase', error);
        return false;
      }

      this.log('Successfully saved claims to Supabase', { upserted: data?.length });
      return true;

    } catch (error) {
      this.log('Exception saving claims', error);
      return false;
    }
  }

  /**
   * Load claims from Supabase claims table
   */
  async loadClaims(userId?: string): Promise<any[]> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        this.log('No authenticated user for loading claims');
        return [];
      }

      this.log('Loading claims from Supabase claims table', { userId: effectiveUserId });

      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('created_by', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        this.log('Error loading claims from Supabase', error);
        return [];
      }

      const claims = data || [];
      this.log('Successfully loaded claims from Supabase', { count: claims.length });

      return claims.map(claim => ({
        id: claim.id,
        retailer_id: claim.retailer_id,
        location_id: claim.location_id,
        order_id: claim.order_id,
        product_id: claim.product_id,
        customer_id: claim.customer_id,
        reason: claim.reason,
        status: claim.status,
        resolution_notes: claim.resolution_notes,
        description: claim.description,
        attachments: claim.attachments ? JSON.parse(claim.attachments) : [],
        metadata: claim.metadata ? JSON.parse(claim.metadata) : {},
        created_by: claim.created_by,
        created_at: claim.created_at,
        updated_at: claim.updated_at,
        createdAt: claim.created_at,
        updatedAt: claim.updated_at,
        source: 'supabase'
      }));

    } catch (error) {
      this.log('Exception loading claims', error);
      return [];
    }
  }

  /**
   * Save shipments to Supabase shipments table
   */
  async saveShipments(shipments: any[], userId?: string): Promise<boolean> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        throw new Error('No authenticated user for saving shipments');
      }

      this.log('Saving shipments to Supabase shipments table', { count: shipments.length, userId: effectiveUserId });

      const shipmentsToInsert = shipments.map(shipment => ({
        id: shipment.id,
        order_id: shipment.order_id,
        retailer_id: shipment.retailer_id || '550e8400-e29b-41d4-a716-446655440000',
        shipping_profile_id: shipment.shipping_profile_id || null,
        tracking_number: shipment.tracking_number || null,
        carrier: shipment.carrier || null,
        service_level: shipment.service_level || null,
        status: shipment.status || 'PENDING',
        ship_date: shipment.ship_date || null,
        estimated_delivery_date: shipment.estimated_delivery_date || null,
        actual_delivery_date: shipment.actual_delivery_date || null,
        origin_address: shipment.origin_address ? JSON.stringify(shipment.origin_address) : null,
        destination_address: shipment.destination_address ? JSON.stringify(shipment.destination_address) : null,
        package_boxes: JSON.stringify(shipment.package_boxes || []),
        is_gift_shipment: shipment.is_gift_shipment || false,
        cost_usd: shipment.cost_usd || 0,
        label_url: shipment.label_url || null,
        metadata: JSON.stringify(shipment.metadata || {}),
        created_by: effectiveUserId,
        created_at: shipment.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('shipments')
        .upsert(shipmentsToInsert, { onConflict: 'id' })
        .select();

      if (error) {
        this.log('Error saving shipments to Supabase', error);
        return false;
      }

      this.log('Successfully saved shipments to Supabase', { upserted: data?.length });
      return true;

    } catch (error) {
      this.log('Exception saving shipments', error);
      return false;
    }
  }

  /**
   * Load shipments from Supabase shipments table
   */
  async loadShipments(userId?: string): Promise<any[]> {
    try {
      // Get the authenticated Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        this.log('No authenticated user for loading shipments');
        return [];
      }

      this.log('Loading shipments from Supabase shipments table', { userId: effectiveUserId });

      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('created_by', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        this.log('Error loading shipments from Supabase', error);
        return [];
      }

      const shipments = data || [];
      this.log('Successfully loaded shipments from Supabase', { count: shipments.length });

      return shipments.map(shipment => ({
        id: shipment.id,
        order_id: shipment.order_id,
        retailer_id: shipment.retailer_id,
        shipping_profile_id: shipment.shipping_profile_id,
        tracking_number: shipment.tracking_number,
        carrier: shipment.carrier,
        service_level: shipment.service_level,
        status: shipment.status,
        ship_date: shipment.ship_date,
        estimated_delivery_date: shipment.estimated_delivery_date,
        actual_delivery_date: shipment.actual_delivery_date,
        origin_address: shipment.origin_address ? JSON.parse(shipment.origin_address) : null,
        destination_address: shipment.destination_address ? JSON.parse(shipment.destination_address) : null,
        package_boxes: shipment.package_boxes ? JSON.parse(shipment.package_boxes) : [],
        is_gift_shipment: shipment.is_gift_shipment,
        cost_usd: shipment.cost_usd,
        label_url: shipment.label_url,
        metadata: shipment.metadata ? JSON.parse(shipment.metadata) : {},
        created_by: shipment.created_by,
        created_at: shipment.created_at,
        updated_at: shipment.updated_at,
        createdAt: shipment.created_at,
        updatedAt: shipment.updated_at,
        source: 'supabase'
      }));

    } catch (error) {
      this.log('Exception loading shipments', error);
      return [];
    }
  }

  /**
   * Test Supabase connection and permissions
   */
  async testConnection(): Promise<{ success: boolean; details: any }> {
    try {
      this.log('Testing Supabase connection and permissions');

      const result = {
        success: false,
        details: {
          auth: false,
          customers_table: false,
          orders_table: false,
          claims_table: false,
          shipments_table: false,
          user_storage_table: false,
          can_insert: false,
          can_select: false,
          errors: []
        }
      };

      // Test auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        result.details.errors.push(`Auth failed: ${authError?.message || 'No user'}`);
      } else {
        result.details.auth = true;
        this.log('Auth test passed', { userId: user.id });
      }

      // Test customers table
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id')
          .limit(1);

        if (error) {
          result.details.errors.push(`Customers table error: ${error.message}`);
        } else {
          result.details.customers_table = true;
          result.details.can_select = true;
          this.log('Customers table test passed');
        }
      } catch (error: any) {
        result.details.errors.push(`Customers table exception: ${error.message}`);
      }

      // Test orders table
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id')
          .limit(1);

        if (error) {
          result.details.errors.push(`Orders table error: ${error.message}`);
        } else {
          result.details.orders_table = true;
          this.log('Orders table test passed');
        }
      } catch (error: any) {
        result.details.errors.push(`Orders table exception: ${error.message}`);
      }

      // Test claims table
      try {
        const { data, error } = await supabase
          .from('claims')
          .select('id')
          .limit(1);

        if (error) {
          result.details.errors.push(`Claims table error: ${error.message}`);
        } else {
          result.details.claims_table = true;
          this.log('Claims table test passed');
        }
      } catch (error: any) {
        result.details.errors.push(`Claims table exception: ${error.message}`);
      }

      // Test shipments table
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('id')
          .limit(1);

        if (error) {
          result.details.errors.push(`Shipments table error: ${error.message}`);
        } else {
          result.details.shipments_table = true;
          this.log('Shipments table test passed');
        }
      } catch (error: any) {
        result.details.errors.push(`Shipments table exception: ${error.message}`);
      }

      // Test user_storage table
      try {
        const { data, error } = await supabase
          .from('user_storage')
          .select('id')
          .limit(1);

        if (error) {
          result.details.errors.push(`User storage table error: ${error.message}`);
        } else {
          result.details.user_storage_table = true;
          this.log('User storage table test passed');
        }
      } catch (error: any) {
        result.details.errors.push(`User storage table exception: ${error.message}`);
      }

      // Test insert permission (only if auth passed)
      if (result.details.auth && user) {
        try {
          const testCustomer = {
            id: 'test-' + Date.now(),
            name: 'Connection Test Customer',
            email: 'test@connection.com',
            created_by: user.id,
            retailer_id: '550e8400-e29b-41d4-a716-446655440000'
          };

          const { data, error } = await supabase
            .from('customers')
            .insert(testCustomer)
            .select()
            .single();

          if (error) {
            result.details.errors.push(`Insert test failed: ${error.message}`);
          } else {
            result.details.can_insert = true;
            this.log('Insert test passed');

            // Clean up test customer
            await supabase
              .from('customers')
              .delete()
              .eq('id', testCustomer.id);
          }
        } catch (error: any) {
          result.details.errors.push(`Insert test exception: ${error.message}`);
        }
      }

      result.success = result.details.auth && 
                      result.details.customers_table && 
                      result.details.orders_table &&
                      result.details.claims_table &&
                      result.details.shipments_table &&
                      result.details.user_storage_table &&
                      result.details.can_select;

      this.log('Connection test completed', result);
      return result;

    } catch (error: any) {
      this.log('Connection test failed', error);
      return {
        success: false,
        details: {
          auth: false,
          customers_table: false,
          user_storage_table: false,
          can_insert: false,
          can_select: false,
          errors: [`Test exception: ${error.message}`]
        }
      };
    }
  }
}

// Export singleton instance
export const supabasePersistence = new SupabasePersistenceManager();