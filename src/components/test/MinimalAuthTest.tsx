import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
  timestamp: string;
}

export function MinimalAuthTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [email, setEmail] = useState('admin@iv-relife.com');
  const [password, setPassword] = useState('123456789');

  const addResult = (test: string, status: TestResult['status'], message: string, details?: any) => {
    const result: TestResult = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => setResults([]);

  // Test 1: Environment Variables
  const testEnvironmentVariables = () => {
    addResult('Environment Check', 'pending', 'Checking environment variables...');
    
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('[ENV TEST] Raw environment check:', { url, key });
      
      if (!url || !key) {
        addResult('Environment Variables', 'error', 
          `Missing variables - URL: ${!!url}, Key: ${!!key}`, 
          { url, keyPrefix: key?.substring(0, 20) }
        );
        return false;
      }
      
      addResult('Environment Variables', 'success', 
        'Environment variables loaded successfully', 
        { url, keyPrefix: key.substring(0, 20) + '...' }
      );
      return true;
    } catch (error) {
      addResult('Environment Variables', 'error', `Error checking environment: ${error}`);
      return false;
    }
  };

  // Test 2: Direct Supabase Import
  const testSupabaseImport = async () => {
    addResult('Supabase Import', 'pending', 'Testing Supabase client import...');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      addResult('Supabase Import', 'success', 'Supabase library imported successfully');
      return createClient;
    } catch (error) {
      addResult('Supabase Import', 'error', `Failed to import Supabase: ${error}`);
      return null;
    }
  };

  // Test 3: Direct Client Creation
  const testDirectClientCreation = async () => {
    addResult('Direct Client', 'pending', 'Creating Supabase client directly...');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        addResult('Direct Client', 'error', 'Cannot create client - missing credentials');
        return null;
      }
      
      const client = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      });
      
      addResult('Direct Client', 'success', 'Supabase client created successfully');
      return client;
    } catch (error) {
      addResult('Direct Client', 'error', `Client creation failed: ${error}`);
      return null;
    }
  };

  // Test 4: Session Check
  const testSessionCheck = async (client: any) => {
    if (!client) return;
    
    addResult('Session Check', 'pending', 'Checking current session...');
    
    try {
      const { data, error } = await client.auth.getSession();
      
      if (error) {
        addResult('Session Check', 'error', `Session error: ${error.message}`, error);
        return;
      }
      
      addResult('Session Check', 'success', 
        data.session ? 'Active session found' : 'No active session',
        data.session ? {
          user: data.session.user?.email,
          expiresAt: new Date(data.session.expires_at! * 1000).toLocaleString()
        } : null
      );
    } catch (error) {
      addResult('Session Check', 'error', `Session check failed: ${error}`);
    }
  };

  // Test 5: Direct Login Attempt
  const testDirectLogin = async (client: any) => {
    if (!client) return;
    
    addResult('Direct Login', 'pending', `Attempting login with ${email}...`);
    
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        addResult('Direct Login', 'error', `Login failed: ${error.message}`, error);
        return;
      }
      
      if (data.user && data.session) {
        addResult('Direct Login', 'success', `Login successful for ${data.user.email}`, {
          userId: data.user.id,
          email: data.user.email,
          sessionExpires: new Date(data.session.expires_at! * 1000).toLocaleString()
        });
      } else {
        addResult('Direct Login', 'error', 'Login returned no user data');
      }
    } catch (error) {
      addResult('Direct Login', 'error', `Login exception: ${error}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    clearResults();
    
    // Test 1: Environment Variables
    const envOk = testEnvironmentVariables();
    if (!envOk) return;
    
    // Test 2: Supabase Import
    const createClient = await testSupabaseImport();
    if (!createClient) return;
    
    // Test 3: Direct Client Creation
    const client = await testDirectClientCreation();
    if (!client) return;
    
    // Test 4: Session Check
    await testSessionCheck(client);
    
    // Test 5: Direct Login
    await testDirectLogin(client);
  };

  // Auto-run tests on mount
  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Minimal Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runAllTests}>Run All Tests</Button>
            <Button variant="outline" onClick={clearResults}>Clear Results</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No test results yet</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className={`p-3 rounded border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(result.status)}</span>
                      <strong>{result.test}</strong>
                    </div>
                    <span className="text-xs opacity-75">{result.timestamp}</span>
                  </div>
                  <p className="mt-1 text-sm">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs opacity-75">Details</summary>
                      <pre className="text-xs bg-white/50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}