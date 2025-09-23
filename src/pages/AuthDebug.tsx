import React from 'react';
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';

export default function AuthDebug() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive authentication system diagnostics and testing
        </p>
      </div>
      
      <AuthDebugPanel />
    </div>
  );
}