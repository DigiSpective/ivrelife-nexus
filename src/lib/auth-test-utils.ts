// Testing utilities for authentication flows
// This file provides helpers for testing the auth system

import { LoginCredentials, RegisterData, User } from '@/types';

// Test user credentials for different roles
export const TEST_CREDENTIALS = {
  owner: {
    email: 'admin@ivrelife.com',
    password: 'admin123'
  },
  backoffice: {
    email: 'backoffice@ivrelife.com',
    password: 'backoffice123'
  },
  retailer: {
    email: 'retailer@ivrelife.com',
    password: 'retailer123'
  },
  location_user: {
    email: 'location@ivrelife.com',
    password: 'location123'
  }
};

// Mock users for testing
export const MOCK_USERS: Record<string, User> = {
  owner: {
    id: 'user-owner-1',
    email: 'admin@ivrelife.com',
    name: 'System Owner',
    role: 'owner'
  },
  backoffice: {
    id: 'user-backoffice-1',
    email: 'backoffice@ivrelife.com',
    name: 'Back Office User',
    role: 'backoffice'
  },
  retailer: {
    id: 'user-retailer-1',
    email: 'retailer@ivrelife.com',
    name: 'Retailer User',
    role: 'retailer',
    retailer_id: 'retailer-123'
  },
  location_user: {
    id: 'user-location-1',
    email: 'location@ivrelife.com',
    name: 'Location User',
    role: 'location_user',
    retailer_id: 'retailer-123',
    location_id: 'location-456'
  }
};

// Test registration data
export const TEST_REGISTRATION: Record<string, RegisterData> = {
  new_owner: {
    email: 'new-owner@ivrelife.com',
    password: 'NewOwner123!',
    name: 'New Owner',
    role: 'owner'
  },
  new_retailer: {
    email: 'new-retailer@ivrelife.com',
    password: 'NewRetailer123!',
    name: 'New Retailer',
    role: 'retailer',
    retailer_id: 'retailer-789'
  },
  new_location: {
    email: 'new-location@ivrelife.com',
    password: 'NewLocation123!',
    name: 'New Location User',
    role: 'location_user',
    retailer_id: 'retailer-789',
    location_id: 'location-012'
  }
};

// Authentication test scenarios
export interface AuthTestScenario {
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  testData?: any;
}

export const AUTH_TEST_SCENARIOS: AuthTestScenario[] = [
  {
    name: 'Valid Login Flow',
    description: 'Test successful login with valid credentials',
    steps: [
      'Navigate to /auth/login',
      'Enter valid email and password',
      'Click Sign In button',
      'Verify redirect to appropriate dashboard'
    ],
    expectedResult: 'User is logged in and redirected to role-based dashboard',
    testData: TEST_CREDENTIALS.owner
  },
  {
    name: 'Invalid Login Flow',
    description: 'Test login with invalid credentials',
    steps: [
      'Navigate to /auth/login',
      'Enter invalid email or password',
      'Click Sign In button',
      'Verify error message is displayed'
    ],
    expectedResult: 'Error message displayed, user remains on login page',
    testData: { email: 'invalid@example.com', password: 'wrongpassword' }
  },
  {
    name: 'Registration Flow',
    description: 'Test user registration process',
    steps: [
      'Navigate to /auth/register',
      'Fill in registration form',
      'Click Create Account button',
      'Verify account creation and redirect'
    ],
    expectedResult: 'Account created successfully and user logged in',
    testData: TEST_REGISTRATION.new_location
  },
  {
    name: 'Invite Registration Flow',
    description: 'Test registration with invite token',
    steps: [
      'Navigate to /auth/register?token=invite123&email=user@example.com',
      'Verify invite data is pre-filled',
      'Complete registration form',
      'Click Create Account button',
      'Verify invite acceptance and redirect'
    ],
    expectedResult: 'User registered with invite data and logged in',
    testData: { 
      inviteToken: 'mock-invite-123',
      email: 'invited@ivrelife.com'
    }
  },
  {
    name: 'Password Reset Flow',
    description: 'Test password reset request',
    steps: [
      'Navigate to /auth/reset-password',
      'Enter email address',
      'Click Send Reset Link button',
      'Verify success message'
    ],
    expectedResult: 'Password reset email sent successfully',
    testData: { email: 'admin@ivrelife.com' }
  },
  {
    name: 'Session Expiry Flow',
    description: 'Test session expiration handling',
    steps: [
      'Log in successfully',
      'Wait for session to expire (or manually expire)',
      'Try to access protected route',
      'Verify redirect to login page'
    ],
    expectedResult: 'User redirected to login page when session expires'
  },
  {
    name: 'Role-Based Access Flow',
    description: 'Test role-based route protection',
    steps: [
      'Log in as location_user',
      'Try to access /retailers (owner/backoffice only)',
      'Verify access denied or redirect'
    ],
    expectedResult: 'Access denied for routes not allowed for user role',
    testData: TEST_CREDENTIALS.location_user
  },
  {
    name: 'Logout Flow',
    description: 'Test user logout process',
    steps: [
      'Log in successfully',
      'Navigate to /auth/logout or click logout button',
      'Verify session termination',
      'Try to access protected route',
      'Verify redirect to login'
    ],
    expectedResult: 'User logged out and redirected to login page'
  },
  {
    name: 'Session Warning Flow',
    description: 'Test session expiry warning',
    steps: [
      'Log in successfully',
      'Wait for session warning threshold (5 minutes before expiry)',
      'Verify warning banner appears',
      'Click Extend Session',
      'Verify session extended'
    ],
    expectedResult: 'Session warning shown and session can be extended'
  },
  {
    name: 'Audit Logging Flow',
    description: 'Test audit logging for auth events',
    steps: [
      'Perform login action',
      'Check audit logs table',
      'Verify login event recorded',
      'Perform logout action',
      'Verify logout event recorded'
    ],
    expectedResult: 'All auth events properly logged in audit_logs table'
  }
];

