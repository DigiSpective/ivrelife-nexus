/**
 * Shipping Types for IV RELIFE ShipStation Integration
 * Supports UPS, FedEx, DHL, LTL Freight, and White Glove services
 */

// Core Shipping Entities
export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface PackageBox {
  id?: string;
  name?: string;
  length_in: number;
  width_in: number;
  height_in: number;
  weight_lbs: number;
  value_usd?: number;
}

export interface ShippingProfile {
  id: string;
  method_id: 'standard_parcel' | 'white_glove' | 'oversized_freight';
  carrier: 'UPS' | 'FedEx' | 'DHL' | 'LTL_Freight';
  service_level: string;
  base_rate_usd: number;
  handling_fee_usd: number;
  zone?: string;
  supports_international: boolean;
  requires_signature: boolean;
  assembly_included: boolean;
  lead_time_days_min: number;
  lead_time_days_max: number;
}

export interface Shipment {
  id: string;
  order_id: string;
  shipping_profile_id: string;
  tracking_number?: string;
  carrier: string;
  service_level: string;
  status: 'PENDING' | 'LABEL_CREATED' | 'SHIPPED' | 'DELIVERED' | 'FAILED' | 'EXCEPTION';
  ship_date?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  origin_address: Address;
  destination_address: Address;
  package_boxes: PackageBox[];
  is_gift_shipment: boolean;
  metadata?: ShipmentMetadata;
  cost_usd: number;
  label_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ShipmentMetadata {
  white_glove_notes?: string;
  assembly_instructions?: string;
  ltl_notes?: string;
  delivery_instructions?: string;
  scheduled_delivery_window?: string;
  gift_message?: string;
}

// ShipStation API Types
export interface ShipStationRateRequest {
  items: ShipStationItem[];
  origin_zip: string;
  destination_zip: string;
  destination_country: string;
  shipping_method_id?: string;
  residential: boolean;
  signature_required?: boolean;
}

export interface ShipStationItem {
  product_id: string;
  sku?: string;
  quantity: number;
  weight_lbs: number;
  length_in: number;
  width_in: number;
  height_in: number;
  value_usd: number;
}

export interface ShipStationRateOption {
  carrier_name: string;
  service_level: string;
  cost_usd: number;
  estimated_days: number;
  shipping_method_id: string;
  zone?: string;
  is_international: boolean;
  requires_signature: boolean;
}

export interface ShipStationCreateShipmentRequest {
  order_id: string;
  shipping_method_id: string;
  package_boxes: PackageBox[];
  origin_address: Address;
  destination_address: Address;
  is_gift_shipment: boolean;
  metadata?: ShipmentMetadata;
  insurance_value_usd?: number;
  signature_required?: boolean;
}

export interface ShipStationCreateShipmentResponse {
  shipment_id: string;
  tracking_number: string;
  label_url: string;
  cost_usd: number;
  estimated_delivery_date?: string;
}

export interface ShipStationTrackingResponse {
  tracking_number: string;
  carrier_name: string;
  current_status: string;
  status_date: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  tracking_events: TrackingEvent[];
}

export interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

// Shipping Calculation Types
export interface ShippingRateRequest {
  items: CartLineItem[];
  destination_address: Address;
  origin_address?: Address;
  shipping_method_preferences?: string[];
}

export interface ShippingRateResponse {
  shipment_groups: ShipmentGroup[];
  total_cost_usd: number;
  estimated_delivery_days_min: number;
  estimated_delivery_days_max: number;
}

export interface ShipmentGroup {
  id: string;
  group_type: 'main' | 'gift' | 'ltl';
  items: CartLineItem[];
  rate_options: ShippingRateOption[];
  selected_rate?: ShippingRateOption;
  package_boxes: PackageBox[];
  requires_freight_quote: boolean;
}

export interface ShippingRateOption {
  shipping_profile_id: string;
  carrier_name: string;
  service_level: string;
  cost_usd: number;
  estimated_days: number;
  requires_signature: boolean;
  assembly_included: boolean;
  supports_tracking: boolean;
  restrictions?: string[];
}

// Cart Integration Types (using existing CartLineItem)
export interface CartLineItem {
  id: string;
  product_id: string;
  product: any; // Product interface from products.ts
  quantity: number;
  color?: string;
  price_override?: number;
  is_gift: boolean;
  gift_rule_id?: string;
  shipping_profile_id: string;
  white_glove_selected: boolean;
  extended_warranty_selected: boolean;
}

// Business Rules and Settings
export interface ShippingSettings {
  white_glove_flat_fee_usd: number;
  parcel_handling_fee_percent: number;
  oversized_freight_thresholds: {
    weight_lbs: number;
    dimension_in: number;
  };
  international_white_glove_allowed: boolean;
  default_origin_address: Address;
  supported_countries: string[];
  free_shipping_threshold_usd?: number;
}

export interface ShippingBusinessRules {
  oversized_items_ltl_only: boolean;
  gifts_separate_shipment: boolean;
  white_glove_assembly_required_only: boolean;
  international_restrictions: {
    white_glove_allowed: boolean;
    carriers_allowed: string[];
  };
}

// Admin Types
export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states?: string[];
  postal_code_ranges?: string[];
  multiplier: number;
  base_cost_usd: number;
}

