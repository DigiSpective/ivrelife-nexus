/**
 * Shipment Manager for IV RELIFE
 * Handles shipment creation, tracking, and lifecycle management
 */

import {
  Shipment,
  ShipStationCreateShipmentRequest,
  ShipStationCreateShipmentResponse,
  ShipStationTrackingResponse,
  Address,
  CartLineItem,
  ShippingApiResponse,
  ShipStationWebhookEvent
} from '@/types/shipping';
import { shipStationAPI } from './shipstation-api';

export class ShipmentManager {
  private shipments: Map<string, Shipment> = new Map();

  /**
   * Create shipments from cart items and shipping selections
   */
  async createShipmentsFromCart(
    orderId: string,
    items: CartLineItem[],
    destination: Address,
    shippingSelections: { [groupId: string]: string },
    origin?: Address
  ): Promise<ShippingApiResponse<Shipment[]>> {
    try {
      const shipments: Shipment[] = [];
      
      // Group items by shipping method
      const shipmentGroups = this.groupItemsByShipping(items, shippingSelections);
      
      for (const group of shipmentGroups) {
        const shipment = await this.createSingleShipment(
          orderId,
          group.items,
          destination,
          group.shippingProfileId,
          origin
        );
        
        if (shipment.success && shipment.data) {
          shipments.push(shipment.data);
          this.shipments.set(shipment.data.id, shipment.data);
        }
      }

      return {
        success: true,
        data: shipments,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `create_shipments_${orderId}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SHIPMENT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create shipments',
          details: error
        }
      };
    }
  }

  /**
   * Create a single shipment
   */
  async createSingleShipment(
    orderId: string,
    items: CartLineItem[],
    destination: Address,
    shippingProfileId: string,
    origin?: Address
  ): Promise<ShippingApiResponse<Shipment>> {
    const shipmentId = `ship_${orderId}_${Date.now()}`;
    
    // Prepare ShipStation request
    const shipStationRequest: ShipStationCreateShipmentRequest = {
      order_id: orderId,
      shipping_method_id: shippingProfileId,
      package_boxes: this.calculatePackaging(items),
      origin_address: origin || this.getDefaultOrigin(),
      destination_address: destination,
      is_gift_shipment: items.some(item => item.is_gift),
      metadata: {
        white_glove_notes: this.getWhiteGloveNotes(items),
        assembly_instructions: this.getAssemblyInstructions(items),
        gift_message: this.getGiftMessage(items)
      },
      insurance_value_usd: this.calculateInsuranceValue(items),
      signature_required: this.requiresSignature(items)
    };

    // Create shipment in ShipStation
    const shipStationResponse = await shipStationAPI.createShipment(shipStationRequest);
    
    if (!shipStationResponse.success) {
      return shipStationResponse as ShippingApiResponse<Shipment>;
    }

    // Create local shipment record
    const shipment: Shipment = {
      id: shipmentId,
      order_id: orderId,
      shipping_profile_id: shippingProfileId,
      tracking_number: shipStationResponse.data!.tracking_number,
      carrier: this.extractCarrier(shippingProfileId),
      service_level: this.extractServiceLevel(shippingProfileId),
      status: 'LABEL_CREATED',
      origin_address: shipStationRequest.origin_address,
      destination_address: destination,
      package_boxes: shipStationRequest.package_boxes,
      is_gift_shipment: shipStationRequest.is_gift_shipment,
      metadata: shipStationRequest.metadata,
      cost_usd: shipStationResponse.data!.cost_usd,
      label_url: shipStationResponse.data!.label_url,
      estimated_delivery_date: shipStationResponse.data!.estimated_delivery_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return {
      success: true,
      data: shipment,
      metadata: shipStationResponse.metadata
    };
  }

  /**
   * Update shipment status from tracking
   */
  async updateShipmentTracking(shipmentId: string): Promise<ShippingApiResponse<Shipment>> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      return {
        success: false,
        error: {
          code: 'SHIPMENT_NOT_FOUND',
          message: `Shipment ${shipmentId} not found`
        }
      };
    }

    try {
      const trackingResponse = await shipStationAPI.getTracking(shipmentId);
      
      if (!trackingResponse.success) {
        return trackingResponse as ShippingApiResponse<Shipment>;
      }

      const trackingData = trackingResponse.data!;
      
      // Update shipment with latest tracking info
      const updatedShipment: Shipment = {
        ...shipment,
        status: this.mapTrackingStatus(trackingData.current_status),
        estimated_delivery_date: trackingData.estimated_delivery_date,
        actual_delivery_date: trackingData.actual_delivery_date,
        updated_at: new Date().toISOString()
      };

      this.shipments.set(shipmentId, updatedShipment);

      return {
        success: true,
        data: updatedShipment,
        metadata: trackingResponse.metadata
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRACKING_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update tracking',
          details: error
        }
      };
    }
  }

  /**
   * Get all shipments for an order
   */
  getOrderShipments(orderId: string): Shipment[] {
    return Array.from(this.shipments.values()).filter(
      shipment => shipment.order_id === orderId
    );
  }

  /**
   * Get shipment by ID
   */
  getShipment(shipmentId: string): Shipment | undefined {
    return this.shipments.get(shipmentId);
  }

  /**
   * Handle ShipStation webhook events
   */
  async handleWebhookEvent(event: ShipStationWebhookEvent): Promise<void> {
    const shipment = Array.from(this.shipments.values()).find(
      s => s.tracking_number === event.data.tracking_number
    );

    if (!shipment) {
      console.warn(`Webhook received for unknown shipment: ${event.data.tracking_number}`);
      return;
    }

    const updatedStatus = this.mapWebhookStatus(event.event_type);
    const updatedShipment: Shipment = {
      ...shipment,
      status: updatedStatus,
      updated_at: new Date().toISOString()
    };

    if (event.event_type === 'SHIPMENT_DELIVERED' && event.data.delivery_date) {
      updatedShipment.actual_delivery_date = event.data.delivery_date;
    }

    this.shipments.set(shipment.id, updatedShipment);

    // Trigger notifications or other business logic
    await this.onShipmentStatusChanged(updatedShipment, event);
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId: string): Promise<ShippingApiResponse<void>> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      return {
        success: false,
        error: {
          code: 'SHIPMENT_NOT_FOUND',
          message: `Shipment ${shipmentId} not found`
        }
      };
    }

    if (['SHIPPED', 'DELIVERED'].includes(shipment.status)) {
      return {
        success: false,
        error: {
          code: 'SHIPMENT_CANNOT_CANCEL',
          message: 'Cannot cancel shipment that has already shipped'
        }
      };
    }

    try {
      // Cancel in ShipStation (implementation depends on ShipStation API)
      // For now, just update local status
      const cancelledShipment: Shipment = {
        ...shipment,
        status: 'FAILED',
        updated_at: new Date().toISOString()
      };

      this.shipments.set(shipmentId, cancelledShipment);

      return {
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: `cancel_${shipmentId}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CANCELLATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to cancel shipment',
          details: error
        }
      };
    }
  }

  /**
   * Get shipment tracking details
   */
  async getShipmentTracking(shipmentId: string): Promise<ShippingApiResponse<ShipStationTrackingResponse>> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      return {
        success: false,
        error: {
          code: 'SHIPMENT_NOT_FOUND',
          message: `Shipment ${shipmentId} not found`
        }
      };
    }

    return await shipStationAPI.getTracking(shipmentId);
  }

  /**
   * Private helper methods
   */
  private groupItemsByShipping(
    items: CartLineItem[], 
    selections: { [groupId: string]: string }
  ): { items: CartLineItem[]; shippingProfileId: string }[] {
    const groups: { [key: string]: CartLineItem[] } = {};

    items.forEach(item => {
      // Determine shipping profile based on item characteristics and selections
      let shippingProfileId = item.shipping_profile_id;
      
      // Override with user selections if available
      const groupKey = item.is_gift ? 'gift' : 'main';
      if (selections[groupKey]) {
        shippingProfileId = selections[groupKey];
      }

      if (!groups[shippingProfileId]) {
        groups[shippingProfileId] = [];
      }
      groups[shippingProfileId].push(item);
    });

    return Object.entries(groups).map(([shippingProfileId, items]) => ({
      items,
      shippingProfileId
    }));
  }

  private calculatePackaging(items: CartLineItem[]) {
    return items.flatMap(item => {
      if (item.product.package_boxes) {
        return Array(item.quantity).fill(null).flatMap(() => item.product.package_boxes!);
      }
      
      // Calculate default packaging
      return Array(item.quantity).fill(null).map((_, index) => ({
        id: `pkg_${item.id}_${index}`,
        name: `Package for ${item.product.name}`,
        length_in: item.product.dimensions_in?.length || 12,
        width_in: item.product.dimensions_in?.width || 12,
        height_in: item.product.dimensions_in?.height || 12,
        weight_lbs: item.product.weight_lbs || 1,
        value_usd: item.product.price_usd
      }));
    });
  }

  private getDefaultOrigin(): Address {
    return {
      name: 'IV RELIFE Warehouse',
      company: 'IV RELIFE',
      street1: '123 Warehouse Drive',
      city: 'Dallas',
      state: 'TX',
      postal_code: '75201',
      country: 'US',
      phone: '555-123-4567'
    };
  }

  private getWhiteGloveNotes(items: CartLineItem[]): string | undefined {
    const whiteGloveItems = items.filter(item => item.white_glove_selected);
    if (whiteGloveItems.length === 0) return undefined;

    return `White glove delivery requested for: ${whiteGloveItems.map(item => item.product.name).join(', ')}`;
  }

  private getAssemblyInstructions(items: CartLineItem[]): string | undefined {
    const assemblyItems = items.filter(item => 
      item.white_glove_selected && ['Massage Chair', 'Spa'].includes(item.product.category)
    );
    
    if (assemblyItems.length === 0) return undefined;

    return `Assembly required for: ${assemblyItems.map(item => item.product.name).join(', ')}. Please follow manufacturer instructions.`;
  }

  private getGiftMessage(items: CartLineItem[]): string | undefined {
    const giftItems = items.filter(item => item.is_gift);
    if (giftItems.length === 0) return undefined;

    return `Complimentary gift items included with purchase. Gift receipt enclosed.`;
  }

  private calculateInsuranceValue(items: CartLineItem[]): number {
    const totalValue = items.reduce((total, item) => {
      const itemValue = item.price_override !== undefined ? item.price_override :
                      (item.product.sale_price_usd || item.product.price_usd);
      return total + (itemValue * item.quantity);
    }, 0);

    // Insure items over $500
    return totalValue > 500 ? totalValue : 0;
  }

  private requiresSignature(items: CartLineItem[]): boolean {
    return items.some(item => {
      const itemValue = item.product.sale_price_usd || item.product.price_usd;
      return itemValue > 500;
    });
  }

  private extractCarrier(shippingProfileId: string): string {
    if (shippingProfileId.includes('ups')) return 'UPS';
    if (shippingProfileId.includes('fedex')) return 'FedEx';
    if (shippingProfileId.includes('dhl')) return 'DHL';
    if (shippingProfileId.includes('ltl')) return 'LTL Freight';
    return 'Standard Carrier';
  }

  private extractServiceLevel(shippingProfileId: string): string {
    if (shippingProfileId.includes('express')) return 'Express';
    if (shippingProfileId.includes('2day')) return '2-Day';
    if (shippingProfileId.includes('white_glove')) return 'White Glove';
    if (shippingProfileId.includes('ltl')) return 'LTL Standard';
    return 'Ground';
  }

  private mapTrackingStatus(trackingStatus: string): Shipment['status'] {
    const statusMap: { [key: string]: Shipment['status'] } = {
      'SHIPPED': 'SHIPPED',
      'IN_TRANSIT': 'SHIPPED',
      'DELIVERED': 'DELIVERED',
      'EXCEPTION': 'EXCEPTION',
      'PENDING': 'PENDING'
    };

    return statusMap[trackingStatus.toUpperCase()] || 'PENDING';
  }

  private mapWebhookStatus(eventType: string): Shipment['status'] {
    switch (eventType) {
      case 'SHIPMENT_SHIPPED':
        return 'SHIPPED';
      case 'SHIPMENT_DELIVERED':
        return 'DELIVERED';
      case 'SHIPMENT_EXCEPTION':
        return 'EXCEPTION';
      default:
        return 'PENDING';
    }
  }

  private async onShipmentStatusChanged(shipment: Shipment, event: ShipStationWebhookEvent): Promise<void> {
    // Implement business logic for status changes
    console.log(`Shipment ${shipment.id} status changed to ${shipment.status}`);
    
    // Example: Send notifications, update order status, etc.
    if (shipment.status === 'DELIVERED') {
      console.log(`Shipment ${shipment.id} delivered successfully`);
      // Trigger delivery confirmation email
    }
    
    if (shipment.status === 'EXCEPTION') {
      console.log(`Shipment ${shipment.id} has an exception`);
      // Trigger customer service notification
    }
  }

  /**
   * Bulk operations
   */
  async updateAllShipmentTracking(): Promise<void> {
    const activeShipments = Array.from(this.shipments.values()).filter(
      shipment => !['DELIVERED', 'FAILED'].includes(shipment.status)
    );

    for (const shipment of activeShipments) {
      try {
        await this.updateShipmentTracking(shipment.id);
      } catch (error) {
        console.error(`Failed to update tracking for shipment ${shipment.id}:`, error);
      }
    }
  }

  /**
   * Get shipment statistics
   */
  getShipmentStats(): {
    total: number;
    by_status: { [status: string]: number };
    by_carrier: { [carrier: string]: number };
  } {
    const shipments = Array.from(this.shipments.values());
    
    const byStatus: { [status: string]: number } = {};
    const byCarrier: { [carrier: string]: number } = {};

    shipments.forEach(shipment => {
      byStatus[shipment.status] = (byStatus[shipment.status] || 0) + 1;
      byCarrier[shipment.carrier] = (byCarrier[shipment.carrier] || 0) + 1;
    });

    return {
      total: shipments.length,
      by_status: byStatus,
      by_carrier: byCarrier
    };
  }
}

// Create default instance
export const shipmentManager = new ShipmentManager();