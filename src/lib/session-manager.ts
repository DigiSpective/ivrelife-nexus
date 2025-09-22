/**
 * Production Session Management
 * 
 * Provides secure server-side session management with activity tracking,
 * automatic expiration, security validation, and comprehensive audit logging.
 */

import { createSupabaseClient, createSupabaseServerClient } from './supabase-client';
import { createAuditLogger } from './audit-logger';
import type { Database } from '@/types/database';
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { AuthSession } from '@/types';

// Session storage keys
const SESSION_KEY = 'ivrelife_session';
const USER_KEY = 'ivrelife_user'; 
const LAST_ACTIVITY_KEY = 'ivrelife_last_activity';

// Session timeout configuration
const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Validation flag
let validationDisabled = false;

export interface SessionContext {
  session_id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  last_activity: Date;
  ip_address: string;
  user_agent: string | null;
  device_id: string | null;
  device_fingerprint: Record<string, any> | null;
  is_mfa_verified: boolean;
  created_at: Date;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SessionContext;
  error?: string;
  requiresMfa?: boolean;
  shouldRefresh?: boolean;
}

export interface SessionActivityEvent {
  type: 'page_view' | 'api_call' | 'interaction' | 'heartbeat';
  path?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface SessionWarning {
  type: 'expiring_soon' | 'suspicious_activity' | 'concurrent_sessions' | 'location_change';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  expires_at?: Date;
  recommended_action?: string;
}

export class SessionManager {
  private client: SupabaseClient<Database>;
  private serverClient: SupabaseClient<Database>;
  private auditLogger: ReturnType<typeof createAuditLogger>;
  
  // Session configuration
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour before expiry
  private readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout
  private readonly MAX_CONCURRENT_SESSIONS = 5;
  
  // Activity tracking
  private activityTimer: NodeJS.Timeout | null = null;
  private lastActivity: Date = new Date();
  private warningCallbacks: ((warning: SessionWarning) => void)[] = [];

  constructor(ip_address?: string, user_agent?: string) {
    this.client = createSupabaseClient();
    this.serverClient = createSupabaseServerClient();
    this.auditLogger = createAuditLogger(ip_address, user_agent);
    
    // Start activity monitoring if in browser environment
    if (typeof window !== 'undefined') {
      this.initializeActivityTracking();
    }
  }

  /**
   * Initialize activity tracking for browser sessions
   */
  private initializeActivityTracking(): void {
    // Track user interactions
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      this.updateLastActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Start periodic session validation
    this.startSessionMonitoring();
  }

  /**
   * Start periodic session monitoring
   */
  private startSessionMonitoring(): void {
    // Clear existing timer
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }

    // Check session every minute
    this.activityTimer = setInterval(async () => {
      await this.checkSessionHealth();
    }, 60 * 1000);
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    this.lastActivity = new Date();
  }

