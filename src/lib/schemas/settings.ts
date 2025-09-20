import * as z from 'zod';

// Profile form schema
export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

// Password form schema
export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Feature toggle schema
export const featureToggleSchema = z.object({
  feature_key: z.string().min(1, 'Feature key is required'),
  enabled: z.boolean(),
});

// Notification preference schema
export const notificationSchema = z.object({
  type: z.enum(['email', 'sms', 'push'], {
    errorMap: () => ({ message: 'Invalid notification type' }),
  }),
  enabled: z.boolean(),
});

// System setting schema
export const systemSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.any(), // Allow any JSON value
});

// Export types
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordFormValues = z.infer<typeof passwordSchema>;
export type FeatureToggleFormValues = z.infer<typeof featureToggleSchema>;
export type NotificationFormValues = z.infer<typeof notificationSchema>;
export type SystemSettingFormValues = z.infer<typeof systemSettingSchema>;