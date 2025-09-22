/**
 * Audit Logger for Security Events
 * 
 * Provides comprehensive audit logging functionality with security event tracking,
 * anomaly detection, and risk scoring for all authentication and user activities.
 */

import { createSupabaseClient } from './supabase-client';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogEntry {
  event_type: string;
  user_id?: string | null;
  session_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  action: string;
  status?: 'success' | 'failure' | 'error';
  risk_score?: number | null;
  anomaly_flags?: string[] | null;
  event_data?: Record<string, any>;
  error_details?: Record<string, any> | null;
}

export interface SecurityEvent {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string | null;
  ip_address?: string | null;
  description: string;
  event_data?: Record<string, any>;
}

export interface RiskFactors {
  newIpAddress: boolean;
  suspiciousUserAgent: boolean;
  rapidRequests: boolean;
  failedAttempts: number;
  geolocationAnomaly: boolean;
  timeAnomaly: boolean;
}

export class AuditLogger {
  private client: SupabaseClient<Database>;
  private ip_address: string;
  private user_agent: string | null;
  private request_id: string;

  constructor(ip_address: string = '127.0.0.1', user_agent: string | null = null) {
    this.client = createSupabaseClient();
    this.ip_address = ip_address;
    this.user_agent = user_agent;
    this.request_id = this.generateRequestId();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Calculate risk score based on various factors
   */
  private calculateRiskScore(
    event_type: string,
    factors: Partial<RiskFactors>,
    event_data: Record<string, any> = {}
  ): number {
    let score = 0;
    const anomalyFlags: string[] = [];

    // Base scores by event type
    const baseScores: Record<string, number> = {
      'auth.signin': 10,
      'auth.signup': 15,
      'auth.password_change': 20,
      'auth.password_reset': 15,
      'auth.mfa_disable': 50,
      'auth.role_change': 40,
      'auth.privilege_escalation': 60,
      'data.bulk_access': 30,
      'data.export': 25,
      'session.anomaly': 35
    };

    score += baseScores[event_type] || 5;

    // Risk factor adjustments
    if (factors.newIpAddress) {
      score += 15;
      anomalyFlags.push('new_ip_address');
    }

    if (factors.suspiciousUserAgent) {
      score += 20;
      anomalyFlags.push('suspicious_user_agent');
    }

    if (factors.rapidRequests) {
      score += 25;
      anomalyFlags.push('rapid_requests');
    }

    if (factors.failedAttempts && factors.failedAttempts > 0) {
      score += Math.min(factors.failedAttempts * 10, 40);
      anomalyFlags.push('multiple_failed_attempts');
    }

    if (factors.geolocationAnomaly) {
      score += 30;
      anomalyFlags.push('geolocation_anomaly');
    }

    if (factors.timeAnomaly) {
      score += 15;
      anomalyFlags.push('time_anomaly');
    }

    // Event-specific adjustments
    if (event_type.includes('failure') || event_type.includes('error')) {
      score += 10;
    }

    // Administrative actions
    if (event_type.includes('admin') || event_type.includes('role')) {
      score += 20;
    }

    // Cap at 100
    score = Math.min(score, 100);

    // Store anomaly flags in event data for logging
    if (anomalyFlags.length > 0) {
      event_data.anomaly_flags = anomalyFlags;
    }

    return score;
  }

  /**
   * Analyze recent activity for anomaly detection
   */
  private async analyzeRecentActivity(
    user_id?: string,
    event_type?: string
  ): Promise<Partial<RiskFactors>> {
    const factors: Partial<RiskFactors> = {};
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Check for rapid requests (same IP, last 5 minutes)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const { data: recentRequests, error: recentError } = await this.client
        .from('audit_logs')
        .select('log_id')
        .eq('ip_address', this.ip_address)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .limit(10);

      if (!recentError && recentRequests && recentRequests.length > 5) {
        factors.rapidRequests = true;
      }

      if (user_id) {
        // Check for new IP address
        const { data: ipHistory, error: ipError } = await this.client
          .from('audit_logs')
          .select('ip_address')
          .eq('user_id', user_id)
          .neq('ip_address', this.ip_address)
          .gte('created_at', oneDayAgo.toISOString())
          .limit(1);

        if (!ipError && ipHistory && ipHistory.length === 0) {
          factors.newIpAddress = true;
        }

        // Check for failed attempts
        if (event_type && event_type.includes('signin')) {
          const { data: failedAttempts, error: failedError } = await this.client
            .from('audit_logs')
            .select('log_id')
            .eq('user_id', user_id)
            .eq('event_type', 'auth.signin')
            .eq('status', 'failure')
            .gte('created_at', oneHourAgo.toISOString());

          if (!failedError && failedAttempts) {
            factors.failedAttempts = failedAttempts.length;
          }
        }

        // Check for time anomaly (activity outside normal hours)
        const hour = now.getHours();
        if (hour < 6 || hour > 22) {
          factors.timeAnomaly = true;
        }
      }

      // Check for suspicious user agent patterns
      if (this.user_agent) {
        const suspiciousPatterns = [
          /bot|crawler|spider/i,
          /curl|wget|python|java/i,
          /automated|script|tool/i
        ];

        if (suspiciousPatterns.some(pattern => pattern.test(this.user_agent!))) {
          factors.suspiciousUserAgent = true;
        }
      }

    } catch (error) {
      console.error('Error analyzing recent activity:', error);
    }

    return factors;
  }

