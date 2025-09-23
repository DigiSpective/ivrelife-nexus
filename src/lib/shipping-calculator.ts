/**
 * Shipping Calculator for IV RELIFE
 * Handles shipping cost calculation and delivery estimates
 */

import { 
  Product, 
  ShippingProfile, 
  CartLineItem, 
  CartShipment, 
  ShippingEstimate,
  ShippingEstimateRequest,
  PackageBox 
} from '@/types/products';
import { shippingProfiles } from '@/data/sampleProducts';

export class ShippingCalculator {
  private shippingProfiles: ShippingProfile[];

  constructor(profiles: ShippingProfile[] = []) {
    this.shippingProfiles = profiles;
  }

  /**
   * Get shipping profile by ID
   */
  getShippingProfile(profileId: string): ShippingProfile | undefined {
    return this.shippingProfiles.find(profile => profile.id === profileId);
  }

  /**
   * Calculate shipping cost for a single item
   */
  calculateItemShipping(
    item: CartLineItem, 
    destination: { zip_code: string; state: string }
  ): ShippingEstimate | null {
    const profile = this.getShippingProfile(item.shipping_profile_id);
    if (!profile) return null;

    // Base shipping cost
    let cost = profile.base_price_usd;

    // Add per-mile fees if applicable (simplified calculation)
    if (profile.per_mile_fee_usd) {
      const estimatedMiles = this.estimateDistanceFromZip(destination.zip_code);
      cost += estimatedMiles * profile.per_mile_fee_usd;
    }

    // Multiply by quantity for certain shipping types
    if (profile.name === 'small_parcel') {
      cost *= item.quantity;
    }

    // White glove override
    if (item.white_glove_selected && item.product.white_glove_price_usd) {
      cost = item.product.white_glove_price_usd;
    }

    return {
      shipping_profile_id: profile.id,
      carrier_name: profile.carrier_options[0],
      service_type: profile.name,
      estimated_cost: cost,
      estimated_delivery_days: profile.lead_time_days_max,
      requires_freight_quote: profile.name === 'oversized_freight'
    };
  }

  /**
   * Group cart items into shipments based on shipping profiles
   */
  groupItemsIntoShipments(items: CartLineItem[]): CartShipment[] {
    const shipmentGroups = new Map<string, CartLineItem[]>();

    // Group items by shipping profile and gift status
    for (const item of items) {
      const key = `${item.shipping_profile_id}-${item.is_gift ? 'gift' : 'main'}`;
      
      if (!shipmentGroups.has(key)) {
        shipmentGroups.set(key, []);
      }
      shipmentGroups.get(key)!.push(item);
    }

    const shipments: CartShipment[] = [];
    let shipmentIndex = 1;

    for (const [key, groupItems] of shipmentGroups) {
      const [profileId, type] = key.split('-');
      const profile = this.getShippingProfile(profileId);
      
      if (profile) {
        // Calculate shipment cost (use first item's destination for now)
        const estimatedCost = this.calculateShipmentCost(groupItems, profile);
        
        shipments.push({
          id: `shipment-${shipmentIndex++}`,
          shipment_type: type as 'main' | 'gift',
          shipping_profile_id: profileId,
          line_items: groupItems,
          estimated_cost: estimatedCost,
          estimated_delivery_days: profile.lead_time_days_max,
          carrier_name: profile.carrier_options[0]
        });
      }
    }

    return shipments;
  }

  /**
   * Calculate total shipping cost for a shipment
   */
  private calculateShipmentCost(items: CartLineItem[], profile: ShippingProfile): number {
    // For most shipping types, cost is per shipment, not per item
    switch (profile.name) {
      case 'small_parcel':
        // Small parcels are charged per item
        return items.reduce((total, item) => {
          return total + (profile.base_price_usd * item.quantity);
        }, 0);
        
      case 'white_glove':
        // Check if any item has white glove selected
        const whiteGloveItem = items.find(item => item.white_glove_selected);
        if (whiteGloveItem && whiteGloveItem.product.white_glove_price_usd) {
          return whiteGloveItem.product.white_glove_price_usd;
        }
        return profile.base_price_usd;
        
      case 'oversized_freight':
      case 'standard_curbside':
        // Freight shipping is typically per shipment
        return profile.base_price_usd;
        
      default:
        return profile.base_price_usd;
    }
  }

  /**
   * Calculate total weight for shipping estimation
   */
  calculateTotalWeight(items: CartLineItem[]): number {
    return items.reduce((total, item) => {
      const itemWeight = item.product.weight_lbs || 0;
      return total + (itemWeight * item.quantity);
    }, 0);
  }

  /**
   * Calculate total dimensions for shipping estimation
   */
  calculateTotalDimensions(items: CartLineItem[]): { length: number; width: number; height: number } {
    let totalLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    for (const item of items) {
      if (item.product.package_boxes) {
        for (const box of item.product.package_boxes) {
          totalLength += box.length_in * item.quantity;
          maxWidth = Math.max(maxWidth, box.width_in);
          maxHeight = Math.max(maxHeight, box.height_in);
        }
      } else if (item.product.dimensions_in) {
        const dims = item.product.dimensions_in;
        totalLength += dims.length * item.quantity;
        maxWidth = Math.max(maxWidth, dims.width);
        maxHeight = Math.max(maxHeight, dims.height);
      }
    }

    return {
      length: totalLength,
      width: maxWidth,
      height: maxHeight
    };
  }

