import React from "react";

// Absolute simplest possible React component with no imports from @/
export default function AppSimplest() {
  console.log('AppSimplest rendering...');
  
  return (
    <div>
      <h1>🟢 React is working! (Updated)</h1>
      <p>This is the absolute simplest test - no external imports.</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
      <button onClick={() => alert('Click works!')}>Test Click</button>
    </div>
  );
}