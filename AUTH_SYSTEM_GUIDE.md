# IV RELIFE Authentication System Guide

This document provides a comprehensive guide to the authentication system implemented for the IV RELIFE Internal System.

## Overview

The authentication system is built with:
- **Frontend**: React + TypeScript + Vite
- **UI**: ShadCN UI + Tailwind CSS
- **Authentication**: Supabase Auth
- **State Management**: React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

## Features

### ✅ Core Authentication
- [x] Email/password login
- [x] User registration with role-based access
- [x] Password reset via email
- [x] Session management with automatic expiry
- [x] Role-based redirects after login

### ✅ Security Features
- [x] Multi-role support (owner, backoffice, retailer, location_user)
- [x] Invite-only registration for privileged roles
- [x] Session timeout with activity tracking
- [x] Protected routes with role-based access control
- [x] Audit logging for all auth events
- [x] Secure session storage

### ✅ User Experience
- [x] Responsive auth forms with validation
- [x] Session expiry warnings
- [x] Loading states and error handling
- [x] Password visibility toggle
- [x] Auto-redirect after auth events

### ✅ Administrative Features
- [x] User invite system with expiring tokens
- [x] Audit trail for all authentication events
- [x] Outbox pattern for email notifications
- [x] Role-based dashboard routing

## File Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthLayout.tsx         # Common layout for auth pages
│   │   ├── LoginForm.tsx          # Login form component
│   │   ├── RegisterForm.tsx       # Registration form with invite support
│   │   ├── ResetPasswordForm.tsx  # Password reset form
│   │   ├── ErrorBanner.tsx        # Error display component
│   │   ├── SessionWarning.tsx     # Session expiry warning
│   │   ├── RoleBasedRedirect.tsx  # Role-based routing logic
│   │   └── InviteManager.tsx      # Admin invite creation
│   ├── layout/
│   │   ├── AuthGuard.tsx          # Route protection component
│   │   └── DashboardLayout.tsx    # Enhanced with session management
│   └── testing/
│       └── AuthTestRunner.tsx     # Authentication testing interface
├── hooks/
│   ├── useAuth.ts                 # Main authentication hook with context
│   ├── useAuditLogger.ts          # Audit logging hooks
│   ├── useNotification.ts         # Notification system hooks
│   └── useSessionActivity.ts      # Session monitoring hooks
├── lib/
│   ├── supabase-auth.ts          # Enhanced Supabase auth functions
│   ├── audit-logger.ts           # Audit logging utilities
│   ├── session-manager.ts        # Session management utilities
│   ├── server-actions.ts         # Auth server actions
│   └── auth-test-utils.ts        # Testing utilities
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx         # Login page
│   │   ├── RegisterPage.tsx      # Registration page
│   │   ├── ResetPasswordPage.tsx # Password reset page
│   │   └── LogoutPage.tsx        # Logout page
│   └── Login.tsx                 # Legacy redirect
└── types/
    └── index.ts                  # Enhanced with auth types
```

## Quick Start

### 1. Environment Setup

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Database Schema

The system requires these database tables (already defined in types):

```sql
-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text CHECK (role IN ('owner','backoffice','retailer','location_user')) NOT NULL,
  retailer_id uuid REFERENCES retailers(id),
  location_id uuid REFERENCES locations(id),
  password_hash text,
  created_at timestamptz DEFAULT now()
);

-- Invite tokens table
CREATE TABLE invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text CHECK (role IN ('owner','backoffice','retailer','location_user')) NOT NULL,
  retailer_id uuid REFERENCES retailers(id),
  location_id uuid REFERENCES locations(id),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL CHECK (action IN ('login','logout','password_reset','registration','invite_accepted','profile_update','role_change','create','update','delete')),
  entity text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Outbox table for async notifications
CREATE TABLE outbox (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('welcome_email','password_reset_email','invite_email','notification')),
  entity text NOT NULL DEFAULT 'users',
  entity_id text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  retry_count int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now()
);
```

### 3. Setup Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;

-- Users can see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Owners and backoffice can see all users
CREATE POLICY "Owners can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- Similar policies for other tables...
```

### 4. Application Setup

Wrap your app with the AuthProvider:

```tsx
import { AuthProvider } from '@/hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
}
```

## Usage Examples

### Basic Authentication

```tsx
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const { signIn, loading, error } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const { success } = await signIn({ email, password });
    if (success) {
      // User is now logged in and will be redirected
    }
  };

  return (
    // Your login form
  );
}
```

### Role-Based Access Control

```tsx
import { useRole } from '@/hooks/useAuth';

function AdminComponent() {
  const { hasRole, hasAnyRole } = useRole();

  if (!hasAnyRole(['owner', 'backoffice'])) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

### Route Protection

```tsx
import { AuthGuard } from '@/components/layout/AuthGuard';

<Route 
  path="/admin" 
  element={
    <AuthGuard allowedRoles={['owner', 'backoffice']}>
      <AdminPage />
    </AuthGuard>
  } 
/>
```

### Audit Logging

```tsx
import { useAuditLogger } from '@/hooks/useAuditLogger';

function UserComponent() {
  const { logAction } = useAuditLogger();

  const handleUpdateProfile = async (data) => {
    // Update profile
    await updateProfile(data);
    
    // Log the action
    await logAction('profile_update', 'users', userId, data);
  };
}
```

## Testing

### Manual Testing

Access the built-in test runner at `/testing/auth` (in development):

```tsx
import { AuthTestRunner } from '@/components/testing/AuthTestRunner';

