// Ultra-simple main with inline everything - no external imports except React
import React from 'react';
import { createRoot } from 'react-dom/client';

console.log("🟢 ULTRA-SIMPLE: Starting");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No root element");
}

const UltraSimpleApp = () => {
  console.log("🟢 ULTRA-SIMPLE: App rendering");
  
  return React.createElement('div', {
    style: {
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#4ade80',
      color: 'white',
      minHeight: '100vh'
    }
  }, [
    React.createElement('h1', { key: 'title' }, '🟢 ULTRA SIMPLE SUCCESS'),
    React.createElement('p', { key: 'desc' }, 'This is the most minimal possible React app'),
    React.createElement('p', { key: 'time' }, `Loaded at: ${new Date().toLocaleString()}`),
    React.createElement('button', {
      key: 'btn',
      onClick: () => alert('SUCCESS: React is fully functional!'),
      style: {
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: 'white',
        color: '#4ade80',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }
    }, 'Test Click')
  ]);
};

const root = createRoot(rootElement);
root.render(React.createElement(UltraSimpleApp));

console.log("🟢 ULTRA-SIMPLE: Complete");