import { supabase } from '@/lib/supabase';
import { AuditLog } from '@/types';

export const useAuditLogger = () => {
  const logAction = async (action: string, entity: string, entityId: string, details?: any) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditLog: Omit<AuditLog, 'id' | 'created_at'> = {
        user_id: user?.id,
        action,
        entity,
        entity_id: entityId,
        details
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([auditLog])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error logging audit action:', err);
      throw err;
    }
  };

  return { logAction };
};

// Specific audit log functions for settings
export const useSettingsAuditLogger = () => {
  const { logAction } = useAuditLogger();
  
  const logProfileUpdate = (userId: string, changes: any) => {
    return logAction('UPDATE_PROFILE', 'users', userId, changes);
  };
  
  const logFeatureToggle = (featureId: string, featureKey: string, enabled: boolean) => {
    return logAction('TOGGLE_FEATURE', 'user_features', featureId, { featureKey, enabled });
  };
  
  const logNotificationUpdate = (notificationId: string, type: string, enabled: boolean) => {
    return logAction('UPDATE_NOTIFICATION', 'user_notifications', notificationId, { type, enabled });
  };
  
  const logSystemSettingUpdate = (settingId: string, key: string, value: any) => {
    return logAction('UPDATE_SYSTEM_SETTING', 'system_settings', settingId, { key, value });
  };
  
  return {
    logProfileUpdate,
    logFeatureToggle,
    logNotificationUpdate,
    logSystemSettingUpdate
  };
};