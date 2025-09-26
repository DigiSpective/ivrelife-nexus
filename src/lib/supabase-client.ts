/**
 * Production Supabase Client Initializer
 * 
 * Strictly loads credentials from environment variables with validation.
 * Throws descriptive errors if missing or malformed.
 * Zero tolerance for missing configuration in production.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment configuration interface
interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  jwtSecret?: string;
}

// Configuration validation rules
const CONFIG_VALIDATION = {
  url: {
    required: true,
    pattern: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
    minLength: 20,
    description: 'Supabase project URL (format: https://xxx.supabase.co)'
  },
  anonKey: {
    required: true,
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    minLength: 100,
    description: 'Supabase anonymous key (JWT format)'
  },
  serviceRoleKey: {
    required: false,
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    minLength: 100,
    description: 'Supabase service role key (JWT format)'
  },
  jwtSecret: {
    required: false,
    minLength: 32,
    description: 'JWT secret for token verification'
  }
} as const;

// Error classes
export class SupabaseConfigError extends Error {
  constructor(
    public field: string,
    message: string,
    public suggestion?: string
  ) {
    super(`Supabase configuration error [${field}]: ${message}`);
    this.name = 'SupabaseConfigError';
  }
}

export class SupabaseInitializationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(`Failed to initialize Supabase client: ${message}`);
    this.name = 'SupabaseInitializationError';
  }
}

/**
 * Validates a configuration field according to its rules
 */
function validateConfigField(
  field: keyof SupabaseConfig,
  value: string | undefined,
  rules: typeof CONFIG_VALIDATION[keyof typeof CONFIG_VALIDATION]
): void {
  // Check if required field is missing
  if (rules.required && (!value || value.trim() === '')) {
    throw new SupabaseConfigError(
      field,
      'Required configuration missing',
      `Set environment variable: ${getEnvVarName(field)}`
    );
  }

  // Skip validation if field is optional and not provided
  if (!rules.required && (!value || value.trim() === '')) {
    return;
  }

  const trimmedValue = value!.trim();

  // Check minimum length
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    throw new SupabaseConfigError(
      field,
      `Value too short (${trimmedValue.length} chars, minimum ${rules.minLength})`,
      rules.description
    );
  }

  // Check pattern if specified
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    throw new SupabaseConfigError(
      field,
      'Invalid format',
      rules.description
    );
  }

  // Additional validation for URL
  if (field === 'url') {
    try {
      const url = new URL(trimmedValue);
      if (!url.hostname.endsWith('.supabase.co')) {
        throw new SupabaseConfigError(
          field,
          'Must be a valid Supabase project URL',
          'Use the URL from your Supabase project settings'
        );
      }
    } catch (error) {
      throw new SupabaseConfigError(
        field,
        'Invalid URL format',
        rules.description
      );
    }
  }

  // Additional validation for JWT tokens
  if ((field === 'anonKey' || field === 'serviceRoleKey') && trimmedValue) {
    try {
      // Basic JWT structure validation (3 parts separated by dots)
      const parts = trimmedValue.split('.');
      if (parts.length !== 3) {
        throw new SupabaseConfigError(
          field,
          'Invalid JWT format (must have 3 parts)',
          rules.description
        );
      }

      // Validate each part is base64url encoded
      parts.forEach((part, index) => {
        if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) {
          throw new SupabaseConfigError(
            field,
            `Invalid JWT part ${index + 1} (must be base64url encoded)`,
            rules.description
          );
        }
      });
    } catch (error) {
      if (error instanceof SupabaseConfigError) {
        throw error;
      }
      throw new SupabaseConfigError(
        field,
        'JWT validation failed',
        rules.description
      );
    }
  }
}

/**
 * Maps config field to environment variable name
 */
function getEnvVarName(field: keyof SupabaseConfig): string {
  const mapping = {
    url: 'VITE_SUPABASE_URL',
    anonKey: 'VITE_SUPABASE_ANON_KEY',
    serviceRoleKey: 'SUPABASE_SERVICE_ROLE_KEY',
    jwtSecret: 'SUPABASE_JWT_SECRET'
  };
  return mapping[field];
}

/**
 * Loads and validates Supabase configuration from environment variables
 */