// Add to your router for testing
<Route path="/testing/auth" element={<AuthTestRunner />} />
```

### Test Credentials (Demo Mode)

When Supabase is not configured, use these demo credentials:

```
Email: admin@ivrelife.com
Password: admin123
```

### Automated Testing

```tsx
import { AUTH_TEST_SCENARIOS, validateTestEnvironment } from '@/lib/auth-test-utils';

// Run environment validation
const envCheck = validateTestEnvironment();

// Execute test scenarios
for (const scenario of AUTH_TEST_SCENARIOS) {
  // Run test based on scenario.steps
}
```

## Configuration

### Role-Based Redirects

Configure dashboard redirects in `getRoleBasedRedirect()`:

```tsx
export const getRoleBasedRedirect = (role: User['role']): string => {
  switch (role) {
    case 'owner':
      return '/dashboard/owner';
    case 'backoffice':
      return '/dashboard/backoffice';
    case 'retailer':
      return '/dashboard/retailer';
    case 'location_user':
      return '/dashboard/location';
    default:
      return '/dashboard';
  }
};
```

### Session Configuration

Modify session timeouts in `session-manager.ts`:

```tsx
// Session timeout (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// Activity timeout (30 minutes)
const ACTIVITY_TIMEOUT = 30 * 60 * 1000;
```

### Navigation Permissions

Update route permissions in the existing `navigationPermissions` object:

```tsx
export const navigationPermissions = {
  dashboard: ['owner', 'backoffice', 'retailer', 'location_user'],
  orders: ['owner', 'backoffice', 'retailer', 'location_user'],
  newOrder: ['retailer', 'location_user'],
  products: ['owner', 'backoffice', 'retailer'],
  customers: ['owner', 'backoffice', 'retailer', 'location_user'],
  shipping: ['owner', 'backoffice', 'retailer', 'location_user'],
  claims: ['owner', 'backoffice', 'retailer', 'location_user'],
  retailers: ['owner', 'backoffice'],
  settings: ['owner', 'backoffice', 'retailer']
};
```

## Security Best Practices

### 1. Environment Variables
- Never commit Supabase credentials to version control
- Use different credentials for development/staging/production
- Rotate API keys regularly

### 2. Session Management
- Sessions automatically expire after 24 hours
- Users are logged out after 30 minutes of inactivity
- Session warnings appear 5 minutes before expiry

### 3. Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, and number
- No common passwords (implement in production)

### 4. Role-Based Access
- Always verify permissions on both frontend and backend
- Use Row Level Security (RLS) in Supabase
- Implement principle of least privilege

### 5. Audit Logging
- All authentication events are logged
- Include IP address and user agent
- Log changes to user roles and permissions

## Production Deployment

### 1. Supabase Configuration
- Set up production Supabase project
- Configure custom SMTP for email delivery
- Enable and configure RLS policies
- Set up database backups

### 2. Environment Variables
```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 3. Domain Configuration
- Configure auth redirects for your domain
- Set up HTTPS/SSL certificates
- Configure CORS settings in Supabase

### 4. Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor authentication metrics
- Set up alerts for failed login attempts

## Troubleshooting

### Common Issues

1. **"Supabase not configured" errors**
   - Check environment variables
   - Verify Supabase project settings
   - Ensure database tables exist

2. **Session not persisting**
   - Check localStorage is enabled
   - Verify session storage keys
   - Check for third-party cookie blocking

3. **Role redirects not working**
   - Verify user role is set correctly
   - Check route permissions configuration
   - Ensure AuthGuard is properly configured

4. **Invite tokens not working**
   - Check invite_tokens table exists
   - Verify email/token parameters in URL
   - Check token expiry dates

### Debug Mode

Enable debug logging by setting:

```tsx
// In your main component
useEffect(() => {
  if (import.meta.env.DEV) {
    console.log('Auth debug mode enabled');
    // Additional debug setup
  }
}, []);
```

## API Reference

### Core Hooks

#### `useAuth()`
Main authentication hook providing auth state and actions.

```tsx
const {
  user,           // Current user object
  session,        // Current session
  loading,        // Loading state
  error,          // Current error
  signIn,         // Login function
  signUp,         // Registration function  
  signOut,        // Logout function
  resetPassword,  // Password reset function
  clearError,     // Clear error state
  refreshUser     // Refresh user data
} = useAuth();
```

#### `useRole()`
Role-based access control utilities.

```tsx
const {
  user,                  // Current user
  hasRole,               // Check single role
  hasAnyRole,           // Check multiple roles
  canAccessRetailer,    // Retailer access check
  canAccessLocation,    // Location access check
  getRoleRedirect       // Get redirect URL for role
} = useRole();
```

#### `useAuthStatus()`
Authentication status utilities.

```tsx
const {
  isAuthenticated,     // Is user logged in
  isUnauthenticated,  // Is user not logged in
  isLoading,          // Is auth state loading
  user                // Current user
} = useAuthStatus();
```

### Server Actions

All server actions return `{ success: boolean, error?: string, data?: any }`:

- `loginAction(credentials)` - Authenticate user
- `registerAction(data)` - Register new user
- `logoutAction(userId?)` - Sign out user
- `resetPasswordAction(email)` - Request password reset
- `createInviteAction(...)` - Create user invite
- `validateInviteAction(token, email)` - Validate invite token

## Contributing

When contributing to the auth system:

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include audit logging for new actions
4. Update tests for new features
5. Document security implications
6. Test role-based access scenarios

## Support

For support with the authentication system:

1. Check this documentation first
2. Review the test scenarios in `auth-test-utils.ts`
3. Use the AuthTestRunner for debugging
4. Check Supabase dashboard for backend issues
5. Review audit logs for security events

---

**Note**: This authentication system is production-ready but should be reviewed by security professionals before deployment to production environments handling sensitive data.