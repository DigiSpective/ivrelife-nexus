/**
 * Sample Product Data for IV RELIFE
 * Based on XML specification samples
 */

import { Product, ShippingProfile, GiftRule, ReturnPolicy } from '@/types/products';

export const sampleProducts: Product[] = [
  {
    id: 'boss-plus',
    sku: 'BOSS-PLS-001',
    name: 'Boss Plus',
    description: 'Premium 4D massage chair with zero gravity, infrared therapy, and advanced massage techniques.',
    category: 'Massage Chair',
    tags: ['zero_gravity', 'infrared', '4d', 'premium'],
    price_usd: 11990.00,
    msrp_usd: 15000.00,
    available: false,
    colors: ['Black', 'Black/Champagne', 'Champagne', 'Black/Burgundy'],
    dimensions_in: {
      height: 46,
      width: 30,
      length: 61
    },
    weight_lbs: 192,
    package_boxes: [
      {
        label: 'main',
        length_in: 73,
        width_in: 30,
        height_in: 33,
        weight_lbs: 227
      }
    ],
    white_glove_available: true,
    white_glove_price_usd: 700,
    extended_warranty_years: 3,
    extended_warranty_price_usd: 999,
    shipping_profile_id: 'large_home_delivery_curbside_or_whiteglove',
    gift_eligible: true,
    gift_rule_id: 'gr_high_value_1',
    featured_image: '/images/products/boss-plus-hero.jpg',
    images: [
      '/images/products/boss-plus-1.jpg',
      '/images/products/boss-plus-2.jpg',
      '/images/products/boss-plus-3.jpg'
    ]
  },
  {
    id: 'arya',
    sku: 'ARYA-001',
    name: 'Arya',
    description: 'State-of-the-art massage chair featuring AdaptaFlow technology, infrared therapy, and IntelliScan body mapping.',
    category: 'Massage Chair',
    tags: ['adaptaflow', 'infrared', 'intelliscan', 'luxury'],
    price_usd: 24998.00,
    available: true,
    colors: ['Black/Gold', 'Slate Grey'],
    dimensions_in: {
      height: 46.5,
      width: 32.3,
      length: 67
    },
    weight_lbs: 242.5,
    package_boxes: [
      {
        label: 'main',
        length_in: 58.2,
        width_in: 30.3,
        height_in: 33.8,
        weight_lbs: 195
      },
      {
        label: 'armrest',
        length_in: 26.7,
        width_in: 13,
        height_in: 51.5,
        weight_lbs: 50
      }
    ],
    white_glove_available: true,
    white_glove_price_usd: 700,
    extended_warranty_years: 3,
    extended_warranty_price_usd: 999,
    shipping_profile_id: 'large_home_delivery_curbside_or_whiteglove',
    gift_eligible: true,
    gift_rule_id: 'gr_high_value_1',
    featured_image: '/images/products/arya-hero.jpg',
    images: [
      '/images/products/arya-1.jpg',
      '/images/products/arya-2.jpg',
      '/images/products/arya-3.jpg'
    ]
  },
  {
    id: 'prince-relaxio',
    sku: 'PRINCE-RLX-001',
    name: 'Prince Relaxio',
    description: 'Compact luxury massage chair perfect for smaller spaces without compromising on features.',
    category: 'Massage Chair',
    tags: ['compact', 'space_saving', 'full_body'],
    price_usd: 7999.00,
    msrp_usd: 9999.00,
    available: true,
    colors: ['Black', 'Brown', 'Cream'],
    dimensions_in: {
      height: 44,
      width: 28,
      length: 58
    },
    weight_lbs: 165,
    package_boxes: [
      {
        label: 'main',
        length_in: 70,
        width_in: 28,
        height_in: 32,
        weight_lbs: 185
      }
    ],
    white_glove_available: true,
    white_glove_price_usd: 500,
    extended_warranty_years: 2,
    extended_warranty_price_usd: 699,
    shipping_profile_id: 'large_home_delivery_curbside_or_whiteglove',
    gift_eligible: true,
    gift_rule_id: 'gr_high_value_1',
    featured_image: '/images/products/prince-relaxio-hero.jpg',
    images: [
      '/images/products/prince-relaxio-1.jpg',
      '/images/products/prince-relaxio-2.jpg'
    ]
  },
  {
    id: 'spa-capsule-deluxe',
    sku: 'SPA-CAP-DLX-001',
    name: 'Spa Capsule Deluxe',
    description: 'Professional-grade spa capsule for ultimate relaxation and wellness treatments.',
    category: 'Spa',
    tags: ['spa', 'professional', 'wellness', 'infrared'],
    price_usd: 18999.00,
    available: true,
    dimensions_in: {
      height: 52,
      width: 36,
      length: 84
    },
    weight_lbs: 450,
    package_boxes: [
      {
        label: 'main_unit',
        length_in: 90,
        width_in: 40,
        height_in: 36,
        weight_lbs: 300
      },
      {
        label: 'control_unit',
        length_in: 24,
        width_in: 18,
        height_in: 24,
        weight_lbs: 75
      },
      {
        label: 'accessories',
        length_in: 36,
        width_in: 24,
        height_in: 18,
        weight_lbs: 85
      }
    ],
    white_glove_available: true,
    white_glove_price_usd: 1200,
    shipping_profile_id: 'oversized_freight',
    gift_eligible: true,
    gift_rule_id: 'gr_high_value_1',
    featured_image: '/images/products/spa-capsule-hero.jpg',
    images: [
      '/images/products/spa-capsule-1.jpg',
      '/images/products/spa-capsule-2.jpg'
    ]
  },
  {
    id: 'mini-massage-gun',
    sku: 'MMG-001',
    name: 'Mini Massage Gun',
    description: 'Portable percussion massage device for targeted muscle relief and recovery.',
    category: 'Accessory',
    tags: ['portable', 'percussion', 'recovery'],
    price_usd: 79.00,
    available: true,
    weight_lbs: 1.2,
    package_boxes: [
      {
        label: 'parcel',
        length_in: 8,
        width_in: 6,
        height_in: 3,
        weight_lbs: 2
      }
    ],
    white_glove_available: false,
    shipping_profile_id: 'small_parcel',
    featured_image: '/images/products/mini-massage-gun-hero.jpg',
    images: [
      '/images/products/mini-massage-gun-1.jpg'
    ]
  },
  {
    id: 'essential-oils-set',
    sku: 'EOS-001',
    name: 'Essential Oils Relaxation Set',
    description: 'Premium collection of therapeutic essential oils for aromatherapy and relaxation.',
    category: 'Accessory',
    tags: ['aromatherapy', 'essential_oils', 'relaxation'],
    price_usd: 149.00,
    available: true,
    weight_lbs: 2.5,
    package_boxes: [
      {
        label: 'parcel',
        length_in: 12,
        width_in: 8,
        height_in: 4,
        weight_lbs: 3
      }
    ],
    white_glove_available: false,
    shipping_profile_id: 'small_parcel',
    featured_image: '/images/products/essential-oils-hero.jpg',
    images: [
      '/images/products/essential-oils-1.jpg'
    ]
  }
];

