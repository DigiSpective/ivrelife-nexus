/**
 * Sample Shipping Data for IV RELIFE
 * Demo data for shipping profiles, rates, and shipments
 */

import {
  ShippingProfile,
  ShippingSettings,
  CarrierSettings,
  ShippingZone,
  Shipment
} from '@/types/shipping';

export const sampleShippingProfiles: ShippingProfile[] = [
  {
    id: 'ups_ground',
    method_id: 'standard_parcel',
    carrier: 'UPS',
    service_level: 'Ground',
    base_rate_usd: 15.99,
    handling_fee_usd: 2.00,
    zone: 'domestic',
    supports_international: false,
    requires_signature: false,
    assembly_included: false,
    lead_time_days_min: 1,
    lead_time_days_max: 5
  },
  {
    id: 'ups_2day',
    method_id: 'standard_parcel',
    carrier: 'UPS',
    service_level: '2nd Day Air',
    base_rate_usd: 24.99,
    handling_fee_usd: 2.00,
    zone: 'domestic',
    supports_international: false,
    requires_signature: true,
    assembly_included: false,
    lead_time_days_min: 2,
    lead_time_days_max: 2
  },
  {
    id: 'ups_express',
    method_id: 'standard_parcel',
    carrier: 'UPS',
    service_level: 'Next Day Air',
    base_rate_usd: 45.99,
    handling_fee_usd: 2.00,
    zone: 'domestic',
    supports_international: false,
    requires_signature: true,
    assembly_included: false,
    lead_time_days_min: 1,
    lead_time_days_max: 1
  },
  {
    id: 'fedex_ground',
    method_id: 'standard_parcel',
    carrier: 'FedEx',
    service_level: 'Ground',
    base_rate_usd: 16.49,
    handling_fee_usd: 1.50,
    zone: 'domestic',
    supports_international: false,
    requires_signature: false,
    assembly_included: false,
    lead_time_days_min: 1,
    lead_time_days_max: 5
  },
  {
    id: 'white_glove_standard',
    method_id: 'white_glove',
    carrier: 'UPS',
    service_level: 'White Glove Home Delivery',
    base_rate_usd: 700.00,
    handling_fee_usd: 0.00,
    zone: 'domestic',
    supports_international: false,
    requires_signature: true,
    assembly_included: true,
    lead_time_days_min: 5,
    lead_time_days_max: 14
  },
  {
    id: 'ltl_standard',
    method_id: 'oversized_freight',
    carrier: 'LTL_Freight',
    service_level: 'Standard LTL',
    base_rate_usd: 299.99,
    handling_fee_usd: 25.00,
    zone: 'domestic',
    supports_international: false,
    requires_signature: true,
    assembly_included: false,
    lead_time_days_min: 7,
    lead_time_days_max: 21
  },
  {
    id: 'ltl_expedited',
    method_id: 'oversized_freight',
    carrier: 'LTL_Freight',
    service_level: 'Expedited LTL',
    base_rate_usd: 449.99,
    handling_fee_usd: 25.00,
    zone: 'domestic',
    supports_international: false,
    requires_signature: true,
    assembly_included: false,
    lead_time_days_min: 3,
    lead_time_days_max: 7
  }
];

export const sampleShippingSettings: ShippingSettings = {
  white_glove_flat_fee_usd: 700.00,
  parcel_handling_fee_percent: 0.03,
  oversized_freight_thresholds: {
    weight_lbs: 200,
    dimension_in: 70
  },
  international_white_glove_allowed: false,
  default_origin_address: {
    name: 'IV RELIFE Distribution Center',
    company: 'IV RELIFE',
    street1: '2500 Warehouse Boulevard',
    street2: 'Suite 100',
    city: 'Dallas',
    state: 'TX',
    postal_code: '75201',
    country: 'US',
    phone: '1-800-IV-RELIFE',
    email: 'shipping@ivrelife.com'
  },
  supported_countries: ['US', 'CA', 'MX'],
  free_shipping_threshold_usd: 1000.00
};

