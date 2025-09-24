import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  SubscriptionPlansAPI,
  UserSubscriptionAPI,
  PaymentMethodsAPI,
  InvoicesAPI,
  UsageMetricsAPI,
  SubscriptionService,
  type SubscriptionPlan,
  type UserSubscription,
  type PaymentMethod,
  type Invoice,
  type UsageMetrics
} from '@/lib/subscription-api';
import {
  SubscriptionValidator,
  UsageLimitChecker,
  RetryHandler,
  type SubscriptionError,
  type PaymentError,
  type ValidationError,
  type UsageLimitError
} from '@/lib/subscription-validation';

// Hook for subscription plans
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: SubscriptionPlansAPI.getAll,
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for current user subscription
export function useCurrentSubscription(userId: string) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => UserSubscriptionAPI.getCurrent(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for subscription history
export function useSubscriptionHistory(userId: string) {
  return useQuery({
    queryKey: ['subscription-history', userId],
    queryFn: () => UserSubscriptionAPI.getHistory(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Hook for payment methods
export function usePaymentMethods(userId: string) {
  return useQuery({
    queryKey: ['payment-methods', userId],
    queryFn: () => PaymentMethodsAPI.getByUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for invoices
export function useInvoices(userId: string) {
  return useQuery({
    queryKey: ['invoices', userId],
    queryFn: () => InvoicesAPI.getByUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for usage metrics
export function useUsageMetrics(userId: string) {
  const currentUsageQuery = useQuery({
    queryKey: ['usage-metrics', userId, 'current'],
    queryFn: () => UsageMetricsAPI.getCurrent(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 1 minute (more frequent updates)
  });

  const historyQuery = useQuery({
    queryKey: ['usage-metrics', userId, 'history'],
    queryFn: () => UsageMetricsAPI.getHistory(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    current: currentUsageQuery,
    history: historyQuery,
  };
}

// Hook for subscription management actions
export function useSubscriptionActions(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { planId: string; billingCycle: 'monthly' | 'yearly' }) => {
      return await RetryHandler.withRetry(async () => {
        // In a real implementation, this would integrate with Stripe
        const subscriptionData = {
          user_id: userId,
          plan_id: data.planId,
          status: 'active' as const,
          billing_cycle: data.billingCycle,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (data.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false
        };
        
        return await UserSubscriptionAPI.create(subscriptionData);
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history', userId] });
      toast({
        title: "Subscription Created",
        description: "Your subscription has been created successfully.",
      });
    },
    onError: (error: any) => {
      handleSubscriptionError(error, toast);
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: { subscriptionId: string; updates: Partial<UserSubscription> }) => {
      return await RetryHandler.withRetry(async () => {
        return await UserSubscriptionAPI.update(data.subscriptionId, data.updates);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history', userId] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error: any) => {
      handleSubscriptionError(error, toast);
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (data: { subscriptionId: string; cancelAtPeriodEnd?: boolean }) => {
      return await RetryHandler.withRetry(async () => {
        return await UserSubscriptionAPI.cancel(data.subscriptionId, data.cancelAtPeriodEnd);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history', userId] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully.",
      });
    },
    onError: (error: any) => {
      handleSubscriptionError(error, toast);
    },
  });

  return {
    createSubscription: createSubscriptionMutation,
    updateSubscription: updateSubscriptionMutation,
    cancelSubscription: cancelSubscriptionMutation,
  };
}

// Hook for payment method actions
export function usePaymentMethodActions(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (data: Partial<PaymentMethod>) => {
      return await RetryHandler.withRetry(async () => {
        const validatedData = SubscriptionValidator.validatePaymentMethod(data);
        return await PaymentMethodsAPI.create({ ...validatedData, user_id: userId });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', userId] });
      toast({
        title: "Payment Method Added",
        description: "Your payment method has been added successfully.",
      });
    },
    onError: (error: any) => {
      handlePaymentError(error, toast);
    },
  });

  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return await RetryHandler.withRetry(async () => {
        return await PaymentMethodsAPI.setDefault(paymentMethodId, userId);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', userId] });
      toast({
        title: "Default Payment Method Updated",
        description: "Your default payment method has been updated.",
      });
    },
    onError: (error: any) => {
      handlePaymentError(error, toast);
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return await RetryHandler.withRetry(async () => {
        return await PaymentMethodsAPI.delete(paymentMethodId);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', userId] });
      toast({
        title: "Payment Method Removed",
        description: "Your payment method has been removed successfully.",
      });
    },
    onError: (error: any) => {
      handlePaymentError(error, toast);
    },
  });

  return {
    addPaymentMethod: addPaymentMethodMutation,
    setDefaultPaymentMethod: setDefaultPaymentMethodMutation,
    deletePaymentMethod: deletePaymentMethodMutation,
  };
}

// Hook for usage limit checking
export function useUsageLimits(userId: string) {
  const [limits, setLimits] = useState<{
    withinLimits: boolean;
    warnings: string[];
    exceeded: string[];
  }>({ withinLimits: true, warnings: [], exceeded: [] });

  const [isChecking, setIsChecking] = useState(false);

  const checkLimits = useCallback(async () => {
    if (!userId) return;
    
    setIsChecking(true);
    try {
      const result = await SubscriptionService.checkUsageLimits(userId);
      setLimits(result);
    } catch (error) {
      console.error('Error checking usage limits:', error);
    } finally {
      setIsChecking(false);
    }
  }, [userId]);

  useEffect(() => {
    checkLimits();
    // Check limits every 5 minutes
    const interval = setInterval(checkLimits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkLimits]);

  return {
    limits,
    isChecking,
    recheckLimits: checkLimits,
  };
}

// Hook for invoice actions
export function useInvoiceActions() {
  const { toast } = useToast();

  const downloadInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return await RetryHandler.withRetry(async () => {
        const downloadUrl = await InvoicesAPI.generateDownloadUrl(invoiceId);
        // In a real implementation, this would trigger the download
        window.open(downloadUrl, '_blank');
        return downloadUrl;
      });
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your invoice download has started.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: "Could not download the invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const payInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return await RetryHandler.withRetry(async () => {
        // In a real implementation, this would integrate with payment processing
        return await InvoicesAPI.markAsPaid(invoiceId);
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Your invoice has been paid successfully.",
      });
    },
    onError: (error: any) => {
      handlePaymentError(error, toast);
    },
  });

  return {
    downloadInvoice: downloadInvoiceMutation,
    payInvoice: payInvoiceMutation,
  };
}

// Hook for subscription analytics
export function useSubscriptionAnalytics(userId: string) {
  const usageMetrics = useUsageMetrics(userId);
  const subscription = useCurrentSubscription(userId);

  const analytics = useMemo(() => {
    if (!usageMetrics.current.data || !subscription.data) {
      return null;
    }

    const usage = usageMetrics.current.data;
    const sub = subscription.data;
    
    // Calculate usage percentages and trends
    return {
      usage: {
        users: usage.users_count,
        apiCalls: usage.api_calls_count,
        storageGB: usage.storage_bytes / (1024 * 1024 * 1024),
        bandwidthGB: usage.bandwidth_bytes / (1024 * 1024 * 1024),
      },
      trends: {
        // This would be calculated from historical data
        usersGrowth: 0,
        apiCallsGrowth: 0,
        storageGrowth: 0,
      },
      subscription: {
        plan: sub.plan_id,
        status: sub.status,
        billingCycle: sub.billing_cycle,
        nextBilling: sub.current_period_end,
      },
    };
  }, [usageMetrics.current.data, subscription.data]);

  return {
    analytics,
    isLoading: usageMetrics.current.isLoading || subscription.isLoading,
    error: usageMetrics.current.error || subscription.error,
  };
}

// Comprehensive subscription status hook
export function useSubscriptionStatus(userId: string) {
  const subscription = useCurrentSubscription(userId);
  const usageLimits = useUsageLimits(userId);
  const paymentMethods = usePaymentMethods(userId);

  const status = useMemo(() => {
    if (!subscription.data) {
      return {
        hasActiveSubscription: false,
        subscriptionStatus: 'none' as const,
        needsAttention: false,
        issues: [],
      };
    }

    const issues: string[] = [];
    let needsAttention = false;

    // Check subscription status
    if (subscription.data.status === 'past_due') {
      issues.push('Your subscription payment is past due');
      needsAttention = true;
    } else if (subscription.data.status === 'canceled') {
      issues.push('Your subscription has been canceled');
      needsAttention = true;
    } else if (subscription.data.cancel_at_period_end) {
      issues.push('Your subscription will be canceled at the end of the current period');
      needsAttention = true;
    }

    // Check payment methods
    const hasDefaultPaymentMethod = paymentMethods.data?.some(pm => pm.is_default);
    if (!hasDefaultPaymentMethod) {
      issues.push('No default payment method set');
      needsAttention = true;
    }

    // Check usage limits
    if (!usageLimits.limits.withinLimits) {
      issues.push(...usageLimits.limits.exceeded);
      needsAttention = true;
    } else if (usageLimits.limits.warnings.length > 0) {
      issues.push(...usageLimits.limits.warnings);
    }

    return {
      hasActiveSubscription: subscription.data.status === 'active',
      subscriptionStatus: subscription.data.status,
      needsAttention,
      issues,
      cancelAtPeriodEnd: subscription.data.cancel_at_period_end,
      nextBillingDate: subscription.data.current_period_end,
    };
  }, [subscription.data, usageLimits.limits, paymentMethods.data]);

  return {
    status,
    isLoading: subscription.isLoading || usageLimits.isChecking || paymentMethods.isLoading,
    refetch: () => {
      subscription.refetch();
      usageLimits.recheckLimits();
      paymentMethods.refetch();
    },
  };
}

// Error handling utilities
function handleSubscriptionError(error: any, toast: any) {
  if (error instanceof ValidationError) {
    toast({
      title: "Validation Error",
      description: error.message,
      variant: "destructive",
    });
  } else if (error instanceof SubscriptionError) {
    toast({
      title: "Subscription Error",
      description: error.message,
      variant: "destructive",
    });
  } else if (error instanceof UsageLimitError) {
    toast({
      title: "Usage Limit Exceeded",
      description: error.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  }
}

function handlePaymentError(error: any, toast: any) {
  if (error instanceof PaymentError) {
    toast({
      title: "Payment Error",
      description: error.message,
      variant: "destructive",
    });
  } else if (error instanceof ValidationError) {
    toast({
      title: "Validation Error",
      description: error.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Payment Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  }
}