  /**
   * Log an audit event with risk assessment
   */
  async logEvent(
    event_type: string,
    status: 'success' | 'failure' | 'error',
    event_data: Record<string, any> = {},
    options: {
      user_id?: string;
      session_id?: string;
      resource_type?: string;
      resource_id?: string;
      action?: string;
      error_details?: Record<string, any>;
    } = {}
  ): Promise<string | null> {
    try {
      // Analyze recent activity for risk assessment
      const riskFactors = await this.analyzeRecentActivity(
        options.user_id,
        event_type
      );

      // Calculate risk score
      const risk_score = this.calculateRiskScore(
        event_type,
        riskFactors,
        event_data
      );

      // Extract anomaly flags from event data
      const anomaly_flags = event_data.anomaly_flags || null;
      delete event_data.anomaly_flags; // Remove from event data to avoid duplication

      const auditEntry: AuditLogEntry = {
        event_type,
        user_id: options.user_id || null,
        session_id: options.session_id || null,
        ip_address: this.ip_address,
        user_agent: this.user_agent,
        request_id: this.request_id,
        resource_type: options.resource_type || null,
        resource_id: options.resource_id || null,
        action: options.action || this.extractActionFromEventType(event_type),
        status,
        risk_score,
        anomaly_flags,
        event_data,
        error_details: options.error_details || null
      };

      const { data, error } = await this.client
        .from('audit_logs')
        .insert(auditEntry)
        .select('log_id')
        .single();

      if (error) {
        console.error('Failed to log audit event:', error);
        return null;
      }

      // Create security event for high-risk activities
      if (risk_score >= 60) {
        await this.createSecurityEvent({
          event_type: `high_risk_${event_type}`,
          severity: risk_score >= 80 ? 'critical' : 'high',
          user_id: options.user_id || null,
          ip_address: this.ip_address,
          description: `High-risk activity detected: ${event_type} with risk score ${risk_score}`,
          event_data: {
            audit_log_id: data.log_id,
            risk_score,
            anomaly_flags,
            original_event: event_data
          }
        });
      }

      return data.log_id;

    } catch (error) {
      console.error('Error logging audit event:', error);
      return null;
    }
  }

  /**
   * Create a security event
   */
  async createSecurityEvent(event: SecurityEvent): Promise<string | null> {
    try {
      const { data, error } = await this.client
        .from('security_events')
        .insert({
          event_type: event.event_type,
          severity: event.severity,
          user_id: event.user_id || null,
          ip_address: event.ip_address || this.ip_address,
          description: event.description,
          event_data: event.event_data || {}
        })
        .select('event_id')
        .single();

      if (error) {
        console.error('Failed to create security event:', error);
        return null;
      }

      return data.event_id;

    } catch (error) {
      console.error('Error creating security event:', error);
      return null;
    }
  }