export const sampleCarrierSettings: CarrierSettings[] = [
  {
    carrier_name: 'UPS',
    enabled: true,
    api_credentials: {
      api_key: process.env.UPS_API_KEY || '',
      api_secret: process.env.UPS_API_SECRET || '',
      account_number: process.env.UPS_ACCOUNT_NUMBER || ''
    },
    service_levels: [
      {
        service_code: 'ups_ground',
        service_name: 'UPS Ground',
        estimated_days_min: 1,
        estimated_days_max: 5,
        enabled: true,
        cost_multiplier: 1.0
      },
      {
        service_code: 'ups_2day',
        service_name: 'UPS 2nd Day Air',
        estimated_days_min: 2,
        estimated_days_max: 2,
        enabled: true,
        cost_multiplier: 1.6
      },
      {
        service_code: 'ups_express',
        service_name: 'UPS Next Day Air',
        estimated_days_min: 1,
        estimated_days_max: 1,
        enabled: true,
        cost_multiplier: 2.8
      }
    ],
    restrictions: {
      max_weight_lbs: 150,
      max_dimension_in: 108,
      international_enabled: true
    }
  },
  {
    carrier_name: 'FedEx',
    enabled: true,
    api_credentials: {
      api_key: process.env.FEDEX_API_KEY || '',
      api_secret: process.env.FEDEX_API_SECRET || '',
      account_number: process.env.FEDEX_ACCOUNT_NUMBER || ''
    },
    service_levels: [
      {
        service_code: 'fedex_ground',
        service_name: 'FedEx Ground',
        estimated_days_min: 1,
        estimated_days_max: 5,
        enabled: true,
        cost_multiplier: 1.1
      },
      {
        service_code: 'fedex_2day',
        service_name: 'FedEx 2Day',
        estimated_days_min: 2,
        estimated_days_max: 2,
        enabled: true,
        cost_multiplier: 1.5
      },
      {
        service_code: 'fedex_express',
        service_name: 'FedEx Express',
        estimated_days_min: 1,
        estimated_days_max: 1,
        enabled: true,
        cost_multiplier: 2.5
      }
    ],
    restrictions: {
      max_weight_lbs: 150,
      max_dimension_in: 119,
      international_enabled: true
    }
  },
  {
    carrier_name: 'DHL',
    enabled: false,
    api_credentials: {
      api_key: process.env.DHL_API_KEY || '',
      api_secret: process.env.DHL_API_SECRET || '',
      account_number: process.env.DHL_ACCOUNT_NUMBER || ''
    },
    service_levels: [
      {
        service_code: 'dhl_express',
        service_name: 'DHL Express',
        estimated_days_min: 1,
        estimated_days_max: 3,
        enabled: false,
        cost_multiplier: 3.0
      }
    ],
    restrictions: {
      max_weight_lbs: 70,
      max_dimension_in: 120,
      international_enabled: true
    }
  }
];

