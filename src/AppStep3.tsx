import React from "react";
import { AuthProviderFixed } from "./components/auth/AuthProviderFixed";
import { CartProvider } from "./components/cart/CartManager";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Test Step 3: Add more providers but skip DataPersistenceProvider for now
export default function AppStep3() {
  console.log('AppStep3 rendering...');
  
  return (
    <AuthProviderFixed>
      <CartProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={
                <div style={{
                  padding: '40px',
                  fontFamily: 'Arial, sans-serif',
                  background: '#f3e5f5',
                  minHeight: '100vh'
                }}>
                  <h1 style={{ color: '#333', marginBottom: '20px' }}>
                    🧪 Step 3 Test - Multiple Providers (No DataPersistence)
                  </h1>
                  
                  <div style={{ 
                    background: 'white', 
                    padding: '20px', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <h2 style={{ color: '#9c27b0' }}>🔄 Provider Chain Test</h2>
                    <p>Testing: AuthProviderFixed → CartProvider → TooltipProvider → BrowserRouter</p>
                    <p><strong>Current Path:</strong> {window.location.pathname}</p>
                    <p><strong>Test Status:</strong> Router and basic providers working</p>
                  </div>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProviderFixed>
  );
}