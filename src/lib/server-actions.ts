/**
 * Secure Server API Endpoints
 * 
 * Production-ready server-side API endpoints for authentication flows,
 * user management, and secure data operations with comprehensive
 * validation, rate limiting, and audit logging.
 */

import { createSupabaseServerClient } from './supabase-client';
import { createAuditLogger } from './audit-logger';
import { createSessionManager } from './session-manager';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Request/Response Types
export interface ApiRequest {
  headers: Headers;
  body?: any;
  method: string;
  url: string;
  ip?: string;
  userAgent?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    request_id: string;
    timestamp: string;
    processing_time_ms: number;
  };
}

export interface AuthenticatedRequest extends ApiRequest {
  user: {
    id: string;
    email: string;
    role: 'owner' | 'backoffice' | 'retailer' | 'location_user';
    retailer_id: string | null;
    location_id: string | null;
    status: 'active' | 'suspended' | 'inactive';
  };
  session: {
    session_id: string;
    expires_at: string;
    is_mfa_verified: boolean;
  };
}

// Validation Schemas
const signUpRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  inviteToken: z.string().uuid('Invalid invite token format'),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format').optional(),
  profile_metadata: z.record(z.any()).optional(),
  device_id: z.string().optional(),
  device_fingerprint: z.record(z.any()).optional()
});

const signInRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  device_id: z.string().optional(),
  device_fingerprint: z.record(z.any()).optional(),
  remember_me: z.boolean().optional()
});

const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format')
});

const changePasswordRequestSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character')
});

const createInviteRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['owner', 'backoffice', 'retailer', 'location_user']),
  retailer_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  expires_in_hours: z.number().min(1).max(168).default(168), // 1 week default
  permissions: z.record(z.any()).optional()
});

// Server Action Class
export class ServerActions {
  private client: SupabaseClient<Database>;
  private auditLogger: ReturnType<typeof createAuditLogger>;
  private sessionManager: ReturnType<typeof createSessionManager>;
  private request_id: string;
  private start_time: number;

