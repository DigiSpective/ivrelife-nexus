/**
 * Product and Shipping Types for IV RELIFE
 * Based on XML specification for /products route implementation
 */

// Product Core Types
export interface ProductDimensions {
  height: number;
  width: number;
  length: number;
}

export interface PackageBox {
  label: string;
  length_in: number;
  width_in: number;
  height_in: number;
  weight_lbs: number;
}

export interface Product {
  id: string; // Primary canonical ID (slug)
  sku?: string;
  name: string;
  description?: string;
  category: 'Massage Chair' | 'Spa' | 'Accessory';
  tags?: string[];
  price_usd: number;
  msrp_usd?: number;
  sale_price_usd?: number;
  available: boolean;
  colors?: string[];
  dimensions_in?: ProductDimensions;
  weight_lbs?: number;
  package_boxes?: PackageBox[];
  white_glove_available: boolean;
  white_glove_price_usd?: number;
  extended_warranty_years?: number;
  extended_warranty_price_usd?: number;
  shipping_profile_id: string;
  gift_eligible?: boolean;
  gift_rule_id?: string;
  images?: string[];
  featured_image?: string;
}

// Shipping Profile Types
export interface ShippingProfile {
  id: string;
  name: 'standard_curbside' | 'white_glove' | 'small_parcel' | 'oversized_freight';
  lead_time_days_min: number;
  lead_time_days_max: number;
  carrier_options: string[];
  requires_signature: boolean;
  assembly_included: boolean;
  base_price_usd: number;
  per_mile_fee_usd?: number;
}

// Gift Rule Types
export interface GiftRule {
  id: string;
  name: string;
  trigger_product_ids: string[];
  min_order_value_usd?: number;
  min_product_price_usd?: number;
  auto_add_gift: boolean;
  gift_product_id: string;
  gift_quantity: number;
  gift_shipping_option: 'small_parcel' | 'included_with_main' | 'white_glove';
  gift_price_zeroed: boolean;
  admin_approval_required: boolean;
  one_gift_per_order: boolean;
  notes?: string;
}

// Return Policy Types
export interface ReturnPolicy {
  restocking_fee_percent: number;
  return_flat_fee_usd: number;
  return_window_days: number;
  customer_responsible_for_return_shipping: boolean;
}

// Cart and Order Types
export interface CartLineItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  color?: string;
  price_override?: number;
  is_gift: boolean;
  gift_rule_id?: string;
  shipping_profile_id: string;
  white_glove_selected: boolean;
  extended_warranty_selected: boolean;
}

export interface CartShipment {
  id: string;
  shipment_type: 'main' | 'gift' | 'return';
  shipping_profile_id: string;
  line_items: CartLineItem[];
  estimated_cost: number;
  estimated_delivery_days: number;
  carrier_name?: string;
}

export interface Cart {
  id: string;
  line_items: CartLineItem[];
  shipments: CartShipment[];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  gift_suggestions: GiftSuggestion[];
}

export interface GiftSuggestion {
  gift_rule: GiftRule;
  gift_product: Product;
  trigger_products: Product[];
  eligible: boolean;
  reason?: string;
}

// Order Types
export interface OrderShipment {
  shipment_id: string;
  order_id: string;
  shipment_type: 'main' | 'gift' | 'return';
  shipping_profile_id: string;
  carrier_quote_id?: string;
  carrier_name?: string;
  tracking_number?: string;
  estimated_delivery_window?: string;
  status: 'pending' | 'prepared' | 'shipped' | 'delivered' | 'exception';
}

export interface Order {
  id: string;
  customer_id: string;
  line_items: CartLineItem[];
  shipments: OrderShipment[];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  status: 'pending' | 'processing' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Filter and Search Types
export interface ProductFilters {
  category?: string[];
  tags?: string[];
  price_range?: {
    min: number;
    max: number;
  };
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  search?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  filters: ProductFilters;
}

// Admin Types
export interface AdminProductUpdate {
  gift_eligible?: boolean;
  gift_rule_id?: string;
  white_glove_available?: boolean;
  white_glove_price_usd?: number;
  package_boxes?: PackageBox[];
  shipping_profile_id?: string;
  available?: boolean;
  price_usd?: number;
}

export interface AdminGiftRuleCreate {
  name: string;
  trigger_product_ids: string[];
  min_order_value_usd?: number;
  min_product_price_usd?: number;
  auto_add_gift: boolean;
  gift_product_id: string;
  gift_quantity: number;
  gift_shipping_option: 'small_parcel' | 'included_with_main' | 'white_glove';
  gift_price_zeroed: boolean;
  admin_approval_required: boolean;
  one_gift_per_order: boolean;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
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
  };
}

// Shipping Estimate Types
export interface ShippingEstimate {
  shipping_profile_id: string;
  carrier_name: string;
  service_type: string;
  estimated_cost: number;
  estimated_delivery_days: number;
  requires_freight_quote: boolean;
}

export interface ShippingEstimateRequest {
  items: {
    product_id: string;
    quantity: number;
    package_boxes: PackageBox[];
  }[];
  destination: {
    zip_code: string;
    state: string;
  };
  shipping_profile_ids: string[];
}