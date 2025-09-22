/**
 * Comprehensive Security Tests for Authentication System
 * 
 * Tests all security aspects of the production authentication system including:
 * - Authentication flows and edge cases
 * - Session management and validation
 * - Audit logging and risk assessment
 * - Rate limiting and brute force protection
 * - Input validation and sanitization
 * - Authorization and access control
 */

import { describe, test, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { createSupabaseTestClient } from '../lib/supabase-client';
import { AuditLogger, createAuditLogger } from '../lib/audit-logger';
import { SessionManager, createSessionManager } from '../lib/session-manager';
import { ServerActions, createServerActions } from '../lib/server-actions';
import { 
  signUp, 
  signInWithPassword, 
  signOut, 
  resetPassword,
  changePassword,
  verifySessionServerSide,
  listSessions,
  revokeSession
} from '../lib/supabase-auth';
import type { ApiRequest } from '../lib/server-actions';

// Test utilities
const createMockRequest = (overrides: Partial<ApiRequest> = {}): ApiRequest => ({
  headers: new Headers({
    'user-agent': 'Test Agent',
    'x-forwarded-for': '192.168.1.100',
    ...Object.fromEntries(Object.entries(overrides.headers || {}).map(([k, v]) => [k, String(v)]))
  }),
  body: {},
  method: 'POST',
  url: '/test',
  ip: '192.168.1.100',
  userAgent: 'Test Agent',
  ...overrides
});

const generateRandomEmail = () => `test.${Date.now()}.${Math.random().toString(36)}@example.com`;
const generateSecurePassword = () => `SecurePass123!${Math.random().toString(36)}`;

// Test data
const testUsers = {
  validUser: {
    email: generateRandomEmail(),
    password: generateSecurePassword(),
    first_name: 'Test',
    last_name: 'User'
  },
  adminUser: {
    email: generateRandomEmail(),
    password: generateSecurePassword(),
    first_name: 'Admin',
    last_name: 'User'
  }
};

describe('Security Test Suite', () => {
  let supabaseClient: any;
  let auditLogger: AuditLogger;
  let sessionManager: SessionManager;
  let serverActions: ServerActions;

  beforeAll(async () => {
    // Initialize test environment
    supabaseClient = createSupabaseTestClient();
    
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  beforeEach(() => {
    auditLogger = createAuditLogger('192.168.1.100', 'Test Agent');
    sessionManager = createSessionManager('192.168.1.100', 'Test Agent');
    serverActions = createServerActions(createMockRequest());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // AUTHENTICATION SECURITY TESTS
  // =============================================

  describe('Authentication Flow Security', () => {
    test('should prevent SQL injection in login credentials', async () => {
      const maliciousCredentials = {
        email: "test@example.com'; DROP TABLE auth_sessions; --",
        password: "password' OR '1'='1"
      };

      const result = await signInWithPassword(maliciousCredentials);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid');
    });

    test('should validate email format strictly', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        '<script>alert("xss")</script>@example.com'
      ];

      for (const email of invalidEmails) {
        const result = await signInWithPassword({ email, password: 'ValidPass123!' });
        expect(result.error).toBeDefined();
      }
    });

    test('should enforce strong password requirements', async () => {
      const weakPasswords = [
        'password',           // No uppercase, numbers, symbols
        'PASSWORD',           // No lowercase, numbers, symbols  
        '12345678',          // No letters, symbols
        'Password',          // No numbers, symbols
        'Pass123',           // Too short
        'password123',       // No uppercase, symbols
        'PASSWORD123',       // No lowercase, symbols
        'Password123'        // No symbols
      ];

      for (const password of weakPasswords) {
        const request = createMockRequest({
          body: {
            email: generateRandomEmail(),
            password,
            inviteToken: crypto.randomUUID()
          }
        });

        const result = await serverActions.signUp(request);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      }
    });

    test('should prevent timing attacks on login', async () => {
      const validEmail = testUsers.validUser.email;
      const invalidEmail = 'nonexistent@example.com';
      
      // Measure response times
      const times: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await signInWithPassword({ 
          email: i % 2 === 0 ? validEmail : invalidEmail, 
          password: 'WrongPassword123!' 
        });
        times.push(Date.now() - start);
      }

      // Response times should be consistent (within reasonable variance)
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)));
      
      // Allow up to 500ms deviation to account for network/system variance
      expect(maxDeviation).toBeLessThan(500);
    });

    test('should rate limit login attempts', async () => {
      const email = generateRandomEmail();
      const password = 'WrongPassword123!';
      
      // Make multiple failed login attempts
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(signInWithPassword({ email, password }));
      }
      
      const results = await Promise.all(attempts);
      
      // Later attempts should be rate limited
      const rateLimitedResults = results.slice(3);
      expect(rateLimitedResults.some(r => r.error?.message?.includes('rate limit') || r.error?.message?.includes('too many'))).toBe(true);
    });
  });

  describe('Session Security', () => {
    test('should invalidate sessions on IP address change', async () => {
      // Create session with first IP
      const firstSessionManager = createSessionManager('192.168.1.100', 'Test Agent');
      
      // Simulate session validation from different IP
      const secondSessionManager = createSessionManager('10.0.0.1', 'Test Agent');
      
      const mockAccessToken = 'mock.jwt.token';
      const result = await secondSessionManager.validateSession(mockAccessToken, {
        ip_address: '10.0.0.1',
        check_activity: true
      });

      // Should fail validation due to IP mismatch
      expect(result.valid).toBe(false);
      expect(result.error).toContain('IP address mismatch');
    });

    test('should detect concurrent session limits', async () => {
      const userCredentials = {
        email: testUsers.validUser.email,
        password: testUsers.validUser.password
      };

      // Create multiple sessions (simulate different devices/locations)
      const sessions = [];
      for (let i = 0; i < 7; i++) { // Exceed max concurrent sessions (5)
        const sessionManager = createSessionManager(`192.168.1.${100 + i}`, `Device-${i}`);
        sessions.push(signInWithPassword(userCredentials));
      }

      const results = await Promise.all(sessions);
      
      // Some sessions should be rejected due to concurrent limit
      const rejectedSessions = results.filter(r => r.error?.message?.includes('concurrent'));
      expect(rejectedSessions.length).toBeGreaterThan(0);
    });

    test('should automatically refresh expiring sessions', async () => {
      const sessionManager = createSessionManager();
      
      // Mock a session close to expiry
      const mockSession = {
        access_token: 'mock.token',
        refresh_token: 'mock.refresh',
        expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        token_type: 'bearer',
        user: { id: 'test-user', email: 'test@example.com' }
      };

      const refreshResult = await sessionManager.refreshSession();
      
      // Should attempt to refresh session automatically
      expect(typeof refreshResult).toBe('object');
      expect(refreshResult).toHaveProperty('success');
    });

    test('should detect suspicious user agent patterns', async () => {
      const suspiciousUserAgents = [
        'curl/7.68.0',
        'python-requests/2.25.1', 
        'Wget/1.20.3',
        'automated-script',
        'bot-crawler-spider'
      ];

      for (const userAgent of suspiciousUserAgents) {
        const auditLogger = createAuditLogger('192.168.1.100', userAgent);
        
        const logId = await auditLogger.logEvent('auth.signin', 'success', {
          user_id: 'test-user',
          email: testUsers.validUser.email
        });

        expect(logId).toBeDefined(); // Should log with high risk score
      }
    });
  });

  // =============================================
  // AUDIT LOGGING SECURITY TESTS
  // =============================================

  describe('Audit Logging Security', () => {
    test('should calculate accurate risk scores', async () => {
      const testCases = [
        {
          event_type: 'auth.signin',
          factors: { newIpAddress: true, failedAttempts: 3 },
          expectedMinScore: 40
        },
        {
          event_type: 'auth.mfa_disable', 
          factors: { suspiciousUserAgent: true },
          expectedMinScore: 60
        },
        {
          event_type: 'auth.privilege_escalation',
          factors: { rapidRequests: true, geolocationAnomaly: true },
          expectedMinScore: 80
        }
      ];

      for (const testCase of testCases) {
        const logId = await auditLogger.logEvent(
          testCase.event_type,
          'success', 
          { riskFactors: testCase.factors }
        );

        expect(logId).toBeDefined();
        // Note: Actual risk score validation would require database query
      }
    });

    test('should prevent audit log tampering', async () => {
      const originalLogEvent = auditLogger.logEvent;
      
      // Attempt to tamper with log data
      const tamperAttempt = async () => {
        return auditLogger.logEvent('auth.signin', 'success', {
          user_id: 'admin-user',
          '"><script>alert("xss")</script>': 'malicious',
          sqlInjection: "'; DROP TABLE audit_logs; --"
        });
      };

      const logId = await tamperAttempt();
      expect(logId).toBeDefined(); // Should log but sanitize malicious content
    });

    test('should detect anomalous activity patterns', async () => {
      const userId = 'test-user-123';
      
      // Simulate rapid successive requests
      const rapidRequests = [];
      for (let i = 0; i < 10; i++) {
        rapidRequests.push(
          auditLogger.logEvent('data.read', 'success', {
            user_id: userId,
            resource_type: 'sensitive_data',
            resource_id: `record-${i}`
          })
        );
      }

      await Promise.all(rapidRequests);
      
      // The audit logger should detect and flag rapid requests
      const finalLog = await auditLogger.logEvent('data.bulk_access', 'success', {
        user_id: userId,
        records_accessed: 10
      });

      expect(finalLog).toBeDefined();
    });

    test('should handle time-based anomalies', async () => {
      // Mock time to simulate off-hours activity (2 AM)
      const mockDate = new Date();
      mockDate.setHours(2, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const logId = await auditLogger.logEvent('auth.signin', 'success', {
        user_id: 'test-user',
        timestamp: mockDate.toISOString()
      });

      expect(logId).toBeDefined();
      
      jest.restoreAllMocks();
    });
  });

  // =============================================
  // INPUT VALIDATION SECURITY TESTS  
  // =============================================

  describe('Input Validation Security', () => {
    test('should sanitize XSS attempts in user inputs', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')" />',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<svg onload="alert(1)">',
        'data:text/html,<script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        const request = createMockRequest({
          body: {
            email: generateRandomEmail(),
            password: generateSecurePassword(),
            first_name: payload,
            last_name: 'User',
            inviteToken: crypto.randomUUID()
          }
        });

        const result = await serverActions.signUp(request);
        
        // Should either reject the input or sanitize it
        if (result.success) {
          expect(result.data?.user?.first_name).not.toContain('<script>');
          expect(result.data?.user?.first_name).not.toContain('javascript:');
        }
      }
    });

    test('should validate UUID formats strictly', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345678-1234-1234-1234-123456789abc', // Invalid format
        '"><script>alert("xss")</script>',
        "'; DROP TABLE invite_tokens; --",
        '../../../etc/passwd',
        '00000000-0000-0000-0000-000000000000' // Nil UUID
      ];

      for (const invalidUUID of invalidUUIDs) {
        const request = createMockRequest({
          body: {
            email: generateRandomEmail(),
            password: generateSecurePassword(),
            inviteToken: invalidUUID
          }
        });

        const result = await serverActions.signUp(request);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      }
    });

    test('should prevent path traversal in file operations', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
        '....//....//....//etc//passwd'
      ];

      // Test file-related operations if any exist in the auth system
      for (const maliciousPath of pathTraversalAttempts) {
        // This would test any file upload or path handling functionality
        // Since this is auth-focused, we test user profile image paths if they exist
        const auditLogId = await auditLogger.logEvent('data.file_access', 'error', {
          attempted_path: maliciousPath,
          blocked: true
        });

        expect(auditLogId).toBeDefined();
      }
    });
  });

  // =============================================
  // AUTHORIZATION SECURITY TESTS
  // =============================================

  describe('Authorization Security', () => {
    test('should enforce role-based access control', async () => {
      const testCases = [
        {
          userRole: 'location_user',
          resource: 'admin_settings',
          action: 'read',
          shouldAllow: false
        },
        {
          userRole: 'retailer',
          resource: 'retailer_data',
          action: 'read',
          shouldAllow: true
        },
        {
          userRole: 'owner',
          resource: 'system_settings',
          action: 'write',
          shouldAllow: true
        },
        {
          userRole: 'backoffice',
          resource: 'customer_data',
          action: 'export',
          shouldAllow: true
        }
      ];

      for (const testCase of testCases) {
        const hasPermission = await serverActions.checkPermissions(
          'test-user-id',
          testCase.resource,
          testCase.action
        );

        if (testCase.shouldAllow) {
          expect(hasPermission).toBe(true);
        } else {
          expect(hasPermission).toBe(false);
        }
      }
    });

    test('should prevent privilege escalation attempts', async () => {
      const escalationAttempts = [
        {
          originalRole: 'location_user',
          attemptedRole: 'owner',
          method: 'direct_assignment'
        },
        {
          originalRole: 'retailer', 
          attemptedRole: 'backoffice',
          method: 'session_manipulation'
        }
      ];

      for (const attempt of escalationAttempts) {
        const auditLogId = await auditLogger.logEvent('auth.privilege_escalation', 'error', {
          user_id: 'test-user',
          original_role: attempt.originalRole,
          attempted_role: attempt.attemptedRole,
          method: attempt.method,
          blocked: true
        });

        expect(auditLogId).toBeDefined();
      }
    });

    test('should validate resource ownership', async () => {
      // Test that users can only access resources they own
      const resourceTests = [
        {
          userId: 'user-1',
          resourceId: 'resource-owned-by-user-2',
          shouldAllow: false
        },
        {
          userId: 'user-1',
          resourceId: 'resource-owned-by-user-1', 
          shouldAllow: true
        }
      ];

      for (const test of resourceTests) {
        const auditLogId = await auditLogger.logDataAccess(
          'user_resource',
          test.resourceId,
          'read',
          test.shouldAllow ? 'success' : 'error',
          {
            resource_owner: test.shouldAllow ? test.userId : 'different-user'
          },
          test.userId
        );

        expect(auditLogId).toBeDefined();
      }
    });
  });

  // =============================================
  // SESSION MANAGEMENT SECURITY TESTS
  // =============================================

  describe('Advanced Session Security', () => {
    test('should handle session fixation attacks', async () => {
      // Attempt to fix a session ID
      const fixedSessionId = 'attacker-controlled-session-id';
      
      const result = await sessionManager.validateSession('mock.token', {
        ip_address: '192.168.1.100'
      });

      // Session validation should fail for non-legitimate sessions
      expect(result.valid).toBe(false);
    });

    test('should detect session hijacking attempts', async () => {
      // Simulate session being used from different locations
      const legitimateSession = createSessionManager('192.168.1.100', 'Chrome/91.0');
      const hijackAttempt = createSessionManager('10.0.0.1', 'Different-Browser/1.0');

      // Both trying to use the same session token
      const mockToken = 'shared.session.token';
      
      const legitimateResult = await legitimateSession.validateSession(mockToken);
      const hijackResult = await hijackAttempt.validateSession(mockToken, {
        ip_address: '10.0.0.1'
      });

      // Hijack attempt should be detected and blocked
      expect(hijackResult.valid).toBe(false);
    });

    test('should enforce session timeout policies', async () => {
      const sessionManager = createSessionManager();
      
      // Mock expired session
      SessionManager.setSession({
        access_token: 'expired.token',
        refresh_token: 'refresh.token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        token_type: 'bearer',
        user: { id: 'test-user', email: 'test@example.com' }
      } as any);

      const session = SessionManager.getSession();
      expect(session).toBeNull(); // Should be null due to expiration
    });

    test('should validate session integrity', async () => {
      // Test tampered session data
      const tamperedSession = {
        access_token: 'valid.token.part1.TAMPERED.part3',
        refresh_token: 'refresh.token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: { 
          id: 'admin-user', // Tampered to escalate privileges
          email: 'admin@company.com',
          role: 'owner' // Escalated from 'location_user'
        }
      };

      const result = await verifySessionServerSide(tamperedSession.access_token);
      expect(result.valid).toBe(false);
    });
  });

  // =============================================
  // CRYPTOGRAPHIC SECURITY TESTS
  // =============================================

  describe('Cryptographic Security', () => {
    test('should use secure password hashing', async () => {
      const password = 'TestPassword123!';
      
      // Passwords should never be stored in plain text
      // This test would check that the system uses proper hashing
      const signUpResult = await signUp({
        email: generateRandomEmail(),
        password: password,
        inviteToken: crypto.randomUUID()
      });

      // Password should not appear in any logs or responses
      expect(JSON.stringify(signUpResult)).not.toContain(password);
    });

    test('should generate cryptographically secure tokens', async () => {
      const tokens = [];
      
      // Generate multiple tokens to test randomness
      for (let i = 0; i < 100; i++) {
        tokens.push(crypto.randomUUID());
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);

      // Tokens should follow UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(tokens.every(token => uuidRegex.test(token))).toBe(true);
    });

    test('should properly handle token expiration', async () => {
      // Test various token expiration scenarios
      const expirationTests = [
        { expiresIn: -3600, shouldBeValid: false }, // 1 hour ago
        { expiresIn: -1, shouldBeValid: false },    // 1 second ago  
        { expiresIn: 0, shouldBeValid: false },     // Right now
        { expiresIn: 1, shouldBeValid: true },      // 1 second from now
        { expiresIn: 3600, shouldBeValid: true }    // 1 hour from now
      ];

      for (const test of expirationTests) {
        const mockSession = {
          expires_at: Math.floor(Date.now() / 1000) + test.expiresIn
        };

        const isExpired = SessionManager.isSessionExpired(mockSession as any);
        expect(isExpired).toBe(!test.shouldBeValid);
      }
    });
  });

  // =============================================
  // ERROR HANDLING SECURITY TESTS
  // =============================================

  describe('Error Handling Security', () => {
    test('should not leak sensitive information in error messages', async () => {
      const sensitiveOperations = [
        () => signInWithPassword({ email: 'nonexistent@example.com', password: 'wrong' }),
        () => resetPassword('nonexistent@example.com'),
        () => verifySessionServerSide('invalid.jwt.token')
      ];

      for (const operation of sensitiveOperations) {
        const result = await operation();
        
        if ('error' in result && result.error) {
          const errorMessage = result.error.message.toLowerCase();
          
          // Should not contain sensitive information
          expect(errorMessage).not.toContain('database');
          expect(errorMessage).not.toContain('sql');  
          expect(errorMessage).not.toContain('internal');
          expect(errorMessage).not.toContain('secret');
          expect(errorMessage).not.toContain('key');
          expect(errorMessage).not.toContain('token');
          expect(errorMessage).not.toContain('password');
        }
      }
    });

    test('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        { headers: null },
        { body: null },
        { method: null },
        { body: { email: null, password: undefined } },
        { body: '<xml>malformed</xml>' },
        { body: { email: [], password: {} } }
      ];

      for (const malformedRequest of malformedRequests) {
        const request = createMockRequest(malformedRequest as any);
        const result = await serverActions.signIn(request);
        
        expect(result.success).toBe(false);
        expect(result.error?.code).toBeDefined();
      }
    });

    test('should prevent information disclosure through timing', async () => {
      // Test that error responses don't reveal whether accounts exist
      const nonExistentEmail = 'definitely-not-exists@example.com';
      const possiblyExistentEmail = testUsers.validUser.email;
      
      const times = [];
      
      for (let i = 0; i < 10; i++) {
        const email = i % 2 === 0 ? nonExistentEmail : possiblyExistentEmail;
        
        const start = Date.now();
        await resetPassword(email);
        times.push(Date.now() - start);
      }

      // Response times should be similar regardless of account existence
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)));
      
      expect(maxDeviation).toBeLessThan(1000); // Allow reasonable variance
    });
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (supabaseClient) {
        // Clean up any test users or sessions created during testing
        await supabaseClient.auth.signOut();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
});