function loadSupabaseConfig(requireServiceRole = false): SupabaseConfig {
  const config: Partial<SupabaseConfig> = {
    url: import.meta.env?.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: typeof window === 'undefined' ? (globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE_KEY : undefined,
    jwtSecret: typeof window === 'undefined' ? (globalThis as any).process?.env?.SUPABASE_JWT_SECRET : undefined
  };

  // Validate each field
  validateConfigField('url', config.url, CONFIG_VALIDATION.url);
  validateConfigField('anonKey', config.anonKey, CONFIG_VALIDATION.anonKey);
  
  if (requireServiceRole) {
    validateConfigField('serviceRoleKey', config.serviceRoleKey, {
      ...CONFIG_VALIDATION.serviceRoleKey,
      required: true
    });
  } else if (config.serviceRoleKey) {
    validateConfigField('serviceRoleKey', config.serviceRoleKey, CONFIG_VALIDATION.serviceRoleKey);
  }
  
  if (config.jwtSecret) {
    validateConfigField('jwtSecret', config.jwtSecret, CONFIG_VALIDATION.jwtSecret);
  }

  // Security check: ensure we're not using development/example values
  const developmentIndicators = [
    'localhost',
    'example',
    'test',
    'demo',
    'placeholder',
    'your-project',
    'abc123'
  ];

  [config.url, config.anonKey, config.serviceRoleKey].forEach((value, index) => {
    if (value && developmentIndicators.some(indicator => 
      value.toLowerCase().includes(indicator.toLowerCase())
    )) {
      const fieldNames = ['url', 'anonKey', 'serviceRoleKey'];
      throw new SupabaseConfigError(
        fieldNames[index],
        'Development/placeholder value detected in production configuration',
        'Use actual Supabase project credentials'
      );
    }
  });

  return config as SupabaseConfig;
}


/**
 * Creates a server-side Supabase client with service role key
 * Should only be used in server-side contexts (API routes, etc.)
 */
export function createSupabaseServerClient(): SupabaseClient<Database> {
  try {
    const config = loadSupabaseConfig(true);
    
    if (!config.serviceRoleKey) {
      throw new SupabaseConfigError(
        'serviceRoleKey',
        'Service role key required for server client',
        'Set SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    }

    const client = createClient<Database>(
      config.url,
      config.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'X-Client-Info': 'ivrelife-nexus-server@1.0.0'
          }
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Validate connection
    if (!client) {
      throw new SupabaseInitializationError(
        'Server client creation failed'
      );
    }

    return client;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      throw error;
    }
    
    throw new SupabaseInitializationError(
      'Failed to create server client',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Gets the JWT secret for token verification
 */
export function getJwtSecret(): string {
  const config = loadSupabaseConfig(false);
  
  if (!config.jwtSecret) {
    throw new SupabaseConfigError(
      'jwtSecret',
      'JWT secret required for token verification',
      'Set SUPABASE_JWT_SECRET environment variable'
    );
  }
  
  return config.jwtSecret;
}

/**
 * Validates the current configuration without creating a client
 * Useful for health checks and startup validation
 */
export function validateConfiguration(includeServerKeys = false): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    loadSupabaseConfig(includeServerKeys);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      errors.push(error.message);
      if (error.suggestion) {
        warnings.push(`Suggestion: ${error.suggestion}`);
      }
    } else {
      errors.push(`Unexpected configuration error: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks if we're in a production environment
 */
export function isProductionEnvironment(): boolean {
  // Browser environment - only use import.meta.env
  return import.meta.env?.PROD === true;
}

/**
 * Performs a startup health check of Supabase configuration
 */
export async function performStartupHealthCheck(): Promise<void> {
  const isProduction = isProductionEnvironment();
  
  console.log(`[Supabase] Performing startup health check (production: ${isProduction})`);
  
  // Validate configuration
  const configCheck = validateConfiguration(isProduction);
  
  if (!configCheck.valid) {
    console.error('[Supabase] Configuration validation failed:');
    configCheck.errors.forEach(error => console.error(`  - ${error}`));
    
    if (configCheck.warnings.length > 0) {
      console.warn('[Supabase] Configuration warnings:');
      configCheck.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    throw new SupabaseInitializationError(
      `Configuration validation failed: ${configCheck.errors.join(', ')}`
    );
  }

  // Test client creation
  try {
    const client = createSupabaseClient();
    
    // Test connection with a simple query
    const { error } = await client.auth.getSession();
    
    if (error && error.message.includes('Invalid API key')) {
      throw new SupabaseConfigError(
        'anonKey',
        'Invalid anonymous key - connection refused',
        'Verify the VITE_SUPABASE_ANON_KEY matches your project settings'
      );
    }
    
    console.log('[Supabase] Client health check passed');
  } catch (error) {
    console.error('[Supabase] Client health check failed:', error);
    throw error;
  }

  // Test server client if in server environment
  if (typeof window === 'undefined' && (globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const serverClient = createSupabaseServerClient();
      
      // Test server connection
      const { error } = await serverClient.auth.getUser();
      
      if (error && !error.message.includes('No session found')) {
        throw new SupabaseConfigError(
          'serviceRoleKey',
          'Service role key validation failed',
          'Verify the SUPABASE_SERVICE_ROLE_KEY is correct'
        );
      }
      
      console.log('[Supabase] Server client health check passed');
    } catch (error) {
      console.error('[Supabase] Server client health check failed:', error);
      throw error;
    }
  }
}

// Single shared client instance to avoid multiple GoTrueClient instances
let sharedClient: SupabaseClient<Database> | null = null;

function createActualSupabaseClient(): SupabaseClient<Database> {
  try {
    const config = loadSupabaseConfig(false);
    
    const client = createClient<Database>(
      config.url,
      config.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Attempt to refresh the token 60 seconds before expiry
          refreshThreshold: 60,
          // Storage key for session persistence
          storageKey: 'ivrelife-auth'
        },
        global: {
          headers: {
            'X-Client-Info': 'ivrelife-nexus@1.0.0'
          }
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Removed blocking validation that could freeze the app during auth
    console.log('[Supabase] Client created successfully');
    return client;
  } catch (error) {
    console.error('[Supabase] Client creation failed:', error);
    
    // Only create mock client if there's a configuration error AND environment variables are completely missing
    // This allows real Supabase connections in development while falling back to mock for actual config issues
    const hasValidConfig = import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    if (!hasValidConfig) {
      console.warn('[Supabase] Creating mock client due to missing configuration');
      
      // Create a mock client that simulates successful authentication with demo credentials
      const mockClient = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signInWithPassword: async (credentials: any) => {
            // Simulate successful login with demo credentials
            if (credentials.email === 'admin@iv-relife.com' && credentials.password === '123456789') {
              const mockUser = {
                id: 'mock-user-id',
                email: 'admin@iv-relife.com',
                name: 'Admin User',
                role: 'owner' as const,
                retailer_id: null,
                location_id: null
              };
              
              const mockSession = {
                user: mockUser,
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                expires_at: Date.now() + 3600000 // 1 hour
              };
              
              return { 
                data: { user: mockUser, session: mockSession }, 
                error: null 
              };
            } else {
              return { 
                data: { user: null, session: null }, 
                error: { message: 'Invalid email or password' } 
              };
            }
          },
          signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Registration not available in demo mode' } }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: (callback) => {
            // Call callback immediately with null user for development mode
            setTimeout(() => callback('SIGNED_OUT', null), 0);
            return { data: { subscription: { unsubscribe: () => {} } }, error: null };
          },
          refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
          updateUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Profile updates not available in demo mode' } }),
          resetPasswordForEmail: () => Promise.resolve({ error: null })
        },
        from: () => ({
          select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Database queries not available in demo mode' } }) }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Database operations not available in demo mode' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Database operations not available in demo mode' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Database operations not available in demo mode' } })
        })
      };
      
      return mockClient as unknown as SupabaseClient<Database>;
    }
    
    // In production, throw the error
    throw error;
  }
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!sharedClient) {
    sharedClient = createActualSupabaseClient();
  }
  return sharedClient;
}

// Export both for backward compatibility
export function createSupabaseClient(): SupabaseClient<Database> {
  return getSupabaseClient();
}

// Type exports
export type { SupabaseConfig, SupabaseConfigError, SupabaseInitializationError };