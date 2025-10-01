import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserProfile,
  updateUserProfile,
  getUserFeatures,
  updateUserFeature,
  createUserFeature,
  getUserNotifications,
  updateUserNotification,
  createUserNotification,
  getSystemSettings,
  getSystemSettingByKey,
  updateSystemSetting,
  createSystemSetting,
  updatePassword,
  createOutboxEvent
} from '@/lib/supabase';
import { 
  User,
  UserFeature,
  UserNotification,
  SystemSetting
} from '@/types';
import { useSettingsAuditLogger } from '@/hooks/useAuditLogger';

// User profile hooks
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { logProfileUpdate } = useSettingsAuditLogger();

  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
      console.log('🔍 useUpdateUserProfile mutation called:', { userId, userData });

      const result = await updateUserProfile(userId, userData);
      console.log('🔍 updateUserProfile result:', result);

      // If the update failed, return the error immediately
      if (result.error) {
        console.error('❌ Profile update failed:', result.error);
        throw new Error(result.error.message || 'Failed to update profile');
      }

      // Log audit action (non-blocking - don't fail if logging fails)
      if (result.data) {
        try {
          await logProfileUpdate(userId, userData);
          console.log('✅ Audit log created');
        } catch (err) {
          console.warn('⚠️ Failed to create audit log (non-critical):', err);
        }

        // Create outbox event for notifications (non-blocking)
        try {
          await createOutboxEvent({
            event_type: 'profile_update',
            entity: 'users',
            entity_id: userId,
            payload: {
              user_id: userId,
              updated_fields: userData,
              timestamp: new Date().toISOString()
            }
          });
          console.log('✅ Outbox event created');
        } catch (err) {
          console.warn('⚠️ Failed to create outbox event (non-critical):', err);
        }
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Profile update mutation succeeded');
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.data?.id] });
      // Also invalidate the current user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error) => {
      console.error('❌ Profile update mutation error:', error);
    },
  });
};

// User features hooks
export const useUserFeatures = (userId: string) => {
  return useQuery({
    queryKey: ['userFeatures', userId],
    queryFn: () => getUserFeatures(userId),
    enabled: !!userId,
  });
};

export const useUpdateUserFeature = () => {
  const queryClient = useQueryClient();
  const { logFeatureToggle } = useSettingsAuditLogger();
  
  return useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: string; enabled: boolean }) => {
      const result = await updateUserFeature(featureId, enabled);
      
      // Log audit action
      if (result.data) {
        await logFeatureToggle(featureId, result.data.feature_key, enabled);
        
        // Create outbox event for notifications
        await createOutboxEvent({
          event_type: 'feature_toggle',
          entity: 'user_features',
          entity_id: featureId,
          payload: {
            feature_id: featureId,
            feature_key: result.data.feature_key,
            enabled,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userFeatures', data.data?.user_id] });
    },
  });
};

export const useCreateUserFeature = () => {
  const queryClient = useQueryClient();
  const { logFeatureToggle } = useSettingsAuditLogger();
  
  return useMutation({
    mutationFn: async (feature: Partial<UserFeature>) => {
      const result = await createUserFeature(feature);
      
      // Log audit action
      if (result.data) {
        await logFeatureToggle(result.data.id, result.data.feature_key, result.data.enabled);
        
        // Create outbox event for notifications
        await createOutboxEvent({
          event_type: 'feature_create',
          entity: 'user_features',
          entity_id: result.data.id,
          payload: {
            feature_id: result.data.id,
            feature_key: result.data.feature_key,
            enabled: result.data.enabled,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userFeatures', data.data?.user_id] });
    },
  });
};

// User notifications hooks
export const useUserNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['userNotifications', userId],
    queryFn: () => getUserNotifications(userId),
    enabled: !!userId,
  });
};

export const useUpdateUserNotification = () => {
  const queryClient = useQueryClient();
  const { logNotificationUpdate } = useSettingsAuditLogger();
  
  return useMutation({
    mutationFn: async ({ notificationId, enabled }: { notificationId: string; enabled: boolean }) => {
      const result = await updateUserNotification(notificationId, enabled);
      
      // Log audit action
      if (result.data) {
        await logNotificationUpdate(notificationId, result.data.type, enabled);
        
        // Create outbox event for notifications
        await createOutboxEvent({
          event_type: 'notification_update',
          entity: 'user_notifications',
          entity_id: notificationId,
          payload: {
            notification_id: notificationId,
            type: result.data.type,
            enabled,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications', data.data?.user_id] });
    },
  });
};

export const useCreateUserNotification = () => {
  const queryClient = useQueryClient();
  const { logNotificationUpdate } = useSettingsAuditLogger();
  
  return useMutation({
    mutationFn: async (notification: Partial<UserNotification>) => {
      const result = await createUserNotification(notification);
      
      // Log audit action
      if (result.data) {
        await logNotificationUpdate(result.data.id, result.data.type, result.data.enabled);
        
        // Create outbox event for notifications
        await createOutboxEvent({
          event_type: 'notification_create',
          entity: 'user_notifications',
          entity_id: result.data.id,
          payload: {
            notification_id: result.data.id,
            type: result.data.type,
            enabled: result.data.enabled,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications', data.data?.user_id] });
    },
  });
};

// System settings hooks
export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => getSystemSettings(),
  });
};

export const useSystemSettingByKey = (key: string) => {
  return useQuery({
    queryKey: ['systemSetting', key],
    queryFn: () => getSystemSettingByKey(key),
    enabled: !!key,
  });
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  const { logSystemSettingUpdate } = useSettingsAuditLogger();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const result = await updateSystemSetting(key, value);
      
      // Log audit action
      if (result.data) {
        await logSystemSettingUpdate(result.data.id, key, value);
        
        // Create outbox event for notifications
        await createOutboxEvent({
          event_type: 'system_setting_update',
          entity: 'system_settings',
          entity_id: result.data.id,
          payload: {
            setting_id: result.data.id,
            key,
            value,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
  });
};

export const useCreateSystemSetting = () => {
  const queryClient = useQueryClient();
  const { logSystemSettingUpdate } = useSettingsAuditLogger();
  
  return useMutation({
    mutationFn: async (setting: Partial<SystemSetting>) => {
      const result = await createSystemSetting(setting);
      
      // Log audit action
      if (result.data) {
        await logSystemSettingUpdate(result.data.id, result.data.key, result.data.value);
        
        // Create outbox event for notifications
        await createOutboxEvent({
          event_type: 'system_setting_create',
          entity: 'system_settings',
          entity_id: result.data.id,
          payload: {
            setting_id: result.data.id,
            key: result.data.key,
            value: result.data.value,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
  });
};

// Password update hook
export const useUpdatePassword = () => {
  const queryClient = useQueryClient();
  const { logProfileUpdate } = useSettingsAuditLogger();
  
  return useMutation({
    mutationFn: async ({ userId, newPasswordHash }: { userId: string; newPasswordHash: string }) => {
      const result = await updatePassword(userId, newPasswordHash);
      
      // Log audit action
      if (result.data) {
        await logProfileUpdate(userId, { password_updated: true });
        
        // Create outbox event for notifications
        await createOutboxEvent({
          event_type: 'password_update',
          entity: 'users',
          entity_id: userId,
          payload: {
            user_id: userId,
            password_updated: true,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', data.data?.id] });
    },
  });
};