/**
 * Shipping Engine for IV RELIFE
 * Handles rate calculation, shipment grouping, and business rules
 */

import {
  ShippingRateRequest,
  ShippingRateResponse,
  ShipmentGroup,
  ShippingRateOption,
  ShippingSettings,
  ShippingBusinessRules,
  PackageBox,
  CartLineItem,
  Address,
  ShipStationRateRequest,
  LTLFreightQuoteRequest
} from '@/types/shipping';
import { shipStationAPI } from './shipstation-api';
import { Product } from '@/types/products';

export class ShippingEngine {
  private settings: ShippingSettings;
  private businessRules: ShippingBusinessRules;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.businessRules = this.getDefaultBusinessRules();
  }

  /**
   * Calculate shipping rates for a cart
   */
  async calculateRates(request: ShippingRateRequest): Promise<ShippingRateResponse> {
    try {
      // Group items into shipments based on business rules
      const shipmentGroups = this.groupItemsIntoShipments(request.items, request.destination_address);

      // Calculate rates for each shipment group
      for (const group of shipmentGroups) {
        group.rate_options = await this.getRatesForGroup(group, request);
      }

      // Calculate total costs and delivery estimates
      const totalCost = this.calculateTotalCost(shipmentGroups);
      const deliveryEstimates = this.calculateDeliveryEstimates(shipmentGroups);

      return {
        shipment_groups: shipmentGroups,
        total_cost_usd: totalCost,
        estimated_delivery_days_min: deliveryEstimates.min,
        estimated_delivery_days_max: deliveryEstimates.max
      };
    } catch (error) {
      console.error('Shipping rate calculation failed:', error);
      
      // Return fallback rates
      return this.getFallbackRates(request);
    }
  }

  /**
   * Group cart items into logical shipments
   */
  private groupItemsIntoShipments(items: CartLineItem[], destination: Address): ShipmentGroup[] {
    const groups: ShipmentGroup[] = [];

    // Separate items by shipping requirements
    const giftItems = items.filter(item => item.is_gift);
    const oversizedItems = items.filter(item => !item.is_gift && this.isOversized(item));
    const standardItems = items.filter(item => !item.is_gift && !this.isOversized(item));

    // Create gift shipment group (always separate)
    if (giftItems.length > 0) {
      groups.push({
        id: `gift_${Date.now()}`,
        group_type: 'gift',
        items: giftItems,
        rate_options: [],
        package_boxes: this.calculatePackaging(giftItems),
        requires_freight_quote: false
      });
    }

    // Create LTL shipment group for oversized items
    if (oversizedItems.length > 0) {
      groups.push({
        id: `ltl_${Date.now()}`,
        group_type: 'ltl',
        items: oversizedItems,
        rate_options: [],
        package_boxes: this.calculatePackaging(oversizedItems),
        requires_freight_quote: true
      });
    }

    // Create main shipment group for standard items
    if (standardItems.length > 0) {
      groups.push({
        id: `main_${Date.now()}`,
        group_type: 'main',
        items: standardItems,
        rate_options: [],
        package_boxes: this.calculatePackaging(standardItems),
        requires_freight_quote: false
      });
    }

    return groups;
  }

  /**
   * Get shipping rates for a specific shipment group
   */
  private async getRatesForGroup(group: ShipmentGroup, request: ShippingRateRequest): Promise<ShippingRateOption[]> {
    const rates: ShippingRateOption[] = [];

    if (group.group_type === 'ltl') {
      // Handle LTL freight quotes
      const ltlRates = await this.getLTLRates(group, request);
      rates.push(...ltlRates);
    } else {
      // Handle standard parcel rates
      const parcelRates = await this.getParcelRates(group, request);
      rates.push(...parcelRates);
    }

    // Apply business rules and filters
    return this.applyBusinessRules(rates, group, request.destination_address);
  }

  /**
   * Get LTL freight rates
   */
  private async getLTLRates(group: ShipmentGroup, request: ShippingRateRequest): Promise<ShippingRateOption[]> {
    const ltlRequest: LTLFreightQuoteRequest = {
      origin_address: request.origin_address || this.settings.default_origin_address,
      destination_address: request.destination_address,
      items: group.items.map(item => ({
        description: item.product.name,
        weight_lbs: item.product.weight_lbs || 100,
        length_in: item.product.dimensions_in?.length || 48,
        width_in: item.product.dimensions_in?.width || 24,
        height_in: item.product.dimensions_in?.height || 24,
        quantity: item.quantity,
        value_usd: item.product.price_usd,
        freight_class: this.determineFreightClass(item.product)
      }))
    };

    const response = await shipStationAPI.getLTLFreightQuote(ltlRequest);
    
    if (!response.success || !response.data) {
      return this.getFallbackLTLRates();
    }

    return response.data.map(quote => ({
      shipping_profile_id: `ltl_${quote.quote_id}`,
      carrier_name: quote.carrier_name,
      service_level: quote.service_level,
      cost_usd: quote.cost_usd,
      estimated_days: quote.estimated_transit_days,
      requires_signature: true,
      assembly_included: quote.delivery_type === 'white_glove',
      supports_tracking: true,
      restrictions: quote.delivery_type === 'curbside' ? ['Curbside delivery only'] : []
    }));
  }

  /**
   * Get standard parcel rates
   */
  private async getParcelRates(group: ShipmentGroup, request: ShippingRateRequest): Promise<ShippingRateOption[]> {
    const shipStationRequest: ShipStationRateRequest = {
      items: group.items.map(item => ({
        product_id: item.product_id,
        sku: item.product.sku || item.product_id,
        quantity: item.quantity,
        weight_lbs: item.product.weight_lbs || 1,
        length_in: item.product.dimensions_in?.length || 12,
        width_in: item.product.dimensions_in?.width || 12,
        height_in: item.product.dimensions_in?.height || 12,
        value_usd: item.product.price_usd
      })),
      origin_zip: request.origin_address?.postal_code || this.settings.default_origin_address.postal_code,
      destination_zip: request.destination_address.postal_code,
      destination_country: request.destination_address.country,
      residential: !request.destination_address.company,
      signature_required: this.requiresSignature(group.items)
    };

    const response = await shipStationAPI.getRates(shipStationRequest);

    if (!response.success || !response.data) {
      return this.getFallbackParcelRates(group);
    }

    return response.data.map(rate => ({
      shipping_profile_id: `${rate.carrier_name.toLowerCase()}_${rate.service_level.toLowerCase().replace(/\s+/g, '_')}`,
      carrier_name: rate.carrier_name,
      service_level: rate.service_level,
      cost_usd: this.applyHandlingFees(rate.cost_usd, group),
      estimated_days: rate.estimated_days,
      requires_signature: rate.requires_signature,
      assembly_included: false,
      supports_tracking: true,
      restrictions: rate.is_international ? this.getInternationalRestrictions() : []
    }));
  }

  /**
   * Apply business rules to filter and modify shipping rates
   */
  private applyBusinessRules(rates: ShippingRateOption[], group: ShipmentGroup, destination: Address): ShippingRateOption[] {
    let filteredRates = [...rates];

    // Rule BR3: White-glove only for assembly-required items in USA/Canada
    if (group.group_type === 'main') {
      const hasAssemblyItems = group.items.some(item => this.requiresAssembly(item.product));
      if (hasAssemblyItems && ['US', 'CA'].includes(destination.country)) {
        // Add white-glove option
        filteredRates.push(...this.getWhiteGloveOptions(group));
      }
    }

    // Rule BR4: International restrictions
    if (destination.country !== 'US') {
      filteredRates = filteredRates.filter(rate => {
        if (rate.service_level.toLowerCase().includes('white') || rate.service_level.toLowerCase().includes('glove')) {
          return this.settings.international_white_glove_allowed;
        }
        return this.businessRules.international_restrictions.carriers_allowed.includes(rate.carrier_name);
      });
    }

    // Apply free shipping threshold
    if (this.settings.free_shipping_threshold_usd) {
      const cartTotal = group.items.reduce((total, item) => {
        return total + (item.product.price_usd * item.quantity);
      }, 0);

      if (cartTotal >= this.settings.free_shipping_threshold_usd) {
        filteredRates = filteredRates.map(rate => ({
          ...rate,
          cost_usd: 0
        }));
      }
    }

    // Sort by cost and delivery time
    return filteredRates.sort((a, b) => {
      const costDiff = a.cost_usd - b.cost_usd;
      if (costDiff !== 0) return costDiff;
      return a.estimated_days - b.estimated_days;
    });
  }

  /**
   * Check if an item is oversized and requires LTL freight
   */
  private isOversized(item: CartLineItem): boolean {
    const product = item.product;
    const thresholds = this.settings.oversized_freight_thresholds;

    if (product.weight_lbs && product.weight_lbs > thresholds.weight_lbs) {
      return true;
    }

    if (product.dimensions_in) {
      const maxDimension = Math.max(
        product.dimensions_in.length,
        product.dimensions_in.width,
        product.dimensions_in.height
      );
      if (maxDimension > thresholds.dimension_in) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate packaging for a group of items
   */
  private calculatePackaging(items: CartLineItem[]): PackageBox[] {
    const packages: PackageBox[] = [];

    for (const item of items) {
      if (item.product.package_boxes) {
        // Use predefined packaging
        for (let i = 0; i < item.quantity; i++) {
          packages.push(...item.product.package_boxes);
        }
      } else {
        // Calculate packaging based on product dimensions
        for (let i = 0; i < item.quantity; i++) {
          packages.push({
            id: `pkg_${item.id}_${i}`,
            name: `Package for ${item.product.name}`,
            length_in: item.product.dimensions_in?.length || 12,
            width_in: item.product.dimensions_in?.width || 12,
            height_in: item.product.dimensions_in?.height || 12,
            weight_lbs: item.product.weight_lbs || 1,
            value_usd: item.product.price_usd
          });
        }
      }
    }

    return packages;
  }

  /**
   * Apply handling fees to shipping cost
   */
  private applyHandlingFees(baseCost: number, group: ShipmentGroup): number {
    let totalCost = baseCost;

    // Apply percentage-based handling fee
    totalCost += baseCost * this.settings.parcel_handling_fee_percent;

    // Apply flat fees for specific services
    if (group.group_type === 'gift') {
      // No additional fees for gifts
    }

    return Math.round(totalCost * 100) / 100;
  }

  /**
   * Get white-glove shipping options
   */
  private getWhiteGloveOptions(group: ShipmentGroup): ShippingRateOption[] {
    return [
      {
        shipping_profile_id: 'white_glove_standard',
        carrier_name: 'White Glove Service',
        service_level: 'White Glove Home Delivery',
        cost_usd: this.settings.white_glove_flat_fee_usd,
        estimated_days: 14,
        requires_signature: true,
        assembly_included: true,
        supports_tracking: true,
        restrictions: []
      }
    ];
  }

  /**
   * Calculate total shipping cost across all groups
   */
  private calculateTotalCost(groups: ShipmentGroup[]): number {
    return groups.reduce((total, group) => {
      const selectedRate = group.selected_rate || (group.rate_options.length > 0 ? group.rate_options[0] : null);
      return total + (selectedRate?.cost_usd || 0);
    }, 0);
  }

  /**
   * Calculate delivery time estimates
   */
  private calculateDeliveryEstimates(groups: ShipmentGroup[]): { min: number; max: number } {
    let minDays = Infinity;
    let maxDays = 0;

    for (const group of groups) {
      const selectedRate = group.selected_rate || (group.rate_options.length > 0 ? group.rate_options[0] : null);
      if (selectedRate) {
        minDays = Math.min(minDays, selectedRate.estimated_days);
        maxDays = Math.max(maxDays, selectedRate.estimated_days);
      }
    }

    return {
      min: minDays === Infinity ? 3 : minDays,
      max: maxDays === 0 ? 7 : maxDays
    };
  }

  /**
   * Helper methods
   */
  private requiresSignature(items: CartLineItem[]): boolean {
    return items.some(item => item.product.price_usd > 500);
  }

  private requiresAssembly(product: Product): boolean {
    return product.category === 'Massage Chair' || product.category === 'Spa';
  }

  private determineFreightClass(product: Product): string {
    // Simplified freight class determination
    if (product.category === 'Massage Chair') return '125';
    if (product.category === 'Spa') return '100';
    return '150';
  }

  private getInternationalRestrictions(): string[] {
    return ['International delivery', 'Customs fees may apply', 'Extended delivery times'];
  }

  /**
   * Fallback rates when API fails
   */
  private getFallbackRates(request: ShippingRateRequest): ShippingRateResponse {
    const groups = this.groupItemsIntoShipments(request.items, request.destination_address);
    
    for (const group of groups) {
      if (group.group_type === 'ltl') {
        group.rate_options = this.getFallbackLTLRates();
      } else {
        group.rate_options = this.getFallbackParcelRates(group);
      }
    }

    return {
      shipment_groups: groups,
      total_cost_usd: this.calculateTotalCost(groups),
      estimated_delivery_days_min: 3,
      estimated_delivery_days_max: 14
    };
  }

  private getFallbackParcelRates(group: ShipmentGroup): ShippingRateOption[] {
    return [
      {
        shipping_profile_id: 'fallback_ground',
        carrier_name: 'Ground Service',
        service_level: 'Standard Ground',
        cost_usd: 15.99,
        estimated_days: 5,
        requires_signature: false,
        assembly_included: false,
        supports_tracking: true,
        restrictions: ['Estimated rates - API unavailable']
      }
    ];
  }

  private getFallbackLTLRates(): ShippingRateOption[] {
    return [
      {
        shipping_profile_id: 'fallback_ltl',
        carrier_name: 'LTL Freight',
        service_level: 'Standard LTL',
        cost_usd: 299.99,
        estimated_days: 14,
        requires_signature: true,
        assembly_included: false,
        supports_tracking: true,
        restrictions: ['Estimated rates - API unavailable']
      }
    ];
  }

  /**
   * Default configuration
   */
  private getDefaultSettings(): ShippingSettings {
    return {
      white_glove_flat_fee_usd: 700.00,
      parcel_handling_fee_percent: 0.0,
      oversized_freight_thresholds: {
        weight_lbs: 200,
        dimension_in: 70
      },
      international_white_glove_allowed: false,
      default_origin_address: {
        name: 'IV RELIFE Warehouse',
        company: 'IV RELIFE',
        street1: '123 Warehouse Drive',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75201',
        country: 'US',
        phone: '555-123-4567'
      },
      supported_countries: ['US', 'CA', 'MX'],
      free_shipping_threshold_usd: 1000
    };
  }

  private getDefaultBusinessRules(): ShippingBusinessRules {
    return {
      oversized_items_ltl_only: true,
      gifts_separate_shipment: true,
      white_glove_assembly_required_only: true,
      international_restrictions: {
        white_glove_allowed: false,
        carriers_allowed: ['UPS', 'FedEx', 'DHL']
      }
    };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<ShippingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  updateBusinessRules(newRules: Partial<ShippingBusinessRules>): void {
    this.businessRules = { ...this.businessRules, ...newRules };
  }
}

// Create default instance
export const shippingEngine = new ShippingEngine();