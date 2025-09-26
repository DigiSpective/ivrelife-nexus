import React from 'react';

export default function ShippingTest() {
  console.log('ShippingTest component rendering');
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Shipping Test</h1>
      <p>If you see this, the shipping route works and the issue is in ShippingNew imports.</p>
      <button 
        onClick={() => console.log('Button clicked')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Button
      </button>
    </div>
  );
}