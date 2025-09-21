import { useCallback } from 'react';
import { createAuditLog, logEntityAction, getAuditLogs } from '@/lib/audit-logger';
import { AuditLog } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logAction = useCallback(async (
    action: AuditLog['action'], 
    entity: string, 
    entityId: string, 
    details?: any
  ) => {
    try {
      const { error } = await createAuditLog({
        user_id: user?.id,
        action,
        entity,
        entity_id: entityId,
        details
      });

      if (error) {
        console.error('Error logging audit action:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error logging audit action:', err);
      throw err;
    }
  }, [user?.id]);

  const logCreate = useCallback((entity: string, entityId: string, details?: any) => {
    return logEntityAction('create', entity, entityId, user?.id, details);
  }, [user?.id]);

  const logUpdate = useCallback((entity: string, entityId: string, details?: any) => {
    return logEntityAction('update', entity, entityId, user?.id, details);
  }, [user?.id]);

  const logDelete = useCallback((entity: string, entityId: string, details?: any) => {
    return logEntityAction('delete', entity, entityId, user?.id, details);
  }, [user?.id]);

  const fetchAuditLogs = useCallback(async (entity: string, entityId: string) => {
    return getAuditLogs(entity, entityId);
  }, []);

  return { 
    logAction, 
    logCreate, 
    logUpdate, 
    logDelete, 
    fetchAuditLogs 
  };
};

// Specific audit log functions for different modules
export const useSettingsAuditLogger = () => {
  const { logAction } = useAuditLogger();
  
  const logProfileUpdate = useCallback((userId: string, changes: any) => {
    return logAction('profile_update', 'users', userId, { changes, timestamp: new Date().toISOString() });
  }, [logAction]);
  
  const logFeatureToggle = useCallback((featureId: string, featureKey: string, enabled: boolean) => {
    return logAction('update', 'user_features', featureId, { 
      feature_key: featureKey, 
      enabled, 
      timestamp: new Date().toISOString() 
    });
  }, [logAction]);
  
  const logNotificationUpdate = useCallback((notificationId: string, type: string, enabled: boolean) => {
    return logAction('update', 'user_notifications', notificationId, { 
      type, 
      enabled, 
      timestamp: new Date().toISOString() 
    });
  }, [logAction]);
  
  const logSystemSettingUpdate = useCallback((settingId: string, key: string, value: any) => {
    return logAction('update', 'system_settings', settingId, { 
      key, 
      value, 
      timestamp: new Date().toISOString() 
    });
  }, [logAction]);
  
  return {
    logProfileUpdate,
    logFeatureToggle,
    logNotificationUpdate,
    logSystemSettingUpdate
  };
};

// Audit logger for auth events
export const useAuthAuditLogger = () => {
  const { logAction } = useAuditLogger();
  
  const logPasswordChange = useCallback((userId: string) => {
    return logAction('password_reset', 'users', userId, { 
      type: 'password_change',
      timestamp: new Date().toISOString() 
    });
  }, [logAction]);
  
  const logRoleChange = useCallback((userId: string, oldRole: string, newRole: string) => {
    return logAction('role_change', 'users', userId, { 
      old_role: oldRole,
      new_role: newRole,
      timestamp: new Date().toISOString() 
    });
  }, [logAction]);
  
  return {
    logPasswordChange,
    logRoleChange
  };
};

// Audit logger for business entities
export const useBusinessAuditLogger = () => {
  const { logCreate, logUpdate, logDelete } = useAuditLogger();
  
  const logRetailerAction = useCallback((action: 'create' | 'update' | 'delete', retailerId: string, details?: any) => {
    switch (action) {
      case 'create':
        return logCreate('retailers', retailerId, details);
      case 'update':
        return logUpdate('retailers', retailerId, details);
      case 'delete':
        return logDelete('retailers', retailerId, details);
    }
  }, [logCreate, logUpdate, logDelete]);
  
  const logLocationAction = useCallback((action: 'create' | 'update' | 'delete', locationId: string, details?: any) => {
    switch (action) {
      case 'create':
        return logCreate('locations', locationId, details);
      case 'update':
        return logUpdate('locations', locationId, details);
      case 'delete':
        return logDelete('locations', locationId, details);
    }
  }, [logCreate, logUpdate, logDelete]);
  
  const logCustomerAction = useCallback((action: 'create' | 'update' | 'delete', customerId: string, details?: any) => {
    switch (action) {
      case 'create':
        return logCreate('customers', customerId, details);
      case 'update':
        return logUpdate('customers', customerId, details);
      case 'delete':
        return logDelete('customers', customerId, details);
    }
  }, [logCreate, logUpdate, logDelete]);
  
  const logOrderAction = useCallback((action: 'create' | 'update' | 'delete', orderId: string, details?: any) => {
    switch (action) {
      case 'create':
        return logCreate('orders', orderId, details);
      case 'update':
        return logUpdate('orders', orderId, details);
      case 'delete':
        return logDelete('orders', orderId, details);
    }
  }, [logCreate, logUpdate, logDelete]);
  
  const logClaimAction = useCallback((action: 'create' | 'update' | 'delete', claimId: string, details?: any) => {
    switch (action) {
      case 'create':
        return logCreate('claims', claimId, details);
      case 'update':
        return logUpdate('claims', claimId, details);
      case 'delete':
        return logDelete('claims', claimId, details);
    }
  }, [logCreate, logUpdate, logDelete]);
  
  return {
    logRetailerAction,
    logLocationAction,
    logCustomerAction,
    logOrderAction,
    logClaimAction
  };
};