export const sampleShippingZones: ShippingZone[] = [
  {
    id: 'zone_1_local',
    name: 'Zone 1 - Local (Texas & Surrounding)',
    countries: ['US'],
    states: ['TX', 'OK', 'AR', 'LA', 'NM'],
    multiplier: 1.0,
    base_cost_usd: 12.99
  },
  {
    id: 'zone_2_southwest',
    name: 'Zone 2 - Southwest',
    countries: ['US'],
    states: ['AZ', 'CO', 'UT', 'NV', 'KS', 'MO'],
    multiplier: 1.2,
    base_cost_usd: 15.99
  },
  {
    id: 'zone_3_west',
    name: 'Zone 3 - West Coast',
    countries: ['US'],
    states: ['CA', 'OR', 'WA', 'ID', 'MT', 'WY'],
    multiplier: 1.4,
    base_cost_usd: 19.99
  },
  {
    id: 'zone_4_midwest',
    name: 'Zone 4 - Midwest',
    countries: ['US'],
    states: ['IL', 'IN', 'IA', 'MI', 'MN', 'ND', 'NE', 'OH', 'SD', 'WI'],
    multiplier: 1.3,
    base_cost_usd: 18.99
  },
  {
    id: 'zone_5_southeast',
    name: 'Zone 5 - Southeast',
    countries: ['US'],
    states: ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
    multiplier: 1.3,
    base_cost_usd: 18.99
  },
  {
    id: 'zone_6_northeast',
    name: 'Zone 6 - Northeast',
    countries: ['US'],
    states: ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
    multiplier: 1.5,
    base_cost_usd: 21.99
  },
  {
    id: 'zone_7_alaska_hawaii',
    name: 'Zone 7 - Alaska & Hawaii',
    countries: ['US'],
    states: ['AK', 'HI'],
    multiplier: 2.5,
    base_cost_usd: 45.99
  },
  {
    id: 'zone_8_canada',
    name: 'Zone 8 - Canada',
    countries: ['CA'],
    multiplier: 2.0,
    base_cost_usd: 35.99
  },
  {
    id: 'zone_9_mexico',
    name: 'Zone 9 - Mexico',
    countries: ['MX'],
    multiplier: 2.2,
    base_cost_usd: 39.99
  }
];

