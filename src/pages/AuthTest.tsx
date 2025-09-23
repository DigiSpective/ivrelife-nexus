import React from 'react';
import { MinimalAuthTest } from '@/components/test/MinimalAuthTest';

export default function AuthTest() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Authentication System Test</h1>
        <p className="text-muted-foreground mt-2">
          Minimal authentication testing without complex state management
        </p>
      </div>
      
      <MinimalAuthTest />
    </div>
  );
}