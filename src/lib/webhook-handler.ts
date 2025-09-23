/**
 * Webhook Handler for ShipStation Integration
 * Handles incoming webhook events from ShipStation
 */

import { ShipStationWebhookEvent } from '@/types/shipping';
import { shipmentManager } from './shipment-manager';

export class WebhookHandler {
  /**
   * Process incoming ShipStation webhook
   */
  async handleShipStationWebhook(
    event: ShipStationWebhookEvent,
    signature?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature (in production)
      if (!this.verifySignature(event, signature)) {
        return {
          success: false,
          message: 'Invalid webhook signature'
        };
      }

      // Process the event based on type
      switch (event.event_type) {
        case 'SHIPMENT_SHIPPED':
          await this.handleShipmentShipped(event);
          break;
        case 'SHIPMENT_DELIVERED':
          await this.handleShipmentDelivered(event);
          break;
        case 'SHIPMENT_EXCEPTION':
          await this.handleShipmentException(event);
          break;
        default:
          console.warn(`Unhandled webhook event type: ${event.event_type}`);
      }

      return {
        success: true,
        message: 'Webhook processed successfully'
      };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle shipment shipped event
   */
  private async handleShipmentShipped(event: ShipStationWebhookEvent): Promise<void> {
    console.log(`Shipment shipped: ${event.data.tracking_number}`);
    
    // Update shipment status
    await shipmentManager.handleWebhookEvent(event);
    
    // Send customer notification
    await this.sendShipmentNotification(event.data.order_id, 'shipped', {
      tracking_number: event.data.tracking_number,
      carrier: event.data.carrier
    });
    
    // Update order status if all shipments are shipped
    await this.updateOrderStatusIfComplete(event.data.order_id);
  }

  /**
   * Handle shipment delivered event
   */
  private async handleShipmentDelivered(event: ShipStationWebhookEvent): Promise<void> {
    console.log(`Shipment delivered: ${event.data.tracking_number}`);
    
    // Update shipment status
    await shipmentManager.handleWebhookEvent(event);
    
    // Send delivery confirmation
    await this.sendShipmentNotification(event.data.order_id, 'delivered', {
      tracking_number: event.data.tracking_number,
      delivery_date: event.data.delivery_date
    });
    
    // Update order status
    await this.updateOrderStatusIfComplete(event.data.order_id);
    
    // Trigger post-delivery workflows
    await this.triggerPostDeliveryWorkflows(event.data.order_id);
  }

  /**
   * Handle shipment exception event
   */
  private async handleShipmentException(event: ShipStationWebhookEvent): Promise<void> {
    console.log(`Shipment exception: ${event.data.tracking_number}`);
    
    // Update shipment status
    await shipmentManager.handleWebhookEvent(event);
    
    // Alert customer service
    await this.alertCustomerService(event);
    
    // Send customer notification about exception
    await this.sendShipmentNotification(event.data.order_id, 'exception', {
      tracking_number: event.data.tracking_number,
      exception_reason: 'Delivery exception - please contact customer service'
    });
  }

  /**
   * Verify webhook signature (implement actual verification)
   */
  private verifySignature(event: ShipStationWebhookEvent, signature?: string): boolean {
    // In production, implement proper signature verification
    // using your webhook secret key
    
    if (process.env.NODE_ENV === 'production' && !signature) {
      return false;
    }
    
    // For development, always allow
    return true;
  }

  /**
   * Send customer notification
   */
  private async sendShipmentNotification(
    orderId: string, 
    type: 'shipped' | 'delivered' | 'exception',
    data: any
  ): Promise<void> {
    try {
      // This would integrate with your notification service
      // (email, SMS, push notifications, etc.)
      
      const templates = {
        shipped: {
          subject: 'Your order has shipped!',
          message: `Your order ${orderId} has shipped with tracking number ${data.tracking_number} via ${data.carrier}.`
        },
        delivered: {
          subject: 'Your order has been delivered!',
          message: `Your order ${orderId} was delivered on ${data.delivery_date}. Thank you for your business!`
        },
        exception: {
          subject: 'Update on your shipment',
          message: `There was an issue with your shipment ${data.tracking_number}. ${data.exception_reason}`
        }
      };

      const template = templates[type];
      
      console.log(`Sending ${type} notification for order ${orderId}:`, template);
      
      // In a real implementation, you would:
      // 1. Look up customer contact information
      // 2. Send email/SMS notification
      // 3. Log notification in database
      // 4. Handle notification failures and retries
      
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
    }
  }

  /**
   * Alert customer service team
   */
  private async alertCustomerService(event: ShipStationWebhookEvent): Promise<void> {
    try {
      // This would integrate with your customer service platform
      // (Zendesk, Freshdesk, Slack, etc.)
      
      const alert = {
        type: 'shipping_exception',
        priority: 'high',
        order_id: event.data.order_id,
        tracking_number: event.data.tracking_number,
        carrier: event.data.carrier,
        timestamp: event.timestamp,
        message: `Shipping exception for order ${event.data.order_id}. Tracking: ${event.data.tracking_number}`
      };

      console.log('Customer service alert:', alert);
      
      // In a real implementation:
      // 1. Create ticket in customer service system
      // 2. Send Slack/Teams notification
      // 3. Update order notes
      // 4. Escalate if high-value order
      
    } catch (error) {
      console.error('Failed to alert customer service:', error);
    }
  }

  /**
   * Update order status if all shipments are complete
   */
  private async updateOrderStatusIfComplete(orderId: string): Promise<void> {
    try {
      const orderShipments = shipmentManager.getOrderShipments(orderId);
      
      if (orderShipments.length === 0) return;

      const allDelivered = orderShipments.every(shipment => 
        shipment.status === 'DELIVERED'
      );
      
      const hasExceptions = orderShipments.some(shipment => 
        shipment.status === 'EXCEPTION'
      );

      if (allDelivered) {
        console.log(`Order ${orderId} fully delivered`);
        // Update order status to 'delivered'
        // This would integrate with your order management system
      } else if (hasExceptions) {
        console.log(`Order ${orderId} has shipping exceptions`);
        // Update order status to indicate issues
      }
      
    } catch (error) {
      console.error(`Failed to update order status for ${orderId}:`, error);
    }
  }

  /**
   * Trigger post-delivery workflows
   */
  private async triggerPostDeliveryWorkflows(orderId: string): Promise<void> {
    try {
      // Post-delivery actions:
      // 1. Send review request email
      // 2. Update customer loyalty points
      // 3. Trigger warranty registration
      // 4. Schedule follow-up communications
      
      console.log(`Triggering post-delivery workflows for order ${orderId}`);
      
      // Example workflows:
      setTimeout(() => {
        this.scheduleReviewRequest(orderId);
      }, 24 * 60 * 60 * 1000); // 24 hours later
      
      setTimeout(() => {
        this.scheduleFollowUp(orderId);
      }, 7 * 24 * 60 * 60 * 1000); // 7 days later
      
    } catch (error) {
      console.error(`Failed to trigger post-delivery workflows for ${orderId}:`, error);
    }
  }

  /**
   * Schedule review request
   */
  private async scheduleReviewRequest(orderId: string): Promise<void> {
    console.log(`Scheduling review request for order ${orderId}`);
    // Implementation would depend on your review system
  }

  /**
   * Schedule follow-up communication
   */
  private async scheduleFollowUp(orderId: string): Promise<void> {
    console.log(`Scheduling follow-up for order ${orderId}`);
    // Implementation would depend on your CRM system
  }

  /**
   * Get webhook endpoint URL for registration
   */
  static getWebhookEndpoint(): string {
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://your-domain.com';
    return `${baseUrl}/webhooks/shipstation`;
  }

  /**
   * Register webhook with ShipStation (call this during setup)
   */
  static async registerWebhook(): Promise<void> {
    try {
      // This would call ShipStation API to register webhook
      const webhookConfig = {
        target_url: WebhookHandler.getWebhookEndpoint(),
        event: 'SHIPMENT_NOTIFY',
        store_id: null, // null for all stores
        friendly_name: 'IV RELIFE Shipment Notifications'
      };

      console.log('Webhook registration config:', webhookConfig);
      
      // In production, call ShipStation webhook registration API
      // const response = await shipStationAPI.registerWebhook(webhookConfig);
      
    } catch (error) {
      console.error('Failed to register webhook:', error);
    }
  }
}

// Create default instance
export const webhookHandler = new WebhookHandler();

// Express.js webhook endpoint example
export const createWebhookEndpoint = () => {
  return async (req: any, res: any) => {
    try {
      const signature = req.headers['x-shipstation-signature'];
      const event: ShipStationWebhookEvent = req.body;

      const result = await webhookHandler.handleShipStationWebhook(event, signature);

      if (result.success) {
        res.status(200).json({ message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Webhook endpoint error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};