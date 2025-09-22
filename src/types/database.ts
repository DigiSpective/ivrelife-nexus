/**
 * TypeScript Database Schema for Supabase
 * Generated from the production schema migrations
 */

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: {
          user_id: string;
          email: string;
          role: 'owner' | 'backoffice' | 'retailer' | 'location_user';
          retailer_id: string | null;
          location_id: string | null;
          status: 'active' | 'suspended' | 'inactive';
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          timezone: string;
          locale: string;
          last_login_at: string | null;
          last_login_ip: string | null;
          password_changed_at: string;
          mfa_enabled: boolean;
          mfa_backup_codes_generated_at: string | null;
          profile_metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          user_id: string;
          email: string;
          role: 'owner' | 'backoffice' | 'retailer' | 'location_user';
          retailer_id?: string | null;
          location_id?: string | null;
          status?: 'active' | 'suspended' | 'inactive';
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          timezone?: string;
          locale?: string;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          password_changed_at?: string;
          mfa_enabled?: boolean;
          mfa_backup_codes_generated_at?: string | null;
          profile_metadata?: Record<string, any>;
          created_by?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string;
          role?: 'owner' | 'backoffice' | 'retailer' | 'location_user';
          retailer_id?: string | null;
          location_id?: string | null;
          status?: 'active' | 'suspended' | 'inactive';
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          timezone?: string;
          locale?: string;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          password_changed_at?: string;
          mfa_enabled?: boolean;
          mfa_backup_codes_generated_at?: string | null;
          profile_metadata?: Record<string, any>;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      auth_sessions: {
        Row: {
          session_id: string;
          user_id: string;
          refresh_token_hash: string;
          access_token_jti: string | null;
          expires_at: string;
          last_activity: string;
          created_at: string;
          ip_address: string;
          user_agent: string | null;
          device_id: string | null;
          device_fingerprint: Record<string, any> | null;
          location_data: Record<string, any> | null;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          is_mfa_verified: boolean;
        };
        Insert: {
          session_id?: string;
          user_id: string;
          refresh_token_hash: string;
          access_token_jti?: string | null;
          expires_at: string;
          last_activity?: string;
          ip_address: string;
          user_agent?: string | null;
          device_id?: string | null;
          device_fingerprint?: Record<string, any> | null;
          location_data?: Record<string, any> | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          is_mfa_verified?: boolean;
        };
        Update: {
          session_id?: string;
          user_id?: string;
          refresh_token_hash?: string;
          access_token_jti?: string | null;
          expires_at?: string;
          last_activity?: string;
          created_at?: string;
          ip_address?: string;
          user_agent?: string | null;
          device_id?: string | null;
          device_fingerprint?: Record<string, any> | null;
          location_data?: Record<string, any> | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          is_mfa_verified?: boolean;
        };
      };
      roles: {
        Row: {
          role_name: string;
          display_name: string;
          description: string | null;
          permissions: Record<string, any>;
          is_system_role: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          role_name: string;
          display_name: string;
          description?: string | null;
          permissions?: Record<string, any>;
          is_system_role?: boolean;
        };
        Update: {
          role_name?: string;
          display_name?: string;
          description?: string | null;
          permissions?: Record<string, any>;
          is_system_role?: boolean;
          updated_at?: string;
        };
      };
      invite_tokens: {
        Row: {
          token_id: string;
          token_hash: string;
          email: string;
          invited_by: string;
          role: 'owner' | 'backoffice' | 'retailer' | 'location_user';
          retailer_id: string | null;
          location_id: string | null;
          permissions: Record<string, any> | null;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          token_id?: string;
          token_hash: string;
          email: string;
          invited_by: string;
          role: 'owner' | 'backoffice' | 'retailer' | 'location_user';
          retailer_id?: string | null;
          location_id?: string | null;
          permissions?: Record<string, any> | null;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          token_id?: string;
          token_hash?: string;
          email?: string;
          invited_by?: string;
          role?: 'owner' | 'backoffice' | 'retailer' | 'location_user';
          retailer_id?: string | null;
          location_id?: string | null;
          permissions?: Record<string, any> | null;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          log_id: string;
          event_type: string;
          user_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          request_id: string | null;
          resource_type: string | null;
          resource_id: string | null;
          action: string;
          status: 'success' | 'failure' | 'error';
          risk_score: number | null;
          anomaly_flags: string[] | null;
          event_data: Record<string, any>;
          error_details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          log_id?: string;
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
        };
        Update: {
          log_id?: string;
          event_type?: string;
          user_id?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
          action?: string;
          status?: 'success' | 'failure' | 'error';
          risk_score?: number | null;
          anomaly_flags?: string[] | null;
          event_data?: Record<string, any>;
          error_details?: Record<string, any> | null;
          created_at?: string;
        };
      };
      mfa_devices: {
        Row: {
          device_id: string;
          user_id: string;
          device_type: 'totp' | 'sms' | 'backup_codes';
          device_name: string | null;
          secret_encrypted: string | null;
          backup_codes_encrypted: string[] | null;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          device_id?: string;
          user_id: string;
          device_type: 'totp' | 'sms' | 'backup_codes';
          device_name?: string | null;
          secret_encrypted?: string | null;
          backup_codes_encrypted?: string[] | null;
          is_active?: boolean;
          last_used_at?: string | null;
        };
        Update: {
          device_id?: string;
          user_id?: string;
          device_type?: 'totp' | 'sms' | 'backup_codes';
          device_name?: string | null;
          secret_encrypted?: string | null;
          backup_codes_encrypted?: string[] | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
      };
      password_history: {
        Row: {
          history_id: string;
          user_id: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          history_id?: string;
          user_id: string;
          password_hash: string;
        };
        Update: {
          history_id?: string;
          user_id?: string;
          password_hash?: string;
          created_at?: string;
        };
      };
      rate_limits: {
        Row: {
          limit_id: string;
          identifier: string;
          limit_type: string;
          attempt_count: number;
          window_start: string;
          last_attempt: string;
          blocked_until: string | null;
        };
        Insert: {
          limit_id?: string;
          identifier: string;
          limit_type: string;
          attempt_count?: number;
          window_start?: string;
          last_attempt?: string;
          blocked_until?: string | null;
        };
        Update: {
          limit_id?: string;
          identifier?: string;
          limit_type?: string;
          attempt_count?: number;
          window_start?: string;
          last_attempt?: string;
          blocked_until?: string | null;
        };
      };
      security_events: {
        Row: {
          event_id: string;
          event_type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          user_id: string | null;
          ip_address: string | null;
          description: string;
          event_data: Record<string, any>;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          event_id?: string;
          event_type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          user_id?: string | null;
          ip_address?: string | null;
          description: string;
          event_data?: Record<string, any>;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          user_id?: string | null;
          ip_address?: string | null;
          description?: string;
          event_data?: Record<string, any>;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
        };
      };
      // Include existing business tables...
      retailers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          status: 'active' | 'inactive' | 'suspended';
          contract_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          contract_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          contract_url?: string | null;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          retailer_id: string;
          name: string;
          address: Record<string, any> | null;
          contact_info: Record<string, any> | null;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: {
          id?: string;
          retailer_id: string;
          name: string;
          address?: Record<string, any> | null;
          contact_info?: Record<string, any> | null;
          status?: 'active' | 'inactive';
        };
        Update: {
          id?: string;
          retailer_id?: string;
          name?: string;
          address?: Record<string, any> | null;
          contact_info?: Record<string, any> | null;
          status?: 'active' | 'inactive';
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          retailer_id: string | null;
          primary_location_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          default_address: Record<string, any> | null;
          notes: string | null;
          external_ids: Record<string, any> | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          retailer_id?: string | null;
          primary_location_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          default_address?: Record<string, any> | null;
          notes?: string | null;
          external_ids?: Record<string, any> | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          retailer_id?: string | null;
          primary_location_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          default_address?: Record<string, any> | null;
          notes?: string | null;
          external_ids?: Record<string, any> | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_permissions: {
        Args: {
          target_user_id: string;
        };
        Returns: Record<string, any>;
      };
      user_has_permission: {
        Args: {
          target_user_id: string;
          resource: string;
          action: string;
        };
        Returns: boolean;
      };
      create_audit_log: {
        Args: {
          p_event_type: string;
          p_user_id?: string;
          p_session_id?: string;
          p_ip_address?: string;
          p_user_agent?: string;
          p_resource_type?: string;
          p_resource_id?: string;
          p_action?: string;
          p_status?: string;
          p_event_data?: Record<string, any>;
        };
        Returns: string;
      };
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      cleanup_expired_invites: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      user_role: 'owner' | 'backoffice' | 'retailer' | 'location_user';
      user_status: 'active' | 'suspended' | 'inactive';
      mfa_device_type: 'totp' | 'sms' | 'backup_codes';
      audit_status: 'success' | 'failure' | 'error';
      security_event_severity: 'low' | 'medium' | 'high' | 'critical';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}