// Helper functions for testing

/**
 * Simulates a login attempt
 */
export const simulateLogin = (credentials: LoginCredentials) => {
  console.log('Simulating login with:', credentials);
  // This would be called by your test framework
  return {
    success: credentials.email === TEST_CREDENTIALS.owner.email && 
             credentials.password === TEST_CREDENTIALS.owner.password,
    user: credentials.email === TEST_CREDENTIALS.owner.email ? MOCK_USERS.owner : null
  };
};

/**
 * Simulates a registration attempt
 */
export const simulateRegistration = (data: RegisterData) => {
  console.log('Simulating registration with:', data);
  return {
    success: true,
    user: {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role,
      retailer_id: data.retailer_id,
      location_id: data.location_id
    }
  };
};

/**
 * Validates test environment setup
 */
export const validateTestEnvironment = () => {
  const checks = [
    {
      name: 'Supabase Configuration',
      check: () => !!import.meta.env.VITE_SUPABASE_URL,
      required: false
    },
    {
      name: 'Auth Provider Available',
      check: () => typeof window !== 'undefined',
      required: true
    },
    {
      name: 'Local Storage Available',
      check: () => typeof localStorage !== 'undefined',
      required: true
    },
    {
      name: 'Router Context Available',
      check: () => typeof window.location !== 'undefined',
      required: true
    }
  ];

  const results = checks.map(({ name, check, required }) => ({
    name,
    passed: check(),
    required
  }));

  const requiredPassed = results.filter(r => r.required).every(r => r.passed);
  
  return {
    allPassed: results.every(r => r.passed),
    requiredPassed,
    results
  };
};

/**
 * Gets expected redirect URL for role
 */
export const getExpectedRedirectForRole = (role: User['role']) => {
  switch (role) {
    case 'owner':
      return '/dashboard?view=owner';
    case 'backoffice':
      return '/dashboard?view=backoffice';
    case 'retailer':
      return '/dashboard?view=retailer';
    case 'location_user':
      return '/dashboard?view=location';
    default:
      return '/dashboard';
  }
};

/**
 * Validates that user has correct permissions for route
 */
export const validateRoutePermissions = (user: User, route: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    owner: ['*'], // All routes
    backoffice: ['/dashboard', '/orders', '/customers', '/products', '/shipping', '/claims', '/retailers', '/settings'],
    retailer: ['/dashboard', '/orders', '/customers', '/products', '/shipping', '/claims', '/settings'],
    location_user: ['/dashboard', '/orders', '/customers', '/shipping', '/claims']
  };

  const allowedRoutes = rolePermissions[user.role] || [];
  
  if (allowedRoutes.includes('*')) {
    return true;
  }

  return allowedRoutes.some(allowed => route.startsWith(allowed));
};

/**
 * Formats test results for display
 */
export const formatTestResults = (results: any[]) => {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = (passed / total * 100).toFixed(1);

  return {
    summary: `${passed}/${total} tests passed (${passRate}%)`,
    passed,
    total,
    passRate: parseFloat(passRate),
    results
  };
};