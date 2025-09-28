/**
 * Persistence Status Debug Panel
 * Shows real-time status of all persistence methods
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, HardDrive } from 'lucide-react';
import { checkPersistenceStatus, type PersistenceStatus } from '@/lib/persistence-status';
import { smartPersistence } from '@/lib/smart-persistence';

export function PersistenceStatusPanel() {
  const [status, setStatus] = useState<PersistenceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const newStatus = await checkPersistenceStatus(true);
      setStatus(newStatus);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Failed to check persistence status:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateTesupastorage = async () => {
    if (!status?.currentUserId) {
      alert('No user logged in - cannot migrate');
      return;
    }

    setLoading(true);
    try {
      const migratedCount = await smartPersistence.migrateFromLocalStorageToSupabase(status.currentUserId);
      alert(`Migrated ${migratedCount} items to Supabase`);
      await checkStatus(); // Refresh status
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed - check console');
    } finally {
      setLoading(false);
    }
  };

  const runPersistenceTest = async () => {
    setLoading(true);
    try {
      // Test the smart persistence system
      const testUserId = status?.currentUserId || 'test-user';
      const testData = { test: 'persistence-test-' + Date.now() };
      
      console.log('🧪 Running persistence test...');
      
      // Test save
      const saveResult = await smartPersistence.set('debug-test', testData, testUserId);
      console.log('Save result:', saveResult);
      
      // Test retrieve
      const retrievedData = await smartPersistence.get('debug-test', testUserId);
      console.log('Retrieved data:', retrievedData);
      
      // Test cleanup
      await smartPersistence.remove('debug-test', testUserId);
      
      const success = saveResult && JSON.stringify(retrievedData) === JSON.stringify(testData);
      alert(success ? '✅ Persistence test PASSED' : '❌ Persistence test FAILED - check console');
      
      await checkStatus(); // Refresh status
    } catch (error) {
      console.error('Persistence test failed:', error);
      alert('❌ Persistence test FAILED - check console');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const StatusIcon = ({ working }: { working: boolean }) => 
    working ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Persistence Status
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <>
            {/* Status Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>localStorage</span>
                <StatusIcon working={status.localStorage} />
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Supabase Auth</span>
                <StatusIcon working={status.supabaseAuth} />
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>user_storage</span>
                <StatusIcon working={status.supabaseUserStorage} />
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>customers</span>
                <StatusIcon working={status.supabaseCustomers} />
              </div>
            </div>

            {/* User Info */}
            {status.currentUserId && (
              <div className="p-2 bg-green-50 rounded">
                <div className="text-sm font-medium">Current User</div>
                <div className="text-xs text-gray-600 font-mono">{status.currentUserId}</div>
              </div>
            )}

            {/* Errors */}
            {status.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Issues Found</span>
                </div>
                {status.errors.map((error, index) => (
                  <div key={index} className="text-xs bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {status.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Recommendations</span>
                </div>
                {status.recommendations.map((rec, index) => (
                  <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                    {rec}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runPersistenceTest}
                disabled={loading}
                className="w-full"
              >
                🧪 Run Persistence Test
              </Button>
              
              {status.localStorage && status.supabaseUserStorage && status.currentUserId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={migrateTesupastorage}
                  disabled={loading}
                  className="w-full"
                >
                  🔄 Migrate localStorage → Supabase
                </Button>
              )}
            </div>

            {/* Last Check */}
            {lastCheck && (
              <div className="text-xs text-gray-500 text-center">
                Last checked: {lastCheck.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}