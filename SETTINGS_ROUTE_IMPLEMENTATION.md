# Settings Route Implementation

This document outlines the implementation of the `/settings` route for the IV RELIFE Internal System dashboard.

## Overview

The settings route provides a comprehensive interface for users to manage their profile, features, notifications, and system-wide settings. The implementation includes:

1. Database schema with RLS policies
2. Supabase integration functions
3. React hooks for data management
4. UI components with form validation
5. Role-based access control
6. Audit logging and outbox events
7. Edge functions for notifications
8. Integration tests

## Database Schema

The implementation includes the following tables:

- `users` - Extended user profile with password hash
- `user_features` - Feature toggles per user
- `user_notifications` - Notification preferences per user
- `system_settings` - System-wide configuration settings
- `audit_logs` - Audit trail for all changes
- `outbox` - Event queue for notifications

## Key Features

### Profile Management
- Update user name and email
- Secure password change functionality
- Form validation with Zod schemas

### Feature Toggles
- Per-user feature enable/disable
- Predefined feature set with descriptions
- Audit logging for all changes

### Notification Preferences
- Email, SMS, and push notification controls
- Default enabled settings
- User-friendly toggle interface

### System Settings (Admin Only)
- JSON-based configuration values
- Key-value store for system settings
- Role-based access control (owner/backoffice only)

### Security & Compliance
- Row Level Security (RLS) policies
- Audit logging for all changes
- Outbox events for notifications
- Role-based access control

## Implementation Details

### React Hooks
Custom hooks for each settings entity:
- `useUserProfile` / `useUpdateUserProfile`
- `useUserFeatures` / `useUpdateUserFeature` / `useCreateUserFeature`
- `useUserNotifications` / `useUpdateUserNotification` / `useCreateUserNotification`
- `useSystemSettings` / `useSystemSettingByKey` / `useUpdateSystemSetting` / `useCreateSystemSetting`
- `useUpdatePassword`

### UI Components
- `ProfileForm` - Profile and password management
- `FeatureToggleList` - Feature toggle interface
- `NotificationSettingsForm` - Notification preferences
- `SystemSettingsForm` - System configuration
- `AuditTrail` - Audit log display
- `SettingsAuthGuard` - Role-based access control

### Edge Functions
- `send-setting-update-notification` - Notification dispatch
- `generate-settings-report` - Settings report generation

### Form Validation
All forms use Zod schemas for client-side validation:
- Profile form validation
- Password form validation
- Feature toggle validation
- Notification preference validation
- System setting validation

## Routes

The settings route includes the following sub-routes:
- `/settings/profile` - Profile and security settings
- `/settings/features` - Feature toggle management
- `/settings/notifications` - Notification preferences
- `/settings/system` - System-wide configuration (admin only)

## Testing

Integration tests are provided in `tests/settings.integration.test.js` covering:
- Data fetching hooks
- Mutation hooks
- Component rendering
- Role-based access control

## Security

- RLS policies enforce data access rules
- Audit logging tracks all changes
- Outbox events ensure notification delivery
- Role-based access control limits system settings to admins