export const shippingProfiles: ShippingProfile[] = [
  {
    id: 'large_home_delivery_curbside_or_whiteglove',
    name: 'white_glove',
    lead_time_days_min: 7,
    lead_time_days_max: 21,
    carrier_options: ['Specialized Furniture Delivery'],
    requires_signature: true,
    assembly_included: true,
    base_price_usd: 299,
    per_mile_fee_usd: 2.5
  },
  {
    id: 'small_parcel',
    name: 'small_parcel',
    lead_time_days_min: 2,
    lead_time_days_max: 7,
    carrier_options: ['UPS', 'FedEx', 'USPS'],
    requires_signature: false,
    assembly_included: false,
    base_price_usd: 15
  },
  {
    id: 'oversized_freight',
    name: 'oversized_freight',
    lead_time_days_min: 14,
    lead_time_days_max: 30,
    carrier_options: ['LTL Freight'],
    requires_signature: true,
    assembly_included: false,
    base_price_usd: 800
  },
  {
    id: 'standard_curbside',
    name: 'standard_curbside',
    lead_time_days_min: 5,
    lead_time_days_max: 14,
    carrier_options: ['Standard Freight'],
    requires_signature: true,
    assembly_included: false,
    base_price_usd: 199
  }
];

export const giftRules: GiftRule[] = [
  {
    id: 'gr_high_value_1',
    name: 'High Value Purchase — Complimentary Small Gift',
    trigger_product_ids: ['boss-plus', 'arya', 'prince-relaxio', 'spa-capsule-deluxe'],
    min_product_price_usd: 5000.00,
    auto_add_gift: true,
    gift_product_id: 'mini-massage-gun',
    gift_quantity: 1,
    gift_shipping_option: 'small_parcel',
    gift_price_zeroed: true,
    admin_approval_required: false,
    one_gift_per_order: true,
    notes: 'Auto-add mini massage gun as complimentary parcel shipment when a qualifying chair is fulfilled.'
  },
  {
    id: 'gr_spa_package',
    name: 'Spa Package — Essential Oils Bundle',
    trigger_product_ids: ['spa-capsule-deluxe'],
    min_product_price_usd: 15000.00,
    auto_add_gift: true,
    gift_product_id: 'essential-oils-set',
    gift_quantity: 1,
    gift_shipping_option: 'included_with_main',
    gift_price_zeroed: true,
    admin_approval_required: false,
    one_gift_per_order: true,
    notes: 'Add essential oils set with spa capsule purchases over $15k.'
  }
];

export const returnPolicy: ReturnPolicy = {
  restocking_fee_percent: 30,
  return_flat_fee_usd: 300,
  return_window_days: 30,
  customer_responsible_for_return_shipping: true
};