  /**
   * Log authentication event (convenience method)
   */
  async logAuthEvent(
    action: 'signin' | 'signout' | 'signup' | 'password_reset' | 'password_change' | 'mfa_verify',
    status: 'success' | 'failure' | 'error',
    event_data: Record<string, any> = {}
  ): Promise<string | null> {
    const event_type = `auth.${action}`;
    return this.logEvent(event_type, status, event_data, {
      action,
      user_id: event_data.user_id
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    resource_type: string,
    resource_id: string,
    action: 'read' | 'create' | 'update' | 'delete',
    status: 'success' | 'failure' | 'error',
    event_data: Record<string, any> = {},
    user_id?: string
  ): Promise<string | null> {
    const event_type = `data.${action}`;
    return this.logEvent(event_type, status, event_data, {
      resource_type,
      resource_id,
      action,
      user_id
    });
  }

  /**
   * Log administrative event
   */
  async logAdminEvent(
    action: string,
    status: 'success' | 'failure' | 'error',
    event_data: Record<string, any> = {}
  ): Promise<string | null> {
    const event_type = `admin.${action}`;
    return this.logEvent(event_type, status, event_data, {
      action,
      user_id: event_data.user_id
    });
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    action: string,
    status: 'success' | 'failure' | 'error',
    event_data: Record<string, any> = {}
  ): Promise<string | null> {
    const event_type = `system.${action}`;
    return this.logEvent(event_type, status, event_data, {
      action
    });
  }

  /**
   * Extract action from event type
   */
  private extractActionFromEventType(event_type: string): string {
    const parts = event_type.split('.');
    return parts[parts.length - 1] || 'unknown';
  }
}

/**
 * Create an audit logger instance
 */
export function createAuditLogger(
  ip_address?: string,
  user_agent?: string | null
): AuditLogger {
  return new AuditLogger(ip_address, user_agent);
}

/**
 * Global audit logger for server-side use
 */
export const globalAuditLogger = new AuditLogger();

// Legacy functions for backward compatibility
export const logAuthEvent = async (
  action: 'login' | 'logout' | 'password_reset' | 'registration' | 'invite_accepted',
  userId?: string,
  details?: any
) => {
  const logger = createAuditLogger();
  return logger.logAuthEvent(
    action as any,
    'success',
    {
      user_id: userId,
      ...details
    }
  );
};

export const logLogin = async (userId: string, email: string) => {
  const logger = createAuditLogger();
  return logger.logAuthEvent('signin', 'success', {
    user_id: userId,
    email,
    timestamp: new Date().toISOString()
  });
};

export const logLogout = async (userId: string) => {
  const logger = createAuditLogger();
  return logger.logAuthEvent('signout', 'success', {
    user_id: userId,
    timestamp: new Date().toISOString()
  });
};

export const logRegistration = async (userId: string, email: string, role: string, inviteUsed?: boolean) => {
  const logger = createAuditLogger();
  return logger.logAuthEvent('signup', 'success', {
    user_id: userId,
    email,
    role,
    invite_used: inviteUsed,
    timestamp: new Date().toISOString()
  });
};

export const logPasswordReset = async (email: string) => {
  const logger = createAuditLogger();
  return logger.logEvent('auth.password_reset', 'success', {
    email,
    timestamp: new Date().toISOString()
  });
};

export const queueWelcomeEmail = async (userId: string, email: string, name: string) => {
  const logger = createAuditLogger();
  return logger.logEvent('user.welcome_email_queued', 'success', {
    user_id: userId,
    email,
    name,
    timestamp: new Date().toISOString()
  });
};

// Additional functions required by useAuditLogger hook
export const createAuditLog = async (data: any) => {
  return await globalAuditLogger.logEvent(data.event_type || 'generic', data.outcome || 'success', data);
};

export const logEntityAction = async (entityType: string, entityId: string, action: string, data?: any) => {
  return await globalAuditLogger.logEvent(`${entityType}.${action}`, 'success', {
    entity_type: entityType,
    entity_id: entityId,
    ...data
  });
};

export const getAuditLogs = async (filters?: any) => {
  // For now, return empty array as this would typically require server-side implementation
  return [];
};