export const sampleShipments: Shipment[] = [
  {
    id: 'ship_20240115_001',
    order_id: 'ord_20240115_001',
    shipping_profile_id: 'white_glove_standard',
    tracking_number: '1Z999AA1234567890',
    carrier: 'UPS',
    service_level: 'White Glove Home Delivery',
    status: 'SHIPPED',
    ship_date: '2024-01-15T09:00:00Z',
    estimated_delivery_date: '2024-01-22T17:00:00Z',
    origin_address: sampleShippingSettings.default_origin_address,
    destination_address: {
      name: 'Sarah Johnson',
      street1: '1234 Maple Street',
      street2: 'Apt 5B',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      country: 'US',
      phone: '512-555-0123',
      email: 'sarah.johnson@email.com'
    },
    package_boxes: [
      {
        id: 'pkg_boss_plus_main',
        name: 'Boss Plus Massage Chair - Main Unit',
        length_in: 73,
        width_in: 30,
        height_in: 33,
        weight_lbs: 227,
        value_usd: 11990
      }
    ],
    is_gift_shipment: false,
    metadata: {
      white_glove_notes: 'White glove delivery and assembly for Boss Plus massage chair',
      assembly_instructions: 'Full assembly required. Customer will be called 24-48 hours before delivery to schedule.',
      delivery_instructions: 'Call customer upon arrival. Assembly location: Living room'
    },
    cost_usd: 700.00,
    created_at: '2024-01-15T08:30:00Z',
    updated_at: '2024-01-15T09:15:00Z'
  },
  {
    id: 'ship_20240115_002',
    order_id: 'ord_20240115_001',
    shipping_profile_id: 'ups_ground',
    tracking_number: '1Z999AA1234567891',
    carrier: 'UPS',
    service_level: 'Ground',
    status: 'DELIVERED',
    ship_date: '2024-01-10T14:30:00Z',
    estimated_delivery_date: '2024-01-15T17:00:00Z',
    actual_delivery_date: '2024-01-14T16:30:00Z',
    origin_address: sampleShippingSettings.default_origin_address,
    destination_address: {
      name: 'Sarah Johnson',
      street1: '1234 Maple Street',
      street2: 'Apt 5B',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      country: 'US',
      phone: '512-555-0123',
      email: 'sarah.johnson@email.com'
    },
    package_boxes: [
      {
        id: 'pkg_mini_massage_gun',
        name: 'Mini Massage Gun - Gift',
        length_in: 8,
        width_in: 6,
        height_in: 3,
        weight_lbs: 2,
        value_usd: 79
      }
    ],
    is_gift_shipment: true,
    metadata: {
      gift_message: 'Complimentary mini massage gun - Thank you for your purchase!'
    },
    cost_usd: 0.00,
    created_at: '2024-01-10T13:00:00Z',
    updated_at: '2024-01-14T16:45:00Z'
  },
  {
    id: 'ship_20240112_001',
    order_id: 'ord_20240112_001',
    shipping_profile_id: 'ltl_standard',
    tracking_number: 'XPO123456789',
    carrier: 'LTL_Freight',
    service_level: 'Standard LTL',
    status: 'PENDING',
    origin_address: sampleShippingSettings.default_origin_address,
    destination_address: {
      name: 'Michael Chen',
      company: 'Chen Wellness Spa',
      street1: '9876 Business Drive',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90210',
      country: 'US',
      phone: '310-555-0456',
      email: 'michael@chenwellness.com'
    },
    package_boxes: [
      {
        id: 'pkg_spa_capsule_main',
        name: 'Spa Capsule Deluxe - Main Unit',
        length_in: 90,
        width_in: 40,
        height_in: 36,
        weight_lbs: 300,
        value_usd: 18999
      },
      {
        id: 'pkg_spa_capsule_control',
        name: 'Spa Capsule Deluxe - Control Unit',
        length_in: 24,
        width_in: 18,
        height_in: 24,
        weight_lbs: 75,
        value_usd: 1000
      }
    ],
    is_gift_shipment: false,
    metadata: {
      ltl_notes: 'Commercial delivery to spa business. Forklift available for unloading.',
      delivery_instructions: 'Delivery Monday-Friday 9AM-5PM. Contact before delivery.'
    },
    cost_usd: 299.99,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z'
  },
  {
    id: 'ship_20240110_001',
    order_id: 'ord_20240110_001',
    shipping_profile_id: 'fedex_2day',
    tracking_number: '123456789012',
    carrier: 'FedEx',
    service_level: '2Day',
    status: 'DELIVERED',
    ship_date: '2024-01-08T11:00:00Z',
    estimated_delivery_date: '2024-01-10T17:00:00Z',
    actual_delivery_date: '2024-01-10T14:22:00Z',
    origin_address: sampleShippingSettings.default_origin_address,
    destination_address: {
      name: 'Emily Rodriguez',
      street1: '456 Oak Avenue',
      city: 'Denver',
      state: 'CO',
      postal_code: '80202',
      country: 'US',
      phone: '303-555-0789',
      email: 'emily.rodriguez@email.com'
    },
    package_boxes: [
      {
        id: 'pkg_essential_oils',
        name: 'Essential Oils Relaxation Set',
        length_in: 12,
        width_in: 8,
        height_in: 4,
        weight_lbs: 3,
        value_usd: 149
      }
    ],
    is_gift_shipment: false,
    cost_usd: 24.99,
    created_at: '2024-01-08T09:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  }
];

// Utility functions for working with sample data
export const getShippingProfileById = (id: string): ShippingProfile | undefined => {
  return sampleShippingProfiles.find(profile => profile.id === id);
};

export const getShippingProfilesByCarrier = (carrier: string): ShippingProfile[] => {
  return sampleShippingProfiles.filter(profile => profile.carrier === carrier);
};

export const getZoneByState = (state: string): ShippingZone | undefined => {
  return sampleShippingZones.find(zone => zone.states?.includes(state));
};

export const getZoneByCountry = (country: string): ShippingZone | undefined => {
  return sampleShippingZones.find(zone => zone.countries.includes(country));
};

export const getActiveCarriers = (): CarrierSettings[] => {
  return sampleCarrierSettings.filter(carrier => carrier.enabled);
};

export const getShipmentsByStatus = (status: string): Shipment[] => {
  return sampleShipments.filter(shipment => shipment.status === status);
};

export const getShipmentsByOrder = (orderId: string): Shipment[] => {
  return sampleShipments.filter(shipment => shipment.order_id === orderId);
};