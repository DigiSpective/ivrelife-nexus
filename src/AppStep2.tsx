import React from "react";
import { AuthProviderFixed } from "./components/auth/AuthProviderFixed";
import { DataPersistenceProvider } from "./components/providers/DataPersistenceProvider";

// Test Step 2: AuthProviderFixed + DataPersistenceProvider
export default function AppStep2() {
  console.log('AppStep2 rendering...');
  
  return (
    <AuthProviderFixed>
      <DataPersistenceProvider>
        <div style={{
          padding: '40px',
          fontFamily: 'Arial, sans-serif',
          background: '#fff3e0',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#333', marginBottom: '20px' }}>
            🧪 Step 2 Test - AuthProviderFixed + DataPersistenceProvider
          </h1>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#ff9800' }}>⚠️ Testing Provider Combination</h2>
            <p>If you can see this, both AuthProviderFixed and DataPersistenceProvider work together.</p>
            <p><strong>Test Status:</strong> Provider chain working</p>
          </div>
        </div>
      </DataPersistenceProvider>
    </AuthProviderFixed>
  );
}