  /**
   * Validate session with comprehensive security checks
   */
  async validateSession(
    accessToken: string,
    options: {
      ip_address?: string;
      user_agent?: string;
      check_activity?: boolean;
    } = {}
  ): Promise<SessionValidationResult> {
    try {
      // Set auth token for server client
      this.serverClient.auth.setAuth(accessToken);
      
      const { data: { user }, error } = await this.serverClient.auth.getUser();
      
      if (error || !user) {
        return { valid: false, error: 'Invalid session token' };
      }

      // Get session data from database
      const { data: sessionData, error: sessionError } = await this.serverClient
        .from('auth_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('access_token_hash', await this.hashToken(accessToken))
        .single();

      if (sessionError || !sessionData) {
        return { valid: false, error: 'Session not found in database' };
      }

      // Check if session is expired
      if (new Date(sessionData.expires_at) < new Date()) {
        return { valid: false, error: 'Session expired' };
      }

      // Check IP address if provided
      if (options.ip_address && sessionData.ip_address !== options.ip_address) {
        await this.auditLogger.logEvent('session.ip_mismatch', 'error', {
          user_id: user.id,
          session_id: sessionData.session_id,
          expected_ip: sessionData.ip_address,
          actual_ip: options.ip_address
        });
        return { valid: false, error: 'IP address mismatch' };
      }

      // Update last activity if requested
      if (options.check_activity) {
        await this.serverClient
          .from('auth_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('session_id', sessionData.session_id);
      }

      const sessionContext: SessionContext = {
        session_id: sessionData.session_id,
        user_id: sessionData.user_id,
        access_token: accessToken,
        refresh_token: sessionData.refresh_token,
        expires_at: new Date(sessionData.expires_at),
        last_activity: new Date(sessionData.last_activity),
        ip_address: sessionData.ip_address,
        user_agent: sessionData.user_agent,
        device_id: sessionData.device_id,
        device_fingerprint: sessionData.device_fingerprint,
        is_mfa_verified: sessionData.is_mfa_verified,
        created_at: new Date(sessionData.created_at)
      };

      return { valid: true, session: sessionContext };

    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, error: 'Session validation failed' };
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<{ success: boolean; session?: SessionContext; error?: string }> {
    try {
      const { data, error } = await this.client.auth.refreshSession();
      
      if (error || !data.session) {
        return { success: false, error: error?.message || 'Failed to refresh session' };
      }

      return { success: true };
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: 'Session refresh failed' };
    }
  }

  /**
   * Sign out and clear session
   */
  async signOut(reason: string = 'user_initiated'): Promise<void> {
    try {
      const currentSession = await this.client.auth.getSession();
      
      if (currentSession.data.session?.user) {
        await this.auditLogger.logAuthEvent('signout', 'success', {
          user_id: currentSession.data.session.user.id,
          reason
        });
      }

      await this.client.auth.signOut();
      SessionManager.clearSession();
      
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Hash token for secure storage comparison
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Check session health and trigger warnings
   */
  private async checkSessionHealth(): Promise<void> {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      
      if (error || !session) {
        return;
      }

      const now = new Date();
      const timeSinceActivity = now.getTime() - this.lastActivity.getTime();
      const timeUntilExpiry = (session.expires_at || 0) * 1000 - now.getTime();

      // Check for activity timeout
      if (timeSinceActivity > this.ACTIVITY_TIMEOUT) {
        this.emitWarning({
          type: 'expiring_soon',
          message: 'Session will expire due to inactivity',
          severity: 'medium',
          expires_at: new Date(this.lastActivity.getTime() + this.ACTIVITY_TIMEOUT),
          recommended_action: 'Move your mouse or click to stay signed in'
        });
        
        // Auto sign out after additional grace period
        if (timeSinceActivity > this.ACTIVITY_TIMEOUT + this.WARNING_THRESHOLD) {
          await this.signOut('activity_timeout');
          return;
        }
      }

      // Check for session expiry warning
      if (timeUntilExpiry > 0 && timeUntilExpiry < this.WARNING_THRESHOLD) {
        this.emitWarning({
          type: 'expiring_soon',
          message: 'Your session is about to expire',
          severity: 'high',
          expires_at: new Date((session.expires_at || 0) * 1000),
          recommended_action: 'Your session will be refreshed automatically'
        });
      }

      // Auto-refresh if needed
      if (timeUntilExpiry > 0 && timeUntilExpiry < this.REFRESH_THRESHOLD) {
        await this.refreshSession();
      }

    } catch (error) {
      console.error('Session health check failed:', error);
    }
  }

  /**
   * Emit warning to registered callbacks
   */
  private emitWarning(warning: SessionWarning): void {
    this.warningCallbacks.forEach(callback => {
      try {
        callback(warning);
      } catch (error) {
        console.error('Warning callback error:', error);
      }
    });
  }

  /**
   * Register a warning callback
   */
  onWarning(callback: (warning: SessionWarning) => void): () => void {
    this.warningCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.warningCallbacks.indexOf(callback);
      if (index > -1) {
        this.warningCallbacks.splice(index, 1);
      }
    };
  }

  // Store session data
  static setSession(session: AuthSession): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        token_type: session.token_type,
        provider_token: session.provider_token,
        provider_refresh_token: session.provider_refresh_token
      }));
      
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      
      // Update last activity
      this.updateActivity();
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  // Retrieve session data
  static getSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      const userData = localStorage.getItem(USER_KEY);
      
      if (!sessionData || !userData) {
        return null;
      }

      const session: AuthSession = JSON.parse(sessionData);
      const user: User = JSON.parse(userData);

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        this.clearSession();
        return null;
      }

      // Check for inactivity timeout
      if (this.isActivityExpired()) {
        this.clearSession();
        return null;
      }

      // Update last activity
      this.updateActivity();

      return { ...session, user };
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      this.clearSession();
      return null;
    }
  }

  // Get current user from session
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(USER_KEY);
      if (!userData) {
        return null;
      }

      // Check if session is still valid
      const session = this.getSession();
      if (!session) {
        return null;
      }

      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      return null;
    }
  }

  // Update user data in session
  static updateUser(user: User): void {
    try {
      const session = this.getSession();
      if (session) {
        const updatedSession = { ...session, user };
        this.setSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }

  // Clear session data
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Check if session is expired
  static isSessionExpired(session: AuthSession): boolean {
    const now = Date.now();
    return session.expires_at * 1000 < now;
  }

  // Check if user activity has expired
  static isActivityExpired(): boolean {
    try {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) {
        // If no activity is stored, check if we have a valid session first
        // This prevents false positives during login process
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
          // If we have session data but no activity, initialize activity
          this.updateActivity();
          return false;
        }
        return true;
      }

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      
      return (now - lastActivityTime) > ACTIVITY_TIMEOUT;
    } catch (error) {
      console.error('Failed to check activity expiration:', error);
      return true;
    }
  }

  // Update last activity timestamp
  static updateActivity(): void {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  // Get time until session expires
  static getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) {
      return 0;
    }

    const now = Date.now();
    const expiryTime = session.expires_at * 1000;
    
    return Math.max(0, expiryTime - now);
  }

  // Get time until activity timeout
  static getTimeUntilActivityTimeout(): number {
    try {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) {
        return 0;
      }

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const timeoutAt = lastActivityTime + ACTIVITY_TIMEOUT;
      
      return Math.max(0, timeoutAt - now);
    } catch (error) {
      console.error('Failed to calculate activity timeout:', error);
      return 0;
    }
  }

  // Check if session exists and is valid
  static hasValidSession(): boolean {
    return this.getSession() !== null;
  }

  // Temporarily disable session validation (used during login)
  static disableValidation(): void {
    validationDisabled = true;
  }

  // Re-enable session validation
  static enableValidation(): void {
    validationDisabled = false;
  }

  // Check if validation is currently disabled
  static isValidationDisabled(): boolean {
    return validationDisabled;
  }

  // Refresh session (extend expiry)
  static refreshSession(newExpiresAt: number): boolean {
    try {
      const session = this.getSession();
      if (!session) {
        return false;
      }

      const refreshedSession = {
        ...session,
        expires_at: newExpiresAt
      };

      this.setSession(refreshedSession);
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }

  // Initialize activity tracking
  static initActivityTracking(): () => void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateActivity();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Return cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
    };
  }

  // Check session validity periodically
  static startSessionMonitoring(onSessionExpired: () => void): () => void {
    const checkInterval = 60 * 1000; // Check every minute
    
    const intervalId = setInterval(() => {
      if (!this.hasValidSession()) {
        onSessionExpired();
      }
    }, checkInterval);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }
}

/**
 * Create session manager instance
 */
export function createSessionManager(
  ip_address?: string, 
  user_agent?: string | null
): SessionManager {
  return new SessionManager(ip_address, user_agent);
}