  constructor(request: ApiRequest) {
    this.client = createSupabaseServerClient();
    this.auditLogger = createAuditLogger(
      this.extractIpAddress(request),
      request.headers.get('user-agent')
    );
    this.sessionManager = createSessionManager(
      this.extractIpAddress(request),
      request.headers.get('user-agent')
    );
    this.request_id = this.generateRequestId();
    this.start_time = Date.now();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private extractIpAddress(request: ApiRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           request.ip ||
           '127.0.0.1';
  }

  private createResponse<T>(
    success: boolean,
    data?: T,
    error?: { code: string; message: string; details?: any }
  ): ApiResponse<T> {
    const processing_time_ms = Date.now() - this.start_time;
    
    return {
      success,
      data,
      error,
      metadata: {
        request_id: this.request_id,
        timestamp: new Date().toISOString(),
        processing_time_ms
      }
    };
  }

  /**
   * Authenticate request and extract user context
   */
  async authenticateRequest(request: ApiRequest): Promise<AuthenticatedRequest | null> {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const accessToken = authHeader.substring(7);
      const validationResult = await this.sessionManager.validateSession(accessToken, {
        ip_address: this.extractIpAddress(request),
        user_agent: request.headers.get('user-agent'),
        check_activity: true
      });

      if (!validationResult.valid || !validationResult.session) {
        return null;
      }

      // Get user data
      const { data: userData, error: userError } = await this.client
        .from('app_users')
        .select('*')
        .eq('user_id', validationResult.session.user_id)
        .single();

      if (userError || !userData) {
        return null;
      }

      return {
        ...request,
        user: {
          id: userData.user_id,
          email: userData.email,
          role: userData.role,
          retailer_id: userData.retailer_id,
          location_id: userData.location_id,
          status: userData.status
        },
        session: {
          session_id: validationResult.session.session_id,
          expires_at: validationResult.session.expires_at.toISOString(),
          is_mfa_verified: validationResult.session.is_mfa_verified
        }
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Check user permissions for resource and action
   */
  async checkPermissions(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const { data: hasPermission, error } = await this.client.rpc('user_has_permission', {
        target_user_id: userId,
        resource,
        action
      });

      if (error) {
        console.error('Permission check failed:', error);
        return false;
      }

      return hasPermission || false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // =============================================
  // AUTHENTICATION ENDPOINTS
  // =============================================

  /**
   * POST /api/auth/signup
   * Register new user with invite token
   */
  async signUp(request: ApiRequest): Promise<ApiResponse> {
    try {
      const body = signUpRequestSchema.parse(request.body);
      
      // Import auth functions
      const { signUp } = await import('./supabase-auth');
      
      const result = await signUp({
        email: body.email,
        password: body.password,
        inviteToken: body.inviteToken,
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        profile_metadata: body.profile_metadata
      }, request as any);

      if (result.error) {
        return this.createResponse(false, null, {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        });
      }

      return this.createResponse(true, {
        user: result.user,
        session: result.session
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createResponse(false, null, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      await this.auditLogger.logAuthEvent('signup', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createResponse(false, null, {
        code: 'SIGNUP_FAILED',
        message: 'Registration failed'
      });
    }
  }

  /**
   * POST /api/auth/signin
   * Authenticate user credentials
   */
  async signIn(request: ApiRequest): Promise<ApiResponse> {
    try {
      const body = signInRequestSchema.parse(request.body);
      
      const { signIn } = await import('./supabase-auth');
      
      const result = await signIn({
        email: body.email,
        password: body.password,
        device_id: body.device_id,
        device_fingerprint: body.device_fingerprint
      }, request as any);

      if (result.error) {
        return this.createResponse(false, null, {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details
        });
      }

      return this.createResponse(true, {
        user: result.user,
        session: result.session,
        requires_mfa: result.user?.mfa_enabled && !result.session
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createResponse(false, null, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      await this.auditLogger.logAuthEvent('signin', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createResponse(false, null, {
        code: 'SIGNIN_FAILED',
        message: 'Authentication failed'
      });
    }
  }

  /**
   * POST /api/auth/signout
   * Sign out current user
   */
  async signOut(request: ApiRequest): Promise<ApiResponse> {
    try {
      const { signOut } = await import('./supabase-auth');
      
      const result = await signOut(request as any);
      
      if (result.error) {
        return this.createResponse(false, null, {
          code: 'SIGNOUT_FAILED',
          message: result.error.message
        });
      }

      return this.createResponse(true, {
        message: 'Successfully signed out'
      });

    } catch (error) {
      await this.auditLogger.logAuthEvent('signout', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createResponse(false, null, {
        code: 'SIGNOUT_FAILED',
        message: 'Sign out failed'
      });
    }
  }

  /**
   * POST /api/auth/password-reset
   * Send password reset email
   */
  async passwordReset(request: ApiRequest): Promise<ApiResponse> {
    try {
      const body = passwordResetRequestSchema.parse(request.body);
      
      const { passwordReset } = await import('./supabase-auth');
      
      const result = await passwordReset(body.email, request as any);
      
      if (result.error) {
        return this.createResponse(false, null, {
          code: 'PASSWORD_RESET_FAILED',
          message: result.error.message
        });
      }

      return this.createResponse(true, {
        message: 'Password reset email sent'
      });

    } catch (error) {
      return this.createResponse(false, null, {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Password reset failed'
      });
    }
  }

  /**
   * POST /api/admin/invites
   * Create user invite token
   */
  async createInvite(request: ApiRequest): Promise<ApiResponse> {
    try {
      const authRequest = await this.authenticateRequest(request);
      if (!authRequest) {
        return this.createResponse(false, null, {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      // Check admin permissions
      const hasPermission = await this.checkPermissions(
        authRequest.user.id,
        'users',
        'create'
      );

      if (!hasPermission) {
        return this.createResponse(false, null, {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        });
      }

      const body = createInviteRequestSchema.parse(request.body);
      
      // Generate secure invite token
      const inviteToken = crypto.randomUUID();
      const tokenHash = await this.hashToken(inviteToken);
      const expiresAt = new Date(Date.now() + body.expires_in_hours * 60 * 60 * 1000);

      const { data: inviteRecord, error: createError } = await this.client
        .from('invite_tokens')
        .insert({
          token_hash: tokenHash,
          email: body.email,
          invited_by: authRequest.user.id,
          role: body.role,
          retailer_id: body.retailer_id || null,
          location_id: body.location_id || null,
          permissions: body.permissions || null,
          expires_at: expiresAt.toISOString()
        })
        .select('token_id')
        .single();

      if (createError || !inviteRecord) {
        throw new Error('Failed to create invite');
      }

      await this.auditLogger.logAdminEvent('user_create', 'success', {
        user_id: authRequest.user.id,
        session_id: authRequest.session.session_id,
        target_email: body.email,
        invite_role: body.role,
        invite_token_id: inviteRecord.token_id
      });

      return this.createResponse(true, {
        invite_token: inviteToken,
        expires_at: expiresAt.toISOString(),
        invite_url: `${process.env.APP_URL || 'http://localhost:3000'}/register?token=${inviteToken}&email=${encodeURIComponent(body.email)}`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.createResponse(false, null, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }

      return this.createResponse(false, null, {
        code: 'INVITE_CREATION_FAILED',
        message: 'Failed to create invite'
      });
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Hash token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Create server actions instance
 */
export function createServerActions(request: ApiRequest): ServerActions {
  return new ServerActions(request);
}

/**
 * Get role-based redirect URL
 */
export function getRoleBasedRedirect(role: string): string {
  // All roles redirect to the unified dashboard
  return '/dashboard';
}

// Legacy wrapper functions for backward compatibility
export const loginAction = async (credentials: { email: string; password: string }) => {
  const mockRequest: ApiRequest = {
    headers: new Headers(),
    body: credentials,
    method: 'POST',
    url: '/api/auth/signin'
  };
  
  const actions = createServerActions(mockRequest);
  const result = await actions.signIn(mockRequest);
  
  if (result.success && result.data) {
    return {
      success: true,
      user: result.data.user,
      session: result.data.session,
      redirectTo: getRoleBasedRedirect(result.data.user?.role || 'owner')
    };
  }
  
  return {
    success: false,
    error: result.error?.message || 'Login failed'
  };
};

export const logoutAction = async (userId?: string) => {
  const { signOut } = await import('./supabase-auth');
  const result = await signOut();
  
  if (result.error) {
    return { success: false, error: result.error.message };
  }
  
  return { success: true, redirectTo: '/auth/login' };
};

export const validateInviteAction = async (token: string, email: string) => {
  try {
    const { validateInviteToken } = await import('./supabase-auth');
    const result = await validateInviteToken(token, email);
    
    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'Invalid invite token'
      };
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to validate invite token'
    };
  }
};

// Export types for use in API routes
export type {
  ApiRequest,
  ApiResponse,
  AuthenticatedRequest
};