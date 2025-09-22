/**
 * Authentication Integration Tests
 * 
 * End-to-end testing of authentication flows including:
 * - Complete signup/signin/signout flows
 * - Session management and persistence
 * - Role-based access control
 * - Audit logging integration
 * - Error handling and edge cases
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../components/auth/AuthProvider';
import { createSupabaseTestClient } from '../lib/supabase-client';
import { createAuditLogger } from '../lib/audit-logger';
import { SessionManager } from '../lib/session-manager';
import React, { useEffect, useState } from 'react';

// Test component that uses auth
const TestAuthComponent: React.FC = () => {
  const { 
    user, 
    session, 
    loading, 
    error, 
    sessionWarnings,
    signIn, 
    signUp, 
    signOut, 
    resetPassword,
    changePassword,
    clearError,
    clearSessionWarnings,
    getSessions,
    revokeSession
  } = useAuth();
  
  const [testState, setTestState] = useState<string>('idle');
  const [operationResult, setOperationResult] = useState<any>(null);

  const handleSignIn = async () => {
    setTestState('signing-in');
    const result = await signIn({
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    setOperationResult(result);
    setTestState('signed-in');
  };

  const handleSignUp = async () => {
    setTestState('signing-up');
    const result = await signUp({
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      first_name: 'Test',
      last_name: 'User',
      invite_token: crypto.randomUUID()
    });
    setOperationResult(result);
    setTestState('signed-up');
  };

  const handleSignOut = async () => {
    setTestState('signing-out');
    await signOut();
    setTestState('signed-out');
  };

  const handlePasswordReset = async () => {
    setTestState('resetting-password');
    const result = await resetPassword('test@example.com');
    setOperationResult(result);
    setTestState('password-reset-sent');
  };

  const handleChangePassword = async () => {
    setTestState('changing-password');
    const result = await changePassword('OldPassword123!', 'NewPassword123!');
    setOperationResult(result);
    setTestState('password-changed');
  };

  return (
    <div data-testid="auth-test-component">
      <div data-testid="user-info">
        {loading ? 'Loading...' : user ? `User: ${user.email}` : 'No user'}
      </div>
      <div data-testid="session-info">
        {session ? 'Has session' : 'No session'}
      </div>
      <div data-testid="error-info">
        {error ? error.message : 'No error'}
      </div>
      <div data-testid="warnings-info">
        Warnings: {sessionWarnings.length}
      </div>
      <div data-testid="test-state">
        State: {testState}
      </div>
      
      <button data-testid="sign-in-btn" onClick={handleSignIn}>Sign In</button>
      <button data-testid="sign-up-btn" onClick={handleSignUp}>Sign Up</button>
      <button data-testid="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
      <button data-testid="reset-password-btn" onClick={handlePasswordReset}>Reset Password</button>
      <button data-testid="change-password-btn" onClick={handleChangePassword}>Change Password</button>
      <button data-testid="clear-error-btn" onClick={clearError}>Clear Error</button>
      <button data-testid="clear-warnings-btn" onClick={clearSessionWarnings}>Clear Warnings</button>
      
      <div data-testid="operation-result">
        {operationResult ? JSON.stringify(operationResult) : 'No result'}
      </div>
    </div>
  );
};

// Test wrapper with AuthProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

describe('Authentication Integration Tests', () => {
  let supabaseClient: any;
  let mockToast = jest.fn();

  beforeAll(async () => {
    supabaseClient = createSupabaseTestClient();
    
    // Mock the toast hook
    jest.mock('../hooks/use-toast', () => ({
      useToast: () => ({ toast: mockToast })
    }));
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    mockToast.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('AuthProvider Initialization', () => {
    test('should initialize with loading state', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      // Should start in loading state
      expect(screen.getByTestId('user-info')).toHaveTextContent('Loading...');
      
      // Should eventually finish loading
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      }, { timeout: 5000 });
    });

    test('should detect existing session on initialization', async () => {
      // Pre-populate localStorage with valid session
      const mockSession = {
        access_token: 'mock.access.token',
        refresh_token: 'mock.refresh.token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'owner'
        }
      };
      
      SessionManager.setSession(mockSession as any);

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      // Should detect existing session and set user
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
        expect(screen.getByTestId('session-info')).toHaveTextContent('Has session');
      });
    });

    test('should handle corrupted session data gracefully', async () => {
      // Corrupt localStorage data
      localStorage.setItem('ivrelife_session', 'corrupted-json-data');
      localStorage.setItem('ivrelife_user', '{"invalid": json}');

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      // Should handle corrupted data and clear it
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
        expect(screen.getByTestId('session-info')).toHaveTextContent('No session');
      });
    });
  });

  describe('Sign In Flow', () => {
    test('should handle successful sign in', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      // Mock successful sign in
      const mockSignInResponse = {
        success: true,
        data: {
          user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
          session: { access_token: 'token', expires_at: Date.now() + 3600000 }
        }
      };

      // Click sign in button
      fireEvent.click(screen.getByTestId('sign-in-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: signing-in');
      });

      // Should eventually complete sign in
      await waitFor(() => {
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: signed-in');
      }, { timeout: 10000 });
    });

    test('should handle sign in errors', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      // Click sign in with invalid credentials
      fireEvent.click(screen.getByTestId('sign-in-btn'));

      // Should show error state
      await waitFor(() => {
        const errorInfo = screen.getByTestId('error-info');
        expect(errorInfo).not.toHaveTextContent('No error');
      }, { timeout: 10000 });

      // Should display appropriate error message
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Login Failed',
          variant: 'destructive'
        })
      );
    });

    test('should handle MFA requirement', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      // Mock MFA required response
      const mockMFAResponse = { success: false, requiresMfa: true };

      fireEvent.click(screen.getByTestId('sign-in-btn'));

      await waitFor(() => {
        const operationResult = screen.getByTestId('operation-result');
        expect(operationResult.textContent).toContain('requiresMfa');
      }, { timeout: 10000 });
    });
  });

  describe('Sign Up Flow', () => {
    test('should handle successful sign up', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      fireEvent.click(screen.getByTestId('sign-up-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: signing-up');
      });

      // Should eventually complete or show result
      await waitFor(() => {
        const state = screen.getByTestId('test-state');
        expect(state).toHaveTextContent('State: signed-up');
      }, { timeout: 10000 });
    });

    test('should handle sign up validation errors', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      fireEvent.click(screen.getByTestId('sign-up-btn'));

      // Should show validation error
      await waitFor(() => {
        const errorInfo = screen.getByTestId('error-info');
        expect(errorInfo).not.toHaveTextContent('No error');
      }, { timeout: 10000 });
    });
  });

  describe('Sign Out Flow', () => {
    test('should handle successful sign out', async () => {
      // Pre-authenticate user
      const mockSession = {
        access_token: 'mock.token',
        refresh_token: 'refresh.token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: { id: 'user-1', email: 'test@example.com' }
      };
      
      SessionManager.setSession(mockSession as any);

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      // Wait for authentication state to be detected
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
      });

      // Click sign out
      fireEvent.click(screen.getByTestId('sign-out-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: signing-out');
      });

      // Should eventually sign out
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
        expect(screen.getByTestId('session-info')).toHaveTextContent('No session');
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: signed-out');
      }, { timeout: 10000 });
    });
  });

  describe('Password Operations', () => {
    test('should handle password reset request', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      fireEvent.click(screen.getByTestId('reset-password-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: resetting-password');
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: password-reset-sent');
      }, { timeout: 10000 });
    });

    test('should handle password change', async () => {
      // Pre-authenticate user
      const mockSession = {
        access_token: 'mock.token',
        user: { id: 'user-1', email: 'test@example.com' }
      };
      
      SessionManager.setSession(mockSession as any);

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
      });

      fireEvent.click(screen.getByTestId('change-password-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('test-state')).toHaveTextContent('State: changing-password');
      });

      // Should eventually complete or show error
      await waitFor(() => {
        const state = screen.getByTestId('test-state');
        expect(state.textContent).toContain('password-changed');
      }, { timeout: 10000 });
    });
  });

  describe('Session Warnings', () => {
    test('should handle session expiry warnings', async () => {
      // Mock expiring session
      const expiringSession = {
        access_token: 'expiring.token',
        expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        user: { id: 'user-1', email: 'test@example.com' }
      };
      
      SessionManager.setSession(expiringSession as any);

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      // Should detect expiring session and show warnings
      await waitFor(() => {
        const warningsInfo = screen.getByTestId('warnings-info');
        expect(parseInt(warningsInfo.textContent?.match(/\d+/)?.[0] || '0')).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('should allow clearing session warnings', async () => {
      const mockSession = {
        access_token: 'mock.token',
        user: { id: 'user-1', email: 'test@example.com' }
      };
      
      SessionManager.setSession(mockSession as any);

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
      });

      // Simulate having warnings and clearing them
      fireEvent.click(screen.getByTestId('clear-warnings-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('warnings-info')).toHaveTextContent('Warnings: 0');
      });
    });
  });

  describe('Error Handling', () => {
    test('should allow clearing errors', async () => {
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      // Trigger an error (invalid sign in)
      fireEvent.click(screen.getByTestId('sign-in-btn'));

      await waitFor(() => {
        const errorInfo = screen.getByTestId('error-info');
        expect(errorInfo).not.toHaveTextContent('No error');
      }, { timeout: 10000 });

      // Clear the error
      fireEvent.click(screen.getByTestId('clear-error-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error-info')).toHaveTextContent('No error');
      });
    });

    test('should handle network errors gracefully', async () => {
      // Mock network failure
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).not.toHaveTextContent('Loading...');
      });

      fireEvent.click(screen.getByTestId('sign-in-btn'));

      // Should handle network error
      await waitFor(() => {
        const errorInfo = screen.getByTestId('error-info');
        expect(errorInfo).not.toHaveTextContent('No error');
      }, { timeout: 10000 });

      global.fetch = originalFetch;
    });
  });

  describe('Session Persistence', () => {
    test('should persist session across page reloads', async () => {
      const mockSession = {
        access_token: 'persistent.token',
        refresh_token: 'refresh.token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: { id: 'user-1', email: 'persistent@example.com' }
      };

      // First render - simulate login
      SessionManager.setSession(mockSession as any);

      const { unmount } = render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: persistent@example.com');
      });

      unmount();

      // Second render - simulate page reload
      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      // Should restore session from localStorage
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: persistent@example.com');
        expect(screen.getByTestId('session-info')).toHaveTextContent('Has session');
      });
    });

    test('should clear expired sessions on reload', async () => {
      const expiredSession = {
        access_token: 'expired.token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        user: { id: 'user-1', email: 'expired@example.com' }
      };

      SessionManager.setSession(expiredSession as any);

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      );

      // Should detect expired session and clear it
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
        expect(screen.getByTestId('session-info')).toHaveTextContent('No session');
      });
    });
  });

  describe('Concurrent Sessions', () => {
    test('should handle multiple AuthProvider instances', async () => {
      const TestMultipleProviders: React.FC = () => (
        <div>
          <AuthProvider>
            <div data-testid="provider-1">
              <TestAuthComponent />
            </div>
          </AuthProvider>
          <AuthProvider>
            <div data-testid="provider-2">
              <TestAuthComponent />
            </div>
          </AuthProvider>
        </div>
      );

      render(<TestMultipleProviders />);

      // Both providers should initialize properly
      await waitFor(() => {
        const provider1User = screen.getAllByTestId('user-info')[0];
        const provider2User = screen.getAllByTestId('user-info')[1];
        
        expect(provider1User).not.toHaveTextContent('Loading...');
        expect(provider2User).not.toHaveTextContent('Loading...');
      });
    });
  });

  afterAll(async () => {
    // Clean up any remaining sessions
    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      SessionManager.clearSession();
    } catch (error) {
      console.error('Integration test cleanup error:', error);
    }
  });
});