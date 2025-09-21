import { supabase } from './supabase-auth';
import { AuditLog, OutboxEvent } from '@/types';

// Get client information for audit logging
const getClientInfo = () => {
  return {
    ip_address: 'unknown', // This would typically come from server-side
    user_agent: navigator.userAgent
  };
};

// Create audit log entry
export const createAuditLog = async (
  auditData: Omit<AuditLog, 'id' | 'created_at' | 'ip_address' | 'user_agent'>
): Promise<{ error: Error | null }> => {
  try {
    const clientInfo = getClientInfo();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        ...auditData,
        ...clientInfo,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create audit log:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('Audit log creation error:', err);
    return { error: err as Error };
  }
};

// Create outbox event for async processing
export const createOutboxEvent = async (
  eventData: Omit<OutboxEvent, 'id' | 'created_at' | 'processed_at' | 'retry_count'>
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('outbox')
      .insert({
        ...eventData,
        retry_count: 0,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create outbox event:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('Outbox event creation error:', err);
    return { error: err as Error };
  }
};

// Specific audit log functions for auth events

export const logAuthEvent = async (
  action: 'login' | 'logout' | 'password_reset' | 'registration' | 'invite_accepted',
  userId?: string,
  details?: any
) => {
  return createAuditLog({
    user_id: userId,
    action,
    entity: 'users',
    entity_id: userId || 'unknown',
    details
  });
};

export const logLogin = async (userId: string, email: string) => {
  await logAuthEvent('login', userId, { email, timestamp: new Date().toISOString() });
};

export const logLogout = async (userId: string) => {
  await logAuthEvent('logout', userId, { timestamp: new Date().toISOString() });
};

export const logRegistration = async (userId: string, email: string, role: string, inviteUsed?: boolean) => {
  await logAuthEvent('registration', userId, { 
    email, 
    role, 
    invite_used: inviteUsed,
    timestamp: new Date().toISOString() 
  });
};

export const logPasswordReset = async (email: string) => {
  await logAuthEvent('password_reset', undefined, { 
    email, 
    timestamp: new Date().toISOString() 
  });
};

export const logInviteAccepted = async (userId: string, email: string, inviteTokenId: string) => {
  await logAuthEvent('invite_accepted', userId, { 
    email, 
    invite_token_id: inviteTokenId,
    timestamp: new Date().toISOString() 
  });
};

// Outbox event functions for notifications

export const queueWelcomeEmail = async (userId: string, email: string, name: string) => {
  return createOutboxEvent({
    event_type: 'welcome_email',
    entity: 'users',
    entity_id: userId,
    payload: {
      email,
      name,
      template: 'welcome',
      timestamp: new Date().toISOString()
    }
  });
};

export const queuePasswordResetEmail = async (email: string, resetToken: string) => {
  return createOutboxEvent({
    event_type: 'password_reset_email',
    entity: 'users',
    entity_id: email, // Use email as entity_id for password reset
    payload: {
      email,
      reset_token: resetToken,
      template: 'password_reset',
      timestamp: new Date().toISOString()
    }
  });
};

export const queueInviteEmail = async (email: string, inviteTokenId: string, inviterName: string, role: string) => {
  return createOutboxEvent({
    event_type: 'invite_email',
    entity: 'invite_tokens',
    entity_id: inviteTokenId,
    payload: {
      email,
      invite_token_id: inviteTokenId,
      inviter_name: inviterName,
      role,
      template: 'invite',
      timestamp: new Date().toISOString()
    }
  });
};

// Generic audit log function for other entities
export const logEntityAction = async (
  action: 'create' | 'update' | 'delete',
  entity: string,
  entityId: string,
  userId?: string,
  details?: any
) => {
  return createAuditLog({
    user_id: userId,
    action,
    entity,
    entity_id: entityId,
    details
  });
};

// Fetch audit logs for an entity
export const getAuditLogs = async (entity: string, entityId: string) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(email, name, role)')
      .eq('entity', entity)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Audit logs fetch error:', err);
    return { data: [], error: err as Error };
  }
};