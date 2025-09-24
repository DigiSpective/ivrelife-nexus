import { supabase } from './supabase';
import { StripeWebhookHandler } from './subscription-api';

// Types for webhook events
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key?: string;
  };
}

export interface WebhookLog {
  id: string;
  event_id: string;
  event_type: string;
  status: 'pending' | 'processed' | 'failed' | 'retrying';
  payload: any;
  response?: any;
  error_message?: string;
  retry_count: number;
  processed_at?: string;
  created_at: string;
}

// Webhook Event Handler Registry
export class WebhookEventHandler {
  private static handlers: Map<string, (event: WebhookEvent) => Promise<any>> = new Map();

  static register(eventType: string, handler: (event: WebhookEvent) => Promise<any>) {
    this.handlers.set(eventType, handler);
  }

  static async handle(event: WebhookEvent): Promise<any> {
    const handler = this.handlers.get(event.type);
    
    if (!handler) {
      console.warn(`No handler registered for event type: ${event.type}`);
      return { status: 'ignored', message: `No handler for ${event.type}` };
    }

    try {
      const result = await handler(event);
      return { status: 'success', result };
    } catch (error) {
      console.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  }
}

// Stripe Webhook Handlers
export class StripeWebhookHandlers {
  static async handleCustomerSubscriptionCreated(event: WebhookEvent) {
    try {
      const subscription = event.data.object;
      console.log('Processing subscription.created event:', subscription.id);

      const result = await StripeWebhookHandler.handleSubscriptionCreated(subscription);
      
      // Log audit trail
      await supabase.from('audit_logs').insert([{
        table_name: 'user_subscriptions',
        record_id: result.id,
        action: 'create',
        new_values: result,
        metadata: {
          webhook_event: event.id,
          stripe_subscription_id: subscription.id
        }
      }]);

      return { subscriptionId: result.id };
    } catch (error) {
      console.error('Error handling subscription.created:', error);
      throw error;
    }
  }

  static async handleCustomerSubscriptionUpdated(event: WebhookEvent) {
    try {
      const subscription = event.data.object;
      console.log('Processing subscription.updated event:', subscription.id);

      const result = await StripeWebhookHandler.handleSubscriptionUpdated(subscription);
      
      if (result) {
        // Log audit trail
        await supabase.from('audit_logs').insert([{
          table_name: 'user_subscriptions',
          record_id: result.id,
          action: 'update',
          new_values: result,
          metadata: {
            webhook_event: event.id,
            stripe_subscription_id: subscription.id
          }
        }]);
      }

      return { subscriptionId: result?.id };
    } catch (error) {
      console.error('Error handling subscription.updated:', error);
      throw error;
    }
  }

  static async handleCustomerSubscriptionDeleted(event: WebhookEvent) {
    try {
      const subscription = event.data.object;
      console.log('Processing subscription.deleted event:', subscription.id);

      // Update subscription status to canceled
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'canceled',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)
        .select()
        .single();

      if (error) throw error;

      // Log audit trail
      await supabase.from('audit_logs').insert([{
        table_name: 'user_subscriptions',
        record_id: data.id,
        action: 'update',
        new_values: data,
        metadata: {
          webhook_event: event.id,
          stripe_subscription_id: subscription.id,
          reason: 'subscription_deleted'
        }
      }]);

      return { subscriptionId: data.id };
    } catch (error) {
      console.error('Error handling subscription.deleted:', error);
      throw error;
    }
  }

  static async handleInvoicePaymentSucceeded(event: WebhookEvent) {
    try {
      const invoice = event.data.object;
      console.log('Processing invoice.payment_succeeded event:', invoice.id);

      const result = await StripeWebhookHandler.handleInvoicePaymentSucceeded(invoice);
      
      if (result) {
        // Send payment confirmation email (placeholder)
        await sendPaymentConfirmationEmail(result);
        
        // Log audit trail
        await supabase.from('audit_logs').insert([{
          table_name: 'invoices',
          record_id: result.id,
          action: result.created_at === result.updated_at ? 'create' : 'update',
          new_values: result,
          metadata: {
            webhook_event: event.id,
            stripe_invoice_id: invoice.id
          }
        }]);
      }

      return { invoiceId: result?.id };
    } catch (error) {
      console.error('Error handling invoice.payment_succeeded:', error);
      throw error;
    }
  }

  static async handleInvoicePaymentFailed(event: WebhookEvent) {
    try {
      const invoice = event.data.object;
      console.log('Processing invoice.payment_failed event:', invoice.id);

      // Update invoice status
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'uncollectible' })
        .eq('stripe_invoice_id', invoice.id)
        .select()
        .single();

