import React, { useState, useEffect } from 'react';
import { persistentStorage, STORAGE_KEYS } from '@/lib/persistent-storage';
import { useAuthFixed } from '@/components/auth/AuthProviderFixed';
import { useDataPersistence } from '@/components/providers/DataPersistenceProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PersistenceDebugPanel() {
  const { user } = useAuthFixed();
  const { isOnline, lastSyncTime, syncStatus, forcSync } = useDataPersistence();
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});

  const refreshStorageData = async () => {
    if (!user) return;

    const data: Record<string, any> = {};
    const localData: Record<string, any> = {};

    // Check all storage keys
    for (const [keyName, key] of Object.entries(STORAGE_KEYS)) {
      try {
        const persistedData = await persistentStorage.get(key, user.id);
        data[keyName] = persistedData;

        // Also check localStorage directly
        const localItem = localStorage.getItem(key);
        localData[keyName] = localItem ? JSON.parse(localItem) : null;
      } catch (error) {
        data[keyName] = `Error: ${error}`;
        localData[keyName] = `Error: ${error}`;
      }
    }

    setStorageData(data);
    setLocalStorageData(localData);
  };

  useEffect(() => {
    refreshStorageData();
  }, [user?.id]);

  const clearAllData = async () => {
    if (!user) return;
    
    try {
      await persistentStorage.clearUserData(user.id);
      await refreshStorageData();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'syncing': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-green-500';
    }
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatDataSize = (data: any) => {
    if (!data) return '0 B';
    const str = JSON.stringify(data);
    return `${str.length} bytes`;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Persistence Debug Panel
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Badge className={getStatusColor(syncStatus)}>
              {syncStatus}
            </Badge>
          </div>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          User: {user?.email || 'Not authenticated'} | 
          Last Sync: {formatTimestamp(lastSyncTime)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={refreshStorageData} variant="outline">
            Refresh Data
          </Button>
          <Button onClick={forcSync} variant="outline" disabled={!isOnline || syncStatus === 'syncing'}>
            Force Sync
          </Button>
          <Button onClick={clearAllData} variant="destructive" size="sm">
            Clear All Data
          </Button>
        </div>

        <Tabs defaultValue="storage">
          <TabsList>
            <TabsTrigger value="storage">Persistent Storage</TabsTrigger>
            <TabsTrigger value="localStorage">Local Storage</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="storage" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(storageData).map(([key, data]) => (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{key}</h4>
                      <Badge variant="outline">{formatDataSize(data)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="localStorage" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(localStorageData).map(([key, data]) => (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{key}</h4>
                      <Badge variant="outline">{formatDataSize(data)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Storage Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(STORAGE_KEYS).length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data Keys with Values</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(storageData).filter(v => v !== null).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Storage Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDataSize(storageData)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getStatusColor(syncStatus).replace('bg-', 'text-')}`}>
                    {syncStatus.toUpperCase()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}