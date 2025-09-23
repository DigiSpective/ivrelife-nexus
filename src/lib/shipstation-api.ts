/**
 * ShipStation API Integration for IV RELIFE
 * Handles UPS, FedEx, DHL, LTL Freight integration through ShipStation
 */

import {
  ShipStationRateRequest,
  ShipStationRateOption,
  ShipStationCreateShipmentRequest,
  ShipStationCreateShipmentResponse,
  ShipStationTrackingResponse,
  ShippingApiResponse,
  ShippingError,
  LTLFreightQuoteRequest,
  LTLFreightQuote,
  Address,
  PackageBox
} from '@/types/shipping';

export class ShipStationAPI {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    // Use import.meta.env for browser environment
    this.baseUrl = import.meta.env?.VITE_SHIPSTATION_API_URL || 'https://ssapi.shipstation.com';
    this.apiKey = import.meta.env?.VITE_SHIPSTATION_API_KEY || '';
    this.apiSecret = import.meta.env?.VITE_SHIPSTATION_API_SECRET || '';
  }

  private getAuthHeaders(): HeadersInit {
    const credentials = btoa(`${this.apiKey}:${this.apiSecret}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ShippingApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || 'ShipStation API request failed',
            details: data
          }
        };
      }

      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: response.headers.get('x-request-id') || '',
          rate_limit: {
            remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
            reset_time: response.headers.get('x-ratelimit-reset') || ''
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Get real-time shipping rates from multiple carriers
   */
  async getRates(request: ShipStationRateRequest): Promise<ShippingApiResponse<ShipStationRateOption[]>> {
    // Convert our request format to ShipStation API format
    const shipStationRequest = {
      carrierCode: request.shipping_method_id,
      fromPostalCode: request.origin_zip,
      toState: this.extractStateFromZip(request.destination_zip),
      toPostalCode: request.destination_zip,
      toCountry: request.destination_country,
      weight: {
        value: this.calculateTotalWeight(request.items),
        units: 'pounds'
      },
      dimensions: this.calculateDimensions(request.items),
      confirmation: request.signature_required ? 'signature' : 'none',
      residential: request.residential
    };

    const response = await this.makeRequest<any>('/shipments/getrates', {
      method: 'POST',
      body: JSON.stringify(shipStationRequest)
    });

    if (!response.success) {
      return response as ShippingApiResponse<ShipStationRateOption[]>;
    }

    // Transform ShipStation response to our format
    const rateOptions: ShipStationRateOption[] = response.data.map((rate: any) => ({
      carrier_name: this.normalizeCarrierName(rate.carrierCode),
      service_level: rate.serviceName,
      cost_usd: parseFloat(rate.shipmentCost),
      estimated_days: rate.deliveryDays || this.estimateDeliveryDays(rate.serviceName),
      shipping_method_id: this.mapToShippingMethod(rate.carrierCode, rate.serviceCode),
      zone: rate.zone,
      is_international: request.destination_country !== 'US',
      requires_signature: request.signature_required || false
    }));

    return {
      success: true,
      data: rateOptions,
      metadata: response.metadata
    };
  }

  /**
   * Create a shipment and generate shipping label
   */
  async createShipment(request: ShipStationCreateShipmentRequest): Promise<ShippingApiResponse<ShipStationCreateShipmentResponse>> {
    const shipStationRequest = {
      orderNumber: request.order_id,
      orderDate: new Date().toISOString(),
      orderStatus: 'awaiting_shipment',
      shipTo: this.formatAddress(request.destination_address),
      shipFrom: this.formatAddress(request.origin_address),
      items: this.formatLineItems(request),
      packageCode: this.selectPackageCode(request.package_boxes),
      confirmation: request.signature_required ? 'signature' : 'none',
      shipDate: new Date().toISOString(),
      weight: {
        value: this.calculatePackageWeight(request.package_boxes),
        units: 'pounds'
      },
      dimensions: this.formatDimensions(request.package_boxes[0]), // Use first package for now
      insuranceOptions: request.insurance_value_usd ? {
        provider: 'carrier',
        insureShipment: true,
        insuredValue: request.insurance_value_usd
      } : undefined,
      internationalOptions: request.destination_address.country !== 'US' ? {
        contents: 'merchandise',
        customsItems: this.formatCustomsItems(request)
      } : undefined,
      advancedOptions: {
        warehouseId: import.meta.env?.VITE_SHIPSTATION_WAREHOUSE_ID,
        nonMachinable: this.isNonMachinable(request.package_boxes),
        saturdayDelivery: false,
        containsAlcohol: false,
        customField1: request.is_gift_shipment ? 'GIFT' : 'STANDARD',
        customField2: request.metadata?.white_glove_notes || '',
        customField3: request.metadata?.assembly_instructions || ''
      }
    };

    const response = await this.makeRequest<any>('/orders/createorder', {
      method: 'POST',
      body: JSON.stringify(shipStationRequest)
    });

    if (!response.success) {
      return response as ShippingApiResponse<ShipStationCreateShipmentResponse>;
    }

    // Create the shipment label
    const labelRequest = {
      orderId: response.data.orderId,
      carrierCode: this.extractCarrierCode(request.shipping_method_id),
      serviceCode: this.extractServiceCode(request.shipping_method_id),
      packageCode: shipStationRequest.packageCode,
      confirmation: shipStationRequest.confirmation,
      shipDate: shipStationRequest.shipDate,
      weight: shipStationRequest.weight,
      dimensions: shipStationRequest.dimensions,
      testLabel: !import.meta.env?.PROD
    };

    const labelResponse = await this.makeRequest<any>('/shipments/createlabel', {
      method: 'POST',
      body: JSON.stringify(labelRequest)
    });

    if (!labelResponse.success) {
      return labelResponse as ShippingApiResponse<ShipStationCreateShipmentResponse>;
    }

    const result: ShipStationCreateShipmentResponse = {
      shipment_id: labelResponse.data.shipmentId.toString(),
      tracking_number: labelResponse.data.trackingNumber,
      label_url: labelResponse.data.labelData,
      cost_usd: parseFloat(labelResponse.data.shipmentCost),
      estimated_delivery_date: labelResponse.data.estimatedDeliveryDate
    };

    return {
      success: true,
      data: result,
      metadata: labelResponse.metadata
    };
  }

  /**
   * Get tracking information for a shipment
   */
  async getTracking(shipmentId: string): Promise<ShippingApiResponse<ShipStationTrackingResponse>> {
    const response = await this.makeRequest<any>(`/shipments/${shipmentId}`, {
      method: 'GET'
    });

    if (!response.success) {
      return response as ShippingApiResponse<ShipStationTrackingResponse>;
    }

    const trackingData: ShipStationTrackingResponse = {
      tracking_number: response.data.trackingNumber,
      carrier_name: this.normalizeCarrierName(response.data.carrierCode),
      current_status: this.normalizeStatus(response.data.shipmentStatus),
      status_date: response.data.shipDate,
      estimated_delivery_date: response.data.estimatedDeliveryDate,
      actual_delivery_date: response.data.actualDeliveryDate,
      tracking_events: response.data.trackingEvents?.map((event: any) => ({
        date: event.occurred,
        status: event.status,
        location: `${event.city}, ${event.state}`,
        description: event.description
      })) || []
    };

    return {
      success: true,
      data: trackingData,
      metadata: response.metadata
    };
  }

  /**
   * Get LTL Freight quote for oversized items
   */
  async getLTLFreightQuote(request: LTLFreightQuoteRequest): Promise<ShippingApiResponse<LTLFreightQuote[]>> {
    // Note: ShipStation may not directly support LTL freight quotes
    // This would typically integrate with a separate LTL provider or freight broker
    const freightRequest = {
      origin: this.formatAddress(request.origin_address),
      destination: this.formatAddress(request.destination_address),
      items: request.items.map(item => ({
        description: item.description,
        weight: item.weight_lbs,
        dimensions: `${item.length_in}x${item.width_in}x${item.height_in}`,
        quantity: item.quantity,
        value: item.value_usd,
        freightClass: item.freight_class || this.calculateFreightClass(item.weight_lbs, item.length_in * item.width_in * item.height_in)
      })),
      pickupDate: request.pickup_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      specialServices: request.special_services || []
    };

    // For now, return mock LTL quotes
    // In production, this would integrate with actual LTL freight providers
    const mockQuotes: LTLFreightQuote[] = [
      {
        quote_id: `ltl_${Date.now()}_1`,
        carrier_name: 'LTL_Freight',
        service_level: 'Standard LTL',
        cost_usd: this.calculateLTLCost(request.items, false),
        estimated_transit_days: 7,
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        pickup_required: true,
        delivery_type: 'curbside',
        special_services: [],
        terms: 'Standard LTL freight terms and conditions apply'
      },
      {
        quote_id: `ltl_${Date.now()}_2`,
        carrier_name: 'LTL_Freight',
        service_level: 'Expedited LTL',
        cost_usd: this.calculateLTLCost(request.items, true),
        estimated_transit_days: 3,
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        pickup_required: true,
        delivery_type: 'threshold',
        special_services: ['expedited'],
        terms: 'Expedited LTL freight terms and conditions apply'
      }
    ];

    return {
      success: true,
      data: mockQuotes,
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: `ltl_quote_${Date.now()}`
      }
    };
  }

  // Helper methods
  private calculateTotalWeight(items: any[]): number {
    return items.reduce((total, item) => total + (item.weight_lbs * item.quantity), 0);
  }

  private calculateDimensions(items: any[]): any {
    // Simplified dimension calculation - in practice, this would be more sophisticated
    const totalVolume = items.reduce((volume, item) => {
      return volume + (item.length_in * item.width_in * item.height_in * item.quantity);
    }, 0);
    
    const cubicRoot = Math.cbrt(totalVolume);
    return {
      length: Math.ceil(cubicRoot),
      width: Math.ceil(cubicRoot),
      height: Math.ceil(cubicRoot),
      units: 'inches'
    };
  }

  private normalizeCarrierName(carrierCode: string): string {
    const mapping: { [key: string]: string } = {
      'ups': 'UPS',
      'fedex': 'FedEx',
      'dhl': 'DHL',
      'usps': 'USPS'
    };
    return mapping[carrierCode.toLowerCase()] || carrierCode;
  }

  private mapToShippingMethod(carrierCode: string, serviceCode: string): string {
    // Map ShipStation carrier/service codes to our shipping method IDs
    if (carrierCode.toLowerCase().includes('ltl')) {
      return 'oversized_freight';
    }
    if (serviceCode.toLowerCase().includes('white') || serviceCode.toLowerCase().includes('glove')) {
      return 'white_glove';
    }
    return 'standard_parcel';
  }

  private estimateDeliveryDays(serviceName: string): number {
    const service = serviceName.toLowerCase();
    if (service.includes('express') || service.includes('overnight')) return 1;
    if (service.includes('2day') || service.includes('2-day')) return 2;
    if (service.includes('3day') || service.includes('3-day')) return 3;
    if (service.includes('ground')) return 5;
    return 3; // Default
  }

  private extractStateFromZip(zip: string): string {
    // Simplified state extraction from ZIP code
    // In practice, you'd use a proper ZIP to state mapping
    const zipNum = parseInt(zip.substring(0, 3));
    if (zipNum >= 100 && zipNum <= 199) return 'MA'; // Example for Northeast
    if (zipNum >= 900 && zipNum <= 999) return 'CA'; // Example for West Coast
    return 'TX'; // Default
  }

  private formatAddress(address: Address): any {
    return {
      name: address.name,
      company: address.company || '',
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      residential: !address.company
    };
  }

  private formatLineItems(request: ShipStationCreateShipmentRequest): any[] {
    return request.package_boxes.map((box, index) => ({
      sku: `PACKAGE_${index + 1}`,
      name: box.name || `Package ${index + 1}`,
      weight: {
        value: box.weight_lbs,
        units: 'pounds'
      },
      quantity: 1,
      unitPrice: box.value_usd || 0
    }));
  }

  private selectPackageCode(boxes: PackageBox[]): string {
    // Select appropriate package code based on dimensions
    const box = boxes[0]; // Use first box for simplification
    if (!box) return 'package';
    
    const maxDim = Math.max(box.length_in, box.width_in, box.height_in);
    if (maxDim > 36) return 'large_package';
    if (maxDim > 24) return 'medium_package';
    return 'small_package';
  }

  private calculatePackageWeight(boxes: PackageBox[]): number {
    return boxes.reduce((total, box) => total + box.weight_lbs, 0);
  }

  private formatDimensions(box: PackageBox): any {
    return {
      length: box.length_in,
      width: box.width_in,
      height: box.height_in,
      units: 'inches'
    };
  }

  private formatCustomsItems(request: ShipStationCreateShipmentRequest): any[] {
    return request.package_boxes.map((box, index) => ({
      description: box.name || `Package ${index + 1}`,
      quantity: 1,
      value: box.value_usd || 0,
      harmonizedTariffCode: '9999.99.99', // Default tariff code
      countryOfOrigin: 'US'
    }));
  }

  private isNonMachinable(boxes: PackageBox[]): boolean {
    return boxes.some(box => 
      box.length_in > 27 || box.width_in > 17 || box.height_in > 17 || box.weight_lbs > 25
    );
  }

  private extractCarrierCode(shippingMethodId: string): string {
    // Extract carrier code from shipping method ID
    if (shippingMethodId.includes('ups')) return 'ups';
    if (shippingMethodId.includes('fedex')) return 'fedex';
    if (shippingMethodId.includes('dhl')) return 'dhl';
    return 'ups'; // Default
  }

  private extractServiceCode(shippingMethodId: string): string {
    // Extract service code from shipping method ID
    if (shippingMethodId.includes('express')) return 'ups_next_day_air';
    if (shippingMethodId.includes('2day')) return 'ups_2nd_day_air';
    if (shippingMethodId.includes('white_glove')) return 'ups_ground_with_freight';
    return 'ups_ground'; // Default
  }

  private normalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'shipped': 'SHIPPED',
      'delivered': 'DELIVERED',
      'pending': 'PENDING',
      'exception': 'EXCEPTION'
    };
    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  private calculateFreightClass(weightLbs: number, volumeCubicInches: number): string {
    const density = weightLbs / (volumeCubicInches / 1728); // Convert to cubic feet
    
    if (density >= 50) return '50';
    if (density >= 35) return '55';
    if (density >= 30) return '60';
    if (density >= 22.5) return '65';
    if (density >= 15) return '70';
    if (density >= 13.5) return '77.5';
    if (density >= 12) return '85';
    if (density >= 10.5) return '92.5';
    if (density >= 9) return '100';
    if (density >= 8) return '110';
    if (density >= 7) return '125';
    if (density >= 6) return '150';
    if (density >= 5) return '175';
    if (density >= 4) return '200';
    if (density >= 3) return '250';
    if (density >= 2) return '300';
    if (density >= 1) return '400';
    return '500';
  }

  private calculateLTLCost(items: any[], expedited: boolean): number {
    const totalWeight = items.reduce((total, item) => total + (item.weight_lbs * item.quantity), 0);
    const baseCost = totalWeight * 0.50; // $0.50 per pound base rate
    const expediteMultiplier = expedited ? 1.5 : 1;
    return Math.round(baseCost * expediteMultiplier * 100) / 100;
  }
}

// Create default instance
export const shipStationAPI = new ShipStationAPI();