      if (error) {
        console.error('Invoice not found in database:', invoice.id);
        return { status: 'invoice_not_found' };
      }

      // Send payment failure notification
      await sendPaymentFailureNotification(data);

      // Log audit trail
      await supabase.from('audit_logs').insert([{
        table_name: 'invoices',
        record_id: data.id,
        action: 'update',
        new_values: data,
        metadata: {
          webhook_event: event.id,
          stripe_invoice_id: invoice.id,
          reason: 'payment_failed'
        }
      }]);

      return { invoiceId: data.id };
    } catch (error) {
      console.error('Error handling invoice.payment_failed:', error);
      throw error;
    }
  }

  static async handleCustomerCreated(event: WebhookEvent) {
    try {
      const customer = event.data.object;
      console.log('Processing customer.created event:', customer.id);

      // Update user record with Stripe customer ID
      const { data, error } = await supabase
        .from('app_users')
        .update({ stripe_customer_id: customer.id })
        .eq('email', customer.email)
        .select()
        .single();

      if (error) {
        console.error('User not found for customer:', customer.email);
        return { status: 'user_not_found' };
      }

      // Log audit trail
      await supabase.from('audit_logs').insert([{
        table_name: 'app_users',
        record_id: data.id,
        action: 'update',
        new_values: { stripe_customer_id: customer.id },
        metadata: {
          webhook_event: event.id,
          stripe_customer_id: customer.id
        }
      }]);

      return { userId: data.id };
    } catch (error) {
      console.error('Error handling customer.created:', error);
      throw error;
    }
  }

  static async handlePaymentMethodAttached(event: WebhookEvent) {
    try {
      const paymentMethod = event.data.object;
      console.log('Processing payment_method.attached event:', paymentMethod.id);

      // Get customer details to find user
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('id')
        .eq('stripe_customer_id', paymentMethod.customer)
        .single();

      if (userError) {
        console.error('User not found for customer:', paymentMethod.customer);
        return { status: 'user_not_found' };
      }

      // Create payment method record
      const paymentMethodData = {
        user_id: userData.id,
        type: paymentMethod.type === 'card' ? 'credit_card' : paymentMethod.type,
        brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '',
        expiry_month: paymentMethod.card?.exp_month,
        expiry_year: paymentMethod.card?.exp_year,
        is_default: false, // Will be set separately if this is the default
        stripe_payment_method_id: paymentMethod.id,
        billing_address: {
          line1: paymentMethod.billing_details?.address?.line1 || '',
          line2: paymentMethod.billing_details?.address?.line2,
          city: paymentMethod.billing_details?.address?.city || '',
          state: paymentMethod.billing_details?.address?.state || '',
          postal_code: paymentMethod.billing_details?.address?.postal_code || '',
          country: paymentMethod.billing_details?.address?.country || ''
        }
      };

      const { data, error } = await supabase
        .from('payment_methods')
        .insert([paymentMethodData])
        .select()
        .single();

      if (error) throw error;

      // Log audit trail
      await supabase.from('audit_logs').insert([{
        table_name: 'payment_methods',
        record_id: data.id,
        action: 'create',
        new_values: data,
        metadata: {
          webhook_event: event.id,
          stripe_payment_method_id: paymentMethod.id
        }
      }]);

      return { paymentMethodId: data.id };
    } catch (error) {
      console.error('Error handling payment_method.attached:', error);
      throw error;
    }
  }

  static async handlePaymentMethodDetached(event: WebhookEvent) {
    try {
      const paymentMethod = event.data.object;
      console.log('Processing payment_method.detached event:', paymentMethod.id);

      // Delete payment method record
      const { data, error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('stripe_payment_method_id', paymentMethod.id)
        .select()
        .single();

      if (error) {
        console.error('Payment method not found:', paymentMethod.id);
        return { status: 'payment_method_not_found' };
      }

      // Log audit trail
      await supabase.from('audit_logs').insert([{
        table_name: 'payment_methods',
        record_id: data.id,
        action: 'delete',
        old_values: data,
        metadata: {
          webhook_event: event.id,
          stripe_payment_method_id: paymentMethod.id
        }
      }]);

      return { paymentMethodId: data.id };
    } catch (error) {
      console.error('Error handling payment_method.detached:', error);
      throw error;
    }
  }
}