export interface CarrierSettings {
  carrier_name: string;
  enabled: boolean;
  api_credentials: {
    api_key?: string;
    api_secret?: string;
    account_number?: string;
  };
  service_levels: CarrierServiceLevel[];
  restrictions: {
    max_weight_lbs: number;
    max_dimension_in: number;
    international_enabled: boolean;
  };
}

export interface CarrierServiceLevel {
  service_code: string;
  service_name: string;
  estimated_days_min: number;
  estimated_days_max: number;
  enabled: boolean;
  cost_multiplier: number;
}

// API Response Types
export interface ShippingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    request_id: string;
    rate_limit?: {
      remaining: number;
      reset_time: string;
    };
  };
}

// Webhook Types
export interface ShipStationWebhookEvent {
  resource_type: 'SHIPMENT';
  resource_id: string;
  event_type: 'SHIPMENT_SHIPPED' | 'SHIPMENT_DELIVERED' | 'SHIPMENT_EXCEPTION';
  timestamp: string;
  data: {
    shipment_id: string;
    order_id: string;
    tracking_number: string;
    carrier: string;
    status: string;
    delivery_date?: string;
  };
}

// Error Types
export interface ShippingError {
  code: 'RATE_CALCULATION_FAILED' | 'SHIPMENT_CREATION_FAILED' | 'CARRIER_UNAVAILABLE' | 'INVALID_ADDRESS' | 'OVERSIZED_ITEM' | 'INTERNATIONAL_RESTRICTION';
  message: string;
  details?: any;
  fallback_options?: ShippingRateOption[];
}

// Quote Types for LTL Freight
export interface LTLFreightQuote {
  quote_id: string;
  carrier_name: string;
  service_level: string;
  cost_usd: number;
  estimated_transit_days: number;
  valid_until: string;
  pickup_required: boolean;
  delivery_type: 'curbside' | 'threshold' | 'white_glove';
  special_services: string[];
  terms: string;
}

export interface LTLFreightQuoteRequest {
  origin_address: Address;
  destination_address: Address;
  items: {
    description: string;
    weight_lbs: number;
    length_in: number;
    width_in: number;
    height_in: number;
    quantity: number;
    value_usd: number;
    freight_class?: string;
  }[];
  pickup_date?: string;
  delivery_date?: string;
  special_services?: string[];
}

// Dashboard Display Types
export interface ShippingDashboardData {
  active_shipments: Shipment[];
  pending_shipments: Shipment[];
  recent_deliveries: Shipment[];
  rate_performance: {
    average_cost_usd: number;
    average_delivery_days: number;
    on_time_percentage: number;
  };
  carrier_performance: {
    carrier_name: string;
    shipment_count: number;
    average_cost_usd: number;
    on_time_percentage: number;
  }[];
}

export interface ShippingFilters {
  status?: string[];
  carrier?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  is_gift_shipment?: boolean;
  destination_country?: string[];
  search?: string;
}