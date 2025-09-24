import { z } from 'zod';

// Validation schemas for subscription management
export const PaymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'bank_account', 'paypal']),
  brand: z.string().min(1, 'Brand is required'),
  last4: z.string().length(4, 'Last 4 digits must be exactly 4 characters'),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(new Date().getFullYear()).optional(),
  holderName: z.string().min(1, 'Cardholder name is required'),
  billingAddress: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().length(2, 'Country must be 2-letter code')
  })
});

export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid('Invalid plan ID'),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Plan description is required'),
  priceMonthly: z.number().min(0, 'Monthly price must be positive'),
  priceYearly: z.number().min(0, 'Yearly price must be positive'),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  limits: z.object({
    users: z.union([z.number().min(1), z.literal('unlimited')]),
    storageGb: z.union([z.number().min(1), z.literal('unlimited')]),
    apiCallsMonthly: z.union([z.number().min(1), z.literal('unlimited')]),
    supportLevel: z.string().min(1, 'Support level is required')
  })
});

export const InvoiceSchema = z.object({
  id: z.string().uuid('Invalid invoice ID'),
  number: z.string().min(1, 'Invoice number is required'),
  amountSubtotal: z.number().min(0, 'Subtotal must be positive'),
  amountTax: z.number().min(0, 'Tax amount must be positive'),
  amountTotal: z.number().min(0, 'Total amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3-letter code'),
  status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']),
  invoiceDate: z.string().datetime('Invalid invoice date'),
  dueDate: z.string().datetime('Invalid due date')
});

export const UsageMetricsSchema = z.object({
  usersCount: z.number().min(0, 'Users count must be positive'),
  apiCallsCount: z.number().min(0, 'API calls count must be positive'),
  storageBytes: z.number().min(0, 'Storage bytes must be positive'),
  bandwidthBytes: z.number().min(0, 'Bandwidth bytes must be positive'),
  periodStart: z.string().datetime('Invalid period start date'),
  periodEnd: z.string().datetime('Invalid period end date')
});

// Custom error classes
export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public metadata?: any
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 402,
    public metadata?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 422,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public code: string,
    public limitType: string,
    public currentUsage: number,
    public limit: number,
    public statusCode: number = 429
  ) {
    super(message);
    this.name = 'UsageLimitError';
  }
}

// Error code constants
export const ERROR_CODES = {
  // Subscription errors
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_ALREADY_EXISTS: 'SUBSCRIPTION_ALREADY_EXISTS',
  SUBSCRIPTION_CANCELED: 'SUBSCRIPTION_CANCELED',
  SUBSCRIPTION_PAST_DUE: 'SUBSCRIPTION_PAST_DUE',
  INVALID_PLAN: 'INVALID_PLAN',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  
  // Payment errors
  PAYMENT_METHOD_NOT_FOUND: 'PAYMENT_METHOD_NOT_FOUND',
  PAYMENT_METHOD_EXPIRED: 'PAYMENT_METHOD_EXPIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CARD_DECLINED: 'CARD_DECLINED',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  
  // Usage limit errors
  USER_LIMIT_EXCEEDED: 'USER_LIMIT_EXCEEDED',
  API_LIMIT_EXCEEDED: 'API_LIMIT_EXCEEDED',
  STORAGE_LIMIT_EXCEEDED: 'STORAGE_LIMIT_EXCEEDED',
  BANDWIDTH_LIMIT_EXCEEDED: 'BANDWIDTH_LIMIT_EXCEEDED',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // General errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

// Validation utilities
export class SubscriptionValidator {
  static validatePaymentMethod(data: any): z.infer<typeof PaymentMethodSchema> {
    try {
      return PaymentMethodSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });
        
        throw new ValidationError(
          'Invalid payment method data',
          ERROR_CODES.INVALID_INPUT,
          422,
          fieldErrors
        );
      }
      throw error;
    }
  }

  static validateSubscriptionPlan(data: any): z.infer<typeof SubscriptionPlanSchema> {
    try {
      return SubscriptionPlanSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });
        
        throw new ValidationError(
          'Invalid subscription plan data',
          ERROR_CODES.INVALID_INPUT,
          422,
          fieldErrors
        );
      }
      throw error;
    }
  }

  static validateInvoice(data: any): z.infer<typeof InvoiceSchema> {
    try {
      return InvoiceSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });
        
        throw new ValidationError(
          'Invalid invoice data',
          ERROR_CODES.INVALID_INPUT,
          422,
          fieldErrors
        );
      }
      throw error;
    }
  }

  static validateUsageMetrics(data: any): z.infer<typeof UsageMetricsSchema> {
    try {
      return UsageMetricsSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });
        
        throw new ValidationError(
          'Invalid usage metrics data',
          ERROR_CODES.INVALID_INPUT,
          422,
          fieldErrors
        );
      }
      throw error;
    }
  }

  static validateCreditCard(cardNumber: string, expiryMonth: number, expiryYear: number, cvv: string): void {
    // Credit card number validation (Luhn algorithm)
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      throw new ValidationError(
        'Invalid credit card number length',
        ERROR_CODES.INVALID_FORMAT
      );
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 !== 0) {
      throw new ValidationError(
        'Invalid credit card number',
        ERROR_CODES.INVALID_FORMAT
      );
    }

    // Expiry date validation
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      throw new ValidationError(
        'Credit card has expired',
        ERROR_CODES.PAYMENT_METHOD_EXPIRED
      );
    }

    // CVV validation
    const cleanCvv = cvv.replace(/\D/g, '');
    if (cleanCvv.length < 3 || cleanCvv.length > 4) {
      throw new ValidationError(
        'Invalid CVV',
        ERROR_CODES.INVALID_FORMAT
      );
    }
  }
}

