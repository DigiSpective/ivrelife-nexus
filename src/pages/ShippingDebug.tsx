import React from 'react';

// Test imports one by one to find the problematic one
export default function ShippingDebug() {
  console.log('ShippingDebug: Basic component loaded');
  
  // Test basic functionality first
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Shipping Debug</h1>
      <p>Testing step by step...</p>
      
      <div className="mt-4 space-y-2">
        <div className="p-2 bg-green-100 text-green-800 rounded">
          ✅ Basic React component works
        </div>
        
        <button 
          onClick={() => {
            console.log('Testing hook import...');
            // Now test the hook import
            import('@/hooks/useShipping').then(() => {
              console.log('✅ useShipping hook imports successfully');
            }).catch(err => {
              console.error('❌ useShipping hook import failed:', err);
            });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test useShipping Hook Import
        </button>
        
        <button 
          onClick={() => {
            console.log('Testing ShippingNew import...');
            // Test the full ShippingNew component import
            import('./ShippingNew').then(() => {
              console.log('✅ ShippingNew imports successfully');
            }).catch(err => {
              console.error('❌ ShippingNew import failed:', err);
            });
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test ShippingNew Import
        </button>
      </div>
    </div>
  );
}