// Webhook Logging Service
export class WebhookLogger {
  static async logIncoming(event: WebhookEvent): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .insert([{
          event_id: event.id,
          event_type: event.type,
          status: 'pending',
          payload: event,
          retry_count: 0
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error logging webhook event:', error);
      throw error;
    }
  }

  static async logProcessed(logId: string, result: any): Promise<void> {
    try {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'processed',
          response: result,
          processed_at: new Date().toISOString()
        })
        .eq('id', logId);
    } catch (error) {
      console.error('Error updating webhook log:', error);
    }
  }

  static async logFailed(logId: string, error: any): Promise<void> {
    try {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'failed',
          error_message: error.message || String(error),
          processed_at: new Date().toISOString()
        })
        .eq('id', logId);
    } catch (updateError) {
      console.error('Error updating webhook log with failure:', updateError);
    }
  }

  static async incrementRetry(logId: string): Promise<void> {
    try {
      await supabase.rpc('increment_webhook_retry', { log_id: logId });
    } catch (error) {
      console.error('Error incrementing webhook retry count:', error);
    }
  }
}

// Notification Services (placeholder implementations)
async function sendPaymentConfirmationEmail(invoice: any): Promise<void> {
  try {
    console.log('Sending payment confirmation email for invoice:', invoice.id);
    // Implementation would integrate with email service (SendGrid, etc.)
    
    // Log notification
    await supabase.from('notifications').insert([{
      user_id: invoice.user_id,
      type: 'payment_confirmation',
      title: 'Payment Received',
      message: `Your payment for invoice ${invoice.number} has been processed successfully.`,
      metadata: {
        invoice_id: invoice.id,
        amount: invoice.amount_total
      }
    }]);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

async function sendPaymentFailureNotification(invoice: any): Promise<void> {
  try {
    console.log('Sending payment failure notification for invoice:', invoice.id);
    // Implementation would integrate with email service
    
    // Log notification
    await supabase.from('notifications').insert([{
      user_id: invoice.user_id,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `We were unable to process payment for invoice ${invoice.number}. Please update your payment method.`,
      metadata: {
        invoice_id: invoice.id,
        amount: invoice.amount_total
      }
    }]);
  } catch (error) {
    console.error('Error sending payment failure notification:', error);
  }
}

// Register Stripe webhook handlers
WebhookEventHandler.register('customer.subscription.created', StripeWebhookHandlers.handleCustomerSubscriptionCreated);
WebhookEventHandler.register('customer.subscription.updated', StripeWebhookHandlers.handleCustomerSubscriptionUpdated);
WebhookEventHandler.register('customer.subscription.deleted', StripeWebhookHandlers.handleCustomerSubscriptionDeleted);
WebhookEventHandler.register('invoice.payment_succeeded', StripeWebhookHandlers.handleInvoicePaymentSucceeded);
WebhookEventHandler.register('invoice.payment_failed', StripeWebhookHandlers.handleInvoicePaymentFailed);
WebhookEventHandler.register('customer.created', StripeWebhookHandlers.handleCustomerCreated);
WebhookEventHandler.register('payment_method.attached', StripeWebhookHandlers.handlePaymentMethodAttached);
WebhookEventHandler.register('payment_method.detached', StripeWebhookHandlers.handlePaymentMethodDetached);

// Main webhook processing function
export async function processWebhook(event: WebhookEvent): Promise<any> {
  let logId: string | null = null;
  
  try {
    // Log incoming webhook
    logId = await WebhookLogger.logIncoming(event);
    
    // Process the event
    const result = await WebhookEventHandler.handle(event);
    
    // Log success
    if (logId) {
      await WebhookLogger.logProcessed(logId, result);
    }
    
    return result;
  } catch (error) {
    // Log failure
    if (logId) {
      await WebhookLogger.logFailed(logId, error);
    }
    
    throw error;
  }
}

// Webhook retry mechanism
export async function retryFailedWebhooks(): Promise<void> {
  try {
    const { data: failedWebhooks, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;

    for (const webhook of failedWebhooks || []) {
      try {
        console.log(`Retrying webhook ${webhook.event_id} (attempt ${webhook.retry_count + 1})`);
        
        // Increment retry count
        await WebhookLogger.incrementRetry(webhook.id);
        
        // Retry processing
        const result = await WebhookEventHandler.handle(webhook.payload);
        
        // Log success
        await WebhookLogger.logProcessed(webhook.id, result);
        
        console.log(`Successfully retried webhook ${webhook.event_id}`);
      } catch (retryError) {
        console.error(`Failed to retry webhook ${webhook.event_id}:`, retryError);
        await WebhookLogger.logFailed(webhook.id, retryError);
      }
    }
  } catch (error) {
    console.error('Error retrying failed webhooks:', error);
  }
}