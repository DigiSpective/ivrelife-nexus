// Type definitions for IV RELIFE system based on SQL schema

export interface User {
  id: string;
  email: string;
  role: 'owner' | 'backoffice' | 'retailer' | 'location';
  retailer_id?: string;
  location_id?: string;
  name: string;
  avatar?: string;
}

export interface AppRole {
  role_name: string;
  description: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  retailer_id?: string;
  location_id?: string;
  created_at: string;
}

export interface Retailer {
  id: string;
  name: string;
  website?: string;
  created_at: string;
}

export interface Location {
  id: string;
  retailer_id: string;
  name: string;
  address?: any; // JSONB field
  phone?: string;
  timezone?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  retailer_id?: string;
  primary_location_id?: string;
  name: string;
  email?: string;
  phone?: string;
  default_address?: any; // JSONB field
  notes?: string;
  external_ids?: any; // JSONB field
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  type: 'email' | 'phone' | 'other';
  value: string;
  label?: string;
  verified: boolean;
  created_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address: any; // JSONB field
  label?: string;
  primary: boolean;
  created_at: string;
}

export interface CustomerDocument {
  id: string;
  customer_id: string;
  retailer_id?: string;
  location_id?: string;
  bucket: string;
  storage_path: string;
  purpose: 'id_photo' | 'signature' | 'contract' | 'other';
  content_type?: string;
  uploaded_by?: string;
  metadata?: any; // JSONB field
  created_at: string;
}

export interface CustomerActivity {
  id: string;
  customer_id?: string;
  actor_id?: string;
  actor_role?: string;
  action: string;
  payload?: any; // JSONB field
  created_at: string;
}

export interface CustomerMergeRequest {
  id: string;
  primary_customer_id: string;
  duplicate_customer_id: string;
  proposed_merge_payload: any; // JSONB field
  requested_by?: string;
  requested_at: string;
  approved: boolean;
  processed_at?: string;
}

export interface ProductCategory {
  id: string;
  retailer_id?: string;
  name: string;
  requires_ltl: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  retailer_id?: string;
  category_id?: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  height_cm?: number;
  width_cm?: number;
  depth_cm?: number;
  weight_kg?: number;
  color?: string;
  ltl_flag: boolean;
  inventory_qty: number;
  created_at: string;
}

export type OrderStatus = 'draft' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'completed';

export interface Order {
  id: string;
  retailer_id: string;
  location_id: string;
  customer_id: string;
  created_by: string;
  status: OrderStatus;
  total_amount: number;
  signature_url?: string;
  id_photo_url?: string;
  contract_url?: string;
  requires_ltl: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  qty: number;
  unit_price: number;
  created_at: string;
}

export interface ShippingProvider {
  id: string;
  name: string;
  api_identifier?: string;
  config?: any; // JSONB field
  created_at: string;
}

export interface ShippingMethod {
  id: string;
  provider_id: string;
  name: string;
  speed_estimate?: string;
  supports_ltl: boolean;
  created_at: string;
}

export interface ShippingQuote {
  id: string;
  provider_id?: string;
  method_id?: string;
  order_id?: string;
  retailer_id?: string;
  location_id?: string;
  cost?: number;
  eta?: string;
  payload_json?: any; // JSONB field
  created_at: string;
  expires_at?: string;
}

export type FulfillmentStatus = 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled';

export interface Fulfillment {
  id: string;
  order_id?: string;
  provider_id?: string;
  method_id?: string;
  tracking_number?: string;
  status: FulfillmentStatus;
  assigned_to?: string;
  retailer_id?: string;
  location_id?: string;
  last_status_raw?: any; // JSONB field
  last_check?: string;
  created_at: string;
  updated_at: string;
}

export type ClaimStatus = 'submitted' | 'in_review' | 'approved' | 'rejected' | 'resolved';

export interface Claim {
  id: string;
  retailer_id: string;
  location_id?: string;
  order_id?: string;
  product_id?: string;
  reason: string;
  status: ClaimStatus;
  resolution_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id: string;
  details?: any; // JSONB field
  created_at: string;
}

export interface OutboxEvent {
  id: string;
  event_type: string;
  entity: string;
  entity_id: string;
  payload: any; // JSONB field
  processed_at?: string;
  created_at: string;
}

export interface FileMetadata {
  id: string;
  supabase_storage_path: string;
  bucket: string;
  uploaded_by?: string;
  retailer_id?: string;
  location_id?: string;
  purpose: string;
  content_type?: string;
  size_bytes?: number;
  created_at: string;
}