  /**
   * Get all package boxes for shipping calculation
   */
  getAllPackageBoxes(items: CartLineItem[]): PackageBox[] {
    const boxes: PackageBox[] = [];

    for (const item of items) {
      if (item.product.package_boxes) {
        for (let i = 0; i < item.quantity; i++) {
          boxes.push(...item.product.package_boxes);
        }
      }
    }

    return boxes;
  }

  /**
   * Estimate shipping cost for multiple items to a destination
   */
  estimateShipping(request: ShippingEstimateRequest): ShippingEstimate[] {
    const estimates: ShippingEstimate[] = [];

    for (const profileId of request.shipping_profile_ids) {
      const profile = this.getShippingProfile(profileId);
      if (!profile) continue;

      // Calculate total weight and dimensions
      const totalWeight = request.items.reduce((sum, item) => {
        const totalBoxWeight = item.package_boxes.reduce((boxSum, box) => 
          boxSum + box.weight_lbs, 0
        );
        return sum + (totalBoxWeight * item.quantity);
      }, 0);

      let cost = profile.base_price_usd;

      // Add distance-based fees if applicable
      if (profile.per_mile_fee_usd) {
        const estimatedMiles = this.estimateDistanceFromZip(request.destination.zip_code);
        cost += estimatedMiles * profile.per_mile_fee_usd;
      }

      // Weight-based adjustments for certain shipping types
      if (profile.name === 'oversized_freight' && totalWeight > 500) {
        cost += Math.floor(totalWeight / 100) * 50; // $50 per 100 lbs over 500
      }

      estimates.push({
        shipping_profile_id: profileId,
        carrier_name: profile.carrier_options[0],
        service_type: profile.name,
        estimated_cost: cost,
        estimated_delivery_days: profile.lead_time_days_max,
        requires_freight_quote: profile.name === 'oversized_freight'
      });
    }

    return estimates;
  }

  /**
   * Simple distance estimation based on ZIP code (simplified for demo)
   */
  private estimateDistanceFromZip(zipCode: string): number {
    // This is a simplified distance calculation
    // In a real application, you'd use a proper geolocation service
    const zipNum = parseInt(zipCode.substring(0, 3));
    
    // Rough distance estimation based on first 3 digits of ZIP
    if (zipNum >= 100 && zipNum <= 199) return 300; // Northeast
    if (zipNum >= 200 && zipNum <= 299) return 400; // Mid-Atlantic
    if (zipNum >= 300 && zipNum <= 399) return 600; // Southeast
    if (zipNum >= 400 && zipNum <= 499) return 800; // Midwest
    if (zipNum >= 500 && zipNum <= 599) return 1000; // Central
    if (zipNum >= 600 && zipNum <= 699) return 1200; // South Central
    if (zipNum >= 700 && zipNum <= 799) return 1500; // Southwest
    if (zipNum >= 800 && zipNum <= 899) return 1800; // West
    if (zipNum >= 900 && zipNum <= 999) return 2000; // Pacific
    
    return 500; // Default
  }

  /**
   * Check if items require special handling
   */
  requiresSpecialHandling(items: CartLineItem[]): boolean {
    return items.some(item => {
      const profile = this.getShippingProfile(item.shipping_profile_id);
      return profile?.name === 'oversized_freight' || 
             profile?.name === 'white_glove' ||
             item.white_glove_selected;
    });
  }

  /**
   * Get delivery timeframe for a shipment
   */
  getDeliveryTimeframe(shipment: CartShipment): string {
    const profile = this.getShippingProfile(shipment.shipping_profile_id);
    if (!profile) return 'Unknown';

    const minDays = profile.lead_time_days_min;
    const maxDays = profile.lead_time_days_max;

    if (minDays === maxDays) {
      return `${minDays} business days`;
    }
    return `${minDays}-${maxDays} business days`;
  }

  /**
   * Check if signature is required for delivery
   */
  requiresSignature(shipment: CartShipment): boolean {
    const profile = this.getShippingProfile(shipment.shipping_profile_id);
    return profile?.requires_signature || false;
  }

  /**
   * Check if assembly is included
   */
  includesAssembly(shipment: CartShipment): boolean {
    const profile = this.getShippingProfile(shipment.shipping_profile_id);
    return profile?.assembly_included || 
           shipment.line_items.some(item => item.white_glove_selected);
  }
}

// Create default instance with sample shipping profiles
export const defaultShippingCalculator = new ShippingCalculator(shippingProfiles);

// Export utility functions
export const calculateItemShipping = (
  item: CartLineItem, 
  destination: { zip_code: string; state: string }
): ShippingEstimate | null => {
  return defaultShippingCalculator.calculateItemShipping(item, destination);
};

export const groupIntoShipments = (items: CartLineItem[]): CartShipment[] => {
  return defaultShippingCalculator.groupItemsIntoShipments(items);
};

export const estimateShippingCosts = (request: ShippingEstimateRequest): ShippingEstimate[] => {
  return defaultShippingCalculator.estimateShipping(request);
};