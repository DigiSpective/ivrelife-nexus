import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/auth/AuthProvider';
import { createSupabaseClient } from '@/lib/supabase-client';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface DebugInfo {
  timestamp: string;
  test: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

export function AuthDebugPanel() {
  const auth = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addDebugInfo = (test: string, status: DebugInfo['status'], message: string, details?: any) => {
    const info: DebugInfo = {
      timestamp: new Date().toLocaleTimeString(),
      test,
      status,
      message,
      details
    };
    setDebugInfo(prev => [info, ...prev].slice(0, 20)); // Keep last 20 entries
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setDebugInfo([]);

    try {
      // Test 1: Environment Variables
      addDebugInfo('Environment Check', 'info', 'Checking environment variables...');
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (hasUrl && hasKey) {
        addDebugInfo('Environment Variables', 'success', 'All required environment variables are set', {
          url: import.meta.env.VITE_SUPABASE_URL,
          keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
        });
      } else {
        addDebugInfo('Environment Variables', 'error', `Missing variables - URL: ${hasUrl}, Key: ${hasKey}`);
      }

      // Test 2: Supabase Client Creation
      addDebugInfo('Client Creation', 'info', 'Creating Supabase client...');
      try {
        const client = createSupabaseClient();
        addDebugInfo('Client Creation', 'success', 'Supabase client created successfully');

        // Test 3: Session Check
        addDebugInfo('Session Check', 'info', 'Checking current session...');
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
          addDebugInfo('Session Check', 'error', `Session error: ${sessionError.message}`, sessionError);
        } else {
          addDebugInfo('Session Check', 'success', 
            sessionData.session ? 'Active session found' : 'No active session', 
            sessionData.session ? {
              user: sessionData.session.user?.email,
              expiresAt: new Date(sessionData.session.expires_at! * 1000).toLocaleString()
            } : null
          );
        }

        // Test 4: User Check
        addDebugInfo('User Check', 'info', 'Checking current user...');
        const { data: userData, error: userError } = await client.auth.getUser();
        
        if (userError) {
          addDebugInfo('User Check', 'error', `User error: ${userError.message}`, userError);
        } else {
          addDebugInfo('User Check', 'success', 
            userData.user ? 'User data available' : 'No user data', 
            userData.user ? {
              id: userData.user.id,
              email: userData.user.email,
              lastSignIn: userData.user.last_sign_in_at
            } : null
          );
        }

      } catch (clientError) {
        addDebugInfo('Client Creation', 'error', `Failed to create client: ${clientError}`, clientError);
      }

      // Test 5: Auth Provider State
      addDebugInfo('Auth Provider', 'info', 'Checking auth provider state...');
      addDebugInfo('Auth Provider State', auth.user ? 'success' : 'warning', 
        `User: ${auth.user ? 'Logged in' : 'Not logged in'}, Loading: ${auth.loading}, Error: ${auth.error?.message || 'None'}`, {
          user: auth.user,
          session: auth.session,
          loading: auth.loading,
          error: auth.error
        }
      );

      // Test 6: Demo Login Test
      if (!auth.user) {
        addDebugInfo('Demo Login', 'info', 'Testing demo credentials...');
        try {
          const result = await auth.signIn({
            email: 'admin@iv-relife.com',
            password: '123456789'
          });
          
          if (result.success) {
            addDebugInfo('Demo Login', 'success', 'Demo login successful!');
          } else {
            addDebugInfo('Demo Login', 'error', `Demo login failed: ${result.error?.message}`, result.error);
          }
        } catch (loginError) {
          addDebugInfo('Demo Login', 'error', `Demo login exception: ${loginError}`, loginError);
        }
      } else {
        addDebugInfo('Demo Login', 'info', 'Skipped - user already logged in');
      }

    } catch (error) {
      addDebugInfo('General Error', 'error', `Comprehensive test failed: ${error}`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setDebugInfo([]);
  };

  const getStatusIcon = (status: DebugInfo['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: DebugInfo['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
    }
  };

  // Auto-run tests on mount
  useEffect(() => {
    runComprehensiveTests();
  }, []);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Authentication Debug Panel</span>
          <div className="flex gap-2">
            <Button 
              onClick={runComprehensiveTests} 
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Run Tests
            </Button>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Auth Status */}
        <Alert>
          <AlertDescription>
            <strong>Current Status:</strong> User: {auth.user?.email || 'None'} | 
            Loading: {auth.loading ? 'Yes' : 'No'} | 
            Error: {auth.error?.message || 'None'}
          </AlertDescription>
        </Alert>

        {/* Debug Logs */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No debug information available</p>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded">
                {getStatusIcon(info.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(info.status)}>
                      {info.test}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{info.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{info.message}</p>
                  {info.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Show details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(info.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={() => auth.signOut()} 
            variant="outline" 
            size="sm"
            disabled={!auth.user}
          >
            Sign Out
          </Button>
          <Button 
            onClick={() => auth.clearError()} 
            variant="outline" 
            size="sm"
            disabled={!auth.error}
          >
            Clear Error
          </Button>
          <Button 
            onClick={() => auth.refreshUser()} 
            variant="outline" 
            size="sm"
          >
            Refresh User
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}