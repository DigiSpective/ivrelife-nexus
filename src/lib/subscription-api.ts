import { supabase } from './supabase';

// Types for subscription management
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    users: number | 'unlimited';
    storage_gb: number | 'unlimited';
    api_calls_monthly: number | 'unlimited';
    support_level: string;
  };
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  is_popular?: boolean;
  is_enterprise?: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  billing_cycle: 'monthly' | 'yearly';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'paypal';
  brand: string;
  last4: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  stripe_payment_method_id?: string;
  billing_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string;
  number: string;
  amount_subtotal: number;
  amount_tax: number;
  amount_total: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoice_date: string;
  due_date: string;
  payment_method_id?: string;
  stripe_invoice_id?: string;
  download_url?: string;
  created_at: string;
}

export interface UsageMetrics {
  id: string;
  user_id: string;
  subscription_id: string;
  period_start: string;
  period_end: string;
  users_count: number;
  api_calls_count: number;
  storage_bytes: number;
  bandwidth_bytes: number;
  created_at: string;
}

// Subscription Plans API
export class SubscriptionPlansAPI {
  static async getAll(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  static async getById(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }
  }
}

// User Subscription API
export class UserSubscriptionAPI {
  static async getCurrent(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return null;
    }
  }

  static async getHistory(userId: string): Promise<UserSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw new Error('Failed to fetch subscription history');
    }
  }

  static async create(subscriptionData: Partial<UserSubscription>): Promise<UserSubscription> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  static async update(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  static async cancel(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<UserSubscription> {
    try {
      const updates = cancelAtPeriodEnd 
        ? { cancel_at_period_end: true }
        : { status: 'canceled' as const, cancel_at_period_end: false };

      return await this.update(subscriptionId, updates);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }
}

// Payment Methods API
export class PaymentMethodsAPI {
  static async getByUser(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new Error('Failed to fetch payment methods');
    }
  }

  static async create(paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([paymentMethodData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw new Error('Failed to create payment method');
    }
  }

  static async setDefault(paymentMethodId: string, userId: string): Promise<void> {
    try {
      // First, unset all existing default payment methods for the user
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Then set the specified payment method as default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error('Failed to set default payment method');
    }
  }

  static async delete(paymentMethodId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw new Error('Failed to delete payment method');
    }
  }
}

// Invoices API
export class InvoicesAPI {
  static async getByUser(userId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          payment_methods (brand, last4)
        `)
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices');
    }
  }

  static async getById(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  static async markAsPaid(invoiceId: string): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw new Error('Failed to mark invoice as paid');
    }
  }

  static async generateDownloadUrl(invoiceId: string): Promise<string> {
    try {
      // In a real implementation, this would generate a secure download URL
      const invoice = await this.getById(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // For now, return a placeholder URL
      return `/api/invoices/${invoiceId}/download`;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }
}

// Usage Metrics API
export class UsageMetricsAPI {
  static async getCurrent(userId: string): Promise<UsageMetrics | null> {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('period_start', startOfMonth.toISOString())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current usage metrics:', error);
      return null;
    }
  }

  static async getHistory(userId: string, months: number = 6): Promise<UsageMetrics[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const { data, error } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('period_start', startDate.toISOString())
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching usage metrics history:', error);
      throw new Error('Failed to fetch usage metrics history');
    }
  }

  static async record(userId: string, subscriptionId: string, metrics: Partial<UsageMetrics>): Promise<UsageMetrics> {
    try {
      const { data, error } = await supabase
        .from('usage_metrics')
        .insert([{
          user_id: userId,
          subscription_id: subscriptionId,
          ...metrics
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording usage metrics:', error);
      throw new Error('Failed to record usage metrics');
    }
  }
}

// Stripe Integration (for webhook handling)
export class StripeWebhookHandler {
  static async handleSubscriptionCreated(stripeSubscription: any): Promise<UserSubscription> {
    try {
      const subscriptionData: Partial<UserSubscription> = {
        user_id: stripeSubscription.metadata.user_id,
        plan_id: stripeSubscription.metadata.plan_id,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        billing_cycle: stripeSubscription.items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly',
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: stripeSubscription.customer
      };

      return await UserSubscriptionAPI.create(subscriptionData);
    } catch (error) {
      console.error('Error handling subscription created webhook:', error);
      throw new Error('Failed to handle subscription created webhook');
    }
  }

  static async handleSubscriptionUpdated(stripeSubscription: any): Promise<UserSubscription | null> {
    try {
      const { data: existingSubscription, error } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('stripe_subscription_id', stripeSubscription.id)
        .single();

      if (error) throw error;

      const updates: Partial<UserSubscription> = {
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end
      };

      return await UserSubscriptionAPI.update(existingSubscription.id, updates);
    } catch (error) {
      console.error('Error handling subscription updated webhook:', error);
      return null;
    }
  }

  static async handleInvoicePaymentSucceeded(stripeInvoice: any): Promise<Invoice | null> {
    try {
      const { data: existingInvoice, error } = await supabase
        .from('invoices')
        .select('id')
        .eq('stripe_invoice_id', stripeInvoice.id)
        .single();

      if (error) {
        // Create new invoice if it doesn't exist
        const invoiceData: Partial<Invoice> = {
          user_id: stripeInvoice.metadata.user_id,
          subscription_id: stripeInvoice.subscription,
          number: stripeInvoice.number,
          amount_subtotal: stripeInvoice.subtotal / 100,
          amount_tax: stripeInvoice.tax / 100,
          amount_total: stripeInvoice.total / 100,
          currency: stripeInvoice.currency.toUpperCase(),
          status: 'paid',
          invoice_date: new Date(stripeInvoice.created * 1000).toISOString(),
          due_date: new Date(stripeInvoice.due_date * 1000).toISOString(),
          stripe_invoice_id: stripeInvoice.id,
          download_url: stripeInvoice.invoice_pdf
        };

        const { data, error: createError } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select()
          .single();

        if (createError) throw createError;
        return data;
      } else {
        // Update existing invoice
        return await InvoicesAPI.markAsPaid(existingInvoice.id);
      }
    } catch (error) {
      console.error('Error handling invoice payment succeeded webhook:', error);
      return null;
    }
  }
}

// Main Subscription Service
export class SubscriptionService {
  static async initializeForUser(userId: string) {
    try {
      // Get or create default usage metrics for current period
      const currentUsage = await UsageMetricsAPI.getCurrent(userId);
      
      if (!currentUsage) {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const subscription = await UserSubscriptionAPI.getCurrent(userId);
        if (subscription) {
          await UsageMetricsAPI.record(userId, subscription.id, {
            period_start: startOfMonth.toISOString(),
            period_end: endOfMonth.toISOString(),
            users_count: 0,
            api_calls_count: 0,
            storage_bytes: 0,
            bandwidth_bytes: 0
          });
        }
      }
    } catch (error) {
      console.error('Error initializing subscription for user:', error);
    }
  }

  static async checkUsageLimits(userId: string): Promise<{
    withinLimits: boolean;
    warnings: string[];
    exceeded: string[];
  }> {
    try {
      const subscription = await UserSubscriptionAPI.getCurrent(userId);
      const usage = await UsageMetricsAPI.getCurrent(userId);
      
      if (!subscription || !usage) {
        return { withinLimits: true, warnings: [], exceeded: [] };
      }

      const plan = await SubscriptionPlansAPI.getById(subscription.plan_id);
      if (!plan) {
        return { withinLimits: true, warnings: [], exceeded: [] };
      }

      const warnings: string[] = [];
      const exceeded: string[] = [];

      // Check users limit
      if (plan.limits.users !== 'unlimited' && usage.users_count > plan.limits.users * 0.8) {
        if (usage.users_count > plan.limits.users) {
          exceeded.push(`User limit exceeded: ${usage.users_count}/${plan.limits.users}`);
        } else {
          warnings.push(`Approaching user limit: ${usage.users_count}/${plan.limits.users}`);
        }
      }

      // Check API calls limit
      if (plan.limits.api_calls_monthly !== 'unlimited' && usage.api_calls_count > plan.limits.api_calls_monthly * 0.8) {
        if (usage.api_calls_count > plan.limits.api_calls_monthly) {
          exceeded.push(`API calls limit exceeded: ${usage.api_calls_count}/${plan.limits.api_calls_monthly}`);
        } else {
          warnings.push(`Approaching API calls limit: ${usage.api_calls_count}/${plan.limits.api_calls_monthly}`);
        }
      }

      // Check storage limit
      const storageGB = usage.storage_bytes / (1024 * 1024 * 1024);
      if (plan.limits.storage_gb !== 'unlimited' && storageGB > plan.limits.storage_gb * 0.8) {
        if (storageGB > plan.limits.storage_gb) {
          exceeded.push(`Storage limit exceeded: ${storageGB.toFixed(2)}GB/${plan.limits.storage_gb}GB`);
        } else {
          warnings.push(`Approaching storage limit: ${storageGB.toFixed(2)}GB/${plan.limits.storage_gb}GB`);
        }
      }

      return {
        withinLimits: exceeded.length === 0,
        warnings,
        exceeded
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return { withinLimits: true, warnings: [], exceeded: [] };
    }
  }
}