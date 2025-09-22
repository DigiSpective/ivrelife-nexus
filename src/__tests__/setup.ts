/**
 * Test Setup and Configuration
 * 
 * Global test setup including mocks, test utilities, and environment configuration
 * for comprehensive authentication system testing.
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

// Global setup for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto.subtle for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    ...webcrypto,
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }
});

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  ...localStorageMock
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch for HTTP requests
global.fetch = jest.fn();

// Default fetch implementation for tests
const mockFetch = (url: string, options?: RequestInit) => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.parse(options.body as string) : null;

  // Mock Supabase auth endpoints
  if (url.includes('/auth/v1/token')) {
    if (method === 'POST') {
      if (body?.grant_type === 'password') {
        // Mock sign in
        if (body.email === 'test@example.com' && body.password === 'TestPassword123!') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'mock.access.token',
              refresh_token: 'mock.refresh.token',
              expires_in: 3600,
              token_type: 'bearer',
              user: {
                id: 'test-user-id',
                email: 'test@example.com',
                name: 'Test User',
                role: 'owner'
              }
            })
          } as Response);
        } else {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'invalid_credentials',
              error_description: 'Invalid login credentials'
            })
          } as Response);
        }
      }
    }
  }

  if (url.includes('/auth/v1/signup')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        access_token: 'mock.access.token',
        refresh_token: 'mock.refresh.token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'new-user-id',
          email: body?.email || 'newuser@example.com',
          name: 'New User',
          role: 'location_user'
        }
      })
    } as Response);
  }

  if (url.includes('/auth/v1/recover')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    } as Response);
  }

  if (url.includes('/auth/v1/user')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'owner'
      })
    } as Response);
  }

  if (url.includes('/auth/v1/logout')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    } as Response);
  }

  // Mock database operations
  if (url.includes('/rest/v1/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [], error: null })
    } as Response);
  }

  // Default response
  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: 'Not found' })
  } as Response);
};

(global.fetch as jest.Mock).mockImplementation(mockFetch);

// Mock toast notifications
jest.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock Supabase client for testing
jest.mock('../lib/supabase-client', () => ({
  createSupabaseClient: () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { 
          user: { id: 'test-user', email: 'test@example.com' }, 
          session: { access_token: 'token', expires_at: Date.now() + 3600000 }
        },
        error: null
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { 
          user: { id: 'new-user', email: 'newuser@example.com' },
          session: { access_token: 'token', expires_at: Date.now() + 3600000 }
        },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'new-token' } },
        error: null
      }),
      setAuth: jest.fn()
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null })
    }),
    rpc: jest.fn().mockResolvedValue({ data: false, error: null })
  }),
  createSupabaseServerClient: () => ({
    // Same as client but for server-side operations
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }),
      setAuth: jest.fn()
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null })
    }),
    rpc: jest.fn().mockResolvedValue({ data: false, error: null })
  }),
  createSupabaseTestClient: () => ({
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null })
    }
  })
}));

// Test utilities
export const waitFor = async (callback: () => void | Promise<void>, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`waitFor timeout after ${timeout}ms`);
};

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

export const advanceTimersByTime = (time: number) => {
  jest.advanceTimersByTime(time);
  return flushPromises();
};

// Custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toHaveBeenCalledWithSecurePayload(received: jest.Mock, expectedPayload: any) {
    const calls = received.mock.calls;
    const pass = calls.some(call => {
      const payload = call[0];
      // Check that payload doesn't contain sensitive information
      const payloadString = JSON.stringify(payload);
      return !payloadString.includes('password') && 
             !payloadString.includes('token') &&
             Object.keys(expectedPayload).every(key => 
               payload[key] === expectedPayload[key]
             );
    });

    if (pass) {
      return {
        message: () => `expected mock not to have been called with secure payload`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected mock to have been called with secure payload`,
        pass: false,
      };
    }
  }
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toHaveBeenCalledWithSecurePayload(expectedPayload: any): R;
    }
  }
}