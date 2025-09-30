/**
 * Data transformation utilities for consistent data handling
 * between UI, persistence, and API layers
 */

import { Order } from '@/types';

export interface SupabaseOrderRecord {
  id: string;
  retailer_id: string;
  location_id?: string | null;
  customer_id?: string | null;
  status: string;
  total_amount: number;
  signature_url?: string | null;
  id_photo_url?: string | null;
  contract_url?: string | null;
  requires_ltl: boolean;
  items: string; // JSON string
  shipping_address?: string | null; // JSON string
  billing_address?: string | null; // JSON string
  metadata?: string | null; // JSON string
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AppOrderFormat extends Order {
  totalAmount?: number; // Alias for total_amount
  items: any[]; // Parsed items array
  shipping_address?: any; // Parsed address object
  billing_address?: any; // Parsed address object
  metadata?: any; // Parsed metadata object
}

/**
 * Transform app order format to Supabase record format
 */
export function appOrderToSupabaseRecord(order: any, userId: string): SupabaseOrderRecord {
  return {
    id: order.id,
    retailer_id: order.retailer_id || '550e8400-e29b-41d4-a716-446655440000',
    location_id: order.location_id || null,
    customer_id: order.customer_id || null,
    status: order.status || 'pending',
    total_amount: order.total_amount || order.totalAmount || 0,
    signature_url: order.signature_url || null,
    id_photo_url: order.id_photo_url || null,
    contract_url: order.contract_url || null,
    requires_ltl: order.requires_ltl || false,
    items: JSON.stringify(order.items || []),
    shipping_address: order.shipping_address ? JSON.stringify(order.shipping_address) : null,
    billing_address: order.billing_address ? JSON.stringify(order.billing_address) : null,
    metadata: JSON.stringify(order.metadata || {}),
    created_by: userId,
    created_at: order.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Transform Supabase record format to app order format
 */
export function supabaseRecordToAppOrder(record: SupabaseOrderRecord): AppOrderFormat {
  return {
    id: record.id,
    retailer_id: record.retailer_id,
    location_id: record.location_id,
    customer_id: record.customer_id,
    status: record.status,
    total_amount: record.total_amount,
    totalAmount: record.total_amount, // Alias for compatibility
    signature_url: record.signature_url,
    id_photo_url: record.id_photo_url,
    contract_url: record.contract_url,
    requires_ltl: record.requires_ltl,
    items: safeJsonParse(record.items, []),
    shipping_address: safeJsonParse(record.shipping_address, null),
    billing_address: safeJsonParse(record.billing_address, null),
    metadata: safeJsonParse(record.metadata, {}),
    created_by: record.created_by,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
}

/**
 * Safely parse JSON string with fallback
 */
function safeJsonParse(jsonString: string | null, fallback: any): any {
  if (!jsonString) return fallback;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
    return fallback;
  }
}

/**
 * Validate order data structure
 */
export function validateOrderData(order: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!order.id) errors.push('Order ID is required');
  if (!order.status) errors.push('Order status is required');
  if (typeof order.total_amount !== 'number' && typeof order.totalAmount !== 'number') {
    errors.push('Order total amount is required');
  }
  if (!order.created_by) errors.push('Order creator ID is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a new order with proper defaults
 */
export function createOrderWithDefaults(orderData: any, userId: string): AppOrderFormat {
  return {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    retailer_id: '550e8400-e29b-41d4-a716-446655440000',
    location_id: null,
    customer_id: null,
    status: 'pending',
    total_amount: 0,
    totalAmount: 0,
    signature_url: null,
    id_photo_url: null,
    contract_url: null,
    requires_ltl: false,
    items: [],
    shipping_address: null,
    billing_address: null,
    metadata: {},
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...orderData // Override defaults with provided data
  };
}