// Usage limit checker
export class UsageLimitChecker {
  static checkUserLimit(currentUsers: number, limit: number | 'unlimited'): void {
    if (limit === 'unlimited') return;
    
    if (currentUsers >= limit) {
      throw new UsageLimitError(
        `User limit exceeded. Current: ${currentUsers}, Limit: ${limit}`,
        ERROR_CODES.USER_LIMIT_EXCEEDED,
        'users',
        currentUsers,
        limit
      );
    }
  }

  static checkApiLimit(currentCalls: number, limit: number | 'unlimited'): void {
    if (limit === 'unlimited') return;
    
    if (currentCalls >= limit) {
      throw new UsageLimitError(
        `API call limit exceeded. Current: ${currentCalls}, Limit: ${limit}`,
        ERROR_CODES.API_LIMIT_EXCEEDED,
        'api_calls',
        currentCalls,
        limit
      );
    }
  }

  static checkStorageLimit(currentStorageBytes: number, limitGb: number | 'unlimited'): void {
    if (limitGb === 'unlimited') return;
    
    const limitBytes = limitGb * 1024 * 1024 * 1024; // Convert GB to bytes
    
    if (currentStorageBytes >= limitBytes) {
      throw new UsageLimitError(
        `Storage limit exceeded. Current: ${(currentStorageBytes / (1024**3)).toFixed(2)}GB, Limit: ${limitGb}GB`,
        ERROR_CODES.STORAGE_LIMIT_EXCEEDED,
        'storage',
        currentStorageBytes,
        limitBytes
      );
    }
  }

  static checkBandwidthLimit(currentBandwidthBytes: number, limitBytes: number | 'unlimited'): void {
    if (limitBytes === 'unlimited') return;
    
    if (currentBandwidthBytes >= limitBytes) {
      throw new UsageLimitError(
        `Bandwidth limit exceeded. Current: ${(currentBandwidthBytes / (1024**3)).toFixed(2)}GB, Limit: ${(limitBytes / (1024**3)).toFixed(2)}GB`,
        ERROR_CODES.BANDWIDTH_LIMIT_EXCEEDED,
        'bandwidth',
        currentBandwidthBytes,
        limitBytes
      );
    }
  }
}

// Error formatter for API responses
export class ErrorFormatter {
  static formatError(error: any): {
    error: {
      code: string;
      message: string;
      statusCode: number;
      metadata?: any;
      fieldErrors?: Record<string, string[]>;
    };
  } {
    if (error instanceof ValidationError) {
      return {
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          fieldErrors: error.fieldErrors
        }
      };
    }

    if (error instanceof SubscriptionError || error instanceof PaymentError) {
      return {
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          metadata: error.metadata
        }
      };
    }

    if (error instanceof UsageLimitError) {
      return {
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          metadata: {
            limitType: error.limitType,
            currentUsage: error.currentUsage,
            limit: error.limit
          }
        }
      };
    }

    // Generic error
    return {
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        statusCode: 500,
        metadata: process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined
      }
    };
  }

  static formatValidationErrors(zodError: z.ZodError): {
    error: {
      code: string;
      message: string;
      statusCode: number;
      fieldErrors: Record<string, string[]>;
    };
  } {
    const fieldErrors: Record<string, string[]> = {};
    
    zodError.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(err.message);
    });

    return {
      error: {
        code: ERROR_CODES.INVALID_INPUT,
        message: 'Validation failed',
        statusCode: 422,
        fieldErrors
      }
    };
  }
}

// Retry mechanism for failed operations
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Don't retry validation errors or user errors
        if (error instanceof ValidationError || 
            error instanceof SubscriptionError || 
            error instanceof PaymentError) {
          throw error;
        }
        
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static async checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<void> {
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (limit.count >= maxRequests) {
      throw new SubscriptionError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMITED,
        429,
        {
          resetTime: limit.resetTime,
          maxRequests,
          windowMs
        }
      );
    }

    limit.count++;
  }

  static reset(key: string): void {
    this.limits.delete(key);
  }
}