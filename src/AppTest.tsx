import React from 'react';

const AppTest = () => {
  console.log('🧪 AppTest component rendering...');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 IV RELIFE Nexus Test</h1>
      <p>✅ React is working!</p>
      <p>✅ TypeScript is working!</p>
      <p>✅ Module imports are working!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default AppTest;