import { useCallback } from 'react';
import { createOutboxEvent } from '@/lib/audit-logger';
import { OutboxEvent } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const queueNotification = useCallback(async (
    eventType: OutboxEvent['event_type'],
    entity: string,
    entityId: string,
    payload: any
  ) => {
    try {
      const { error } = await createOutboxEvent({
        event_type: eventType,
        entity,
        entity_id: entityId,
        payload: {
          ...payload,
          initiated_by: user?.id,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Failed to queue notification:', error);
        throw error;
      }
    } catch (err) {
      console.error('Notification queue error:', err);
      throw err;
    }
  }, [user?.id]);

  const showToast = useCallback((
    title: string,
    description?: string,
    variant: 'default' | 'destructive' = 'default'
  ) => {
    toast({
      title,
      description,
      variant
    });
  }, [toast]);

  const showSuccessToast = useCallback((title: string, description?: string) => {
    showToast(title, description, 'default');
  }, [showToast]);

  const showErrorToast = useCallback((title: string, description?: string) => {
    showToast(title, description, 'destructive');
  }, [showToast]);

  return {
    queueNotification,
    showToast,
    showSuccessToast,
    showErrorToast
  };
};

// Specific notification hooks for different types of events
export const useAuthNotifications = () => {
  const { queueNotification } = useNotification();

  const notifyWelcome = useCallback(async (userId: string, email: string, name: string) => {
    return queueNotification('welcome_email', 'users', userId, {
      email,
      name,
      template: 'welcome'
    });
  }, [queueNotification]);

  const notifyPasswordReset = useCallback(async (email: string, resetToken: string) => {
    return queueNotification('password_reset_email', 'users', email, {
      email,
      reset_token: resetToken,
      template: 'password_reset'
    });
  }, [queueNotification]);

  const notifyInvite = useCallback(async (
    email: string, 
    inviteTokenId: string, 
    inviterName: string, 
    role: string
  ) => {
    return queueNotification('invite_email', 'invite_tokens', inviteTokenId, {
      email,
      invite_token_id: inviteTokenId,
      inviter_name: inviterName,
      role,
      template: 'invite'
    });
  }, [queueNotification]);

  return {
    notifyWelcome,
    notifyPasswordReset,
    notifyInvite
  };
};

// Business notifications
export const useBusinessNotifications = () => {
  const { queueNotification } = useNotification();

  const notifyOrderStatusChange = useCallback(async (
    orderId: string,
    customerId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    return queueNotification('notification', 'orders', orderId, {
      type: 'order_status_change',
      customer_id: customerId,
      old_status: oldStatus,
      new_status: newStatus,
      template: 'order_status_change'
    });
  }, [queueNotification]);

  const notifyClaimUpdate = useCallback(async (
    claimId: string,
    customerId: string,
    status: string,
    message?: string
  ) => {
    return queueNotification('notification', 'claims', claimId, {
      type: 'claim_update',
      customer_id: customerId,
      status,
      message,
      template: 'claim_update'
    });
  }, [queueNotification]);

  const notifyShippingUpdate = useCallback(async (
    orderId: string,
    customerId: string,
    trackingNumber: string,
    status: string
  ) => {
    return queueNotification('notification', 'orders', orderId, {
      type: 'shipping_update',
      customer_id: customerId,
      tracking_number: trackingNumber,
      status,
      template: 'shipping_update'
    });
  }, [queueNotification]);

  const notifyRetailerOnboarding = useCallback(async (
    retailerId: string,
    email: string,
    name: string
  ) => {
    return queueNotification('notification', 'retailers', retailerId, {
      type: 'retailer_onboarding',
      email,
      name,
      template: 'retailer_onboarding'
    });
  }, [queueNotification]);

  return {
    notifyOrderStatusChange,
    notifyClaimUpdate,
    notifyShippingUpdate,
    notifyRetailerOnboarding
  };
};

// System notifications for admins
export const useSystemNotifications = () => {
  const { queueNotification } = useNotification();

  const notifySystemAlert = useCallback(async (
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    details?: any
  ) => {
    return queueNotification('notification', 'system', `alert-${Date.now()}`, {
      type: 'system_alert',
      alert_type: alertType,
      severity,
      message,
      details,
      template: 'system_alert'
    });
  }, [queueNotification]);

  const notifyLowInventory = useCallback(async (
    productVariantId: string,
    sku: string,
    currentQuantity: number,
    threshold: number
  ) => {
    return queueNotification('notification', 'product_variants', productVariantId, {
      type: 'low_inventory',
      sku,
      current_quantity: currentQuantity,
      threshold,
      template: 'low_inventory'
    });
  }, [queueNotification]);

  const notifyFailedPayment = useCallback(async (
    orderId: string,
    customerId: string,
    amount: number,
    reason: string
  ) => {
    return queueNotification('notification', 'orders', orderId, {
      type: 'failed_payment',
      customer_id: customerId,
      amount,
      reason,
      template: 'failed_payment'
    });
  }, [queueNotification]);

  return {
    notifySystemAlert,
    notifyLowInventory,
    notifyFailedPayment
  };
};