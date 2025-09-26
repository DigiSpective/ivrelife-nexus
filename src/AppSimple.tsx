import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Test with just the basic structure first
const Dashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>🚀 IV RELIFE Nexus Dashboard</h1>
    <p>✅ React Router is working!</p>
    <p>✅ Dashboard component loaded!</p>
    <nav style={{ marginTop: '20px' }}>
      <a href="/products" style={{ marginRight: '10px' }}>Products</a>
      <a href="/orders" style={{ marginRight: '10px' }}>Orders</a>
      <a href="/customers" style={{ marginRight: '10px' }}>Customers</a>
      <a href="/admin" style={{ marginRight: '10px' }}>Admin</a>
    </nav>
  </div>
);

const Products = () => (
  <div style={{ padding: '20px' }}>
    <h1>📦 Products</h1>
    <p>Products page loaded successfully!</p>
    <a href="/dashboard">← Back to Dashboard</a>
  </div>
);

const Orders = () => (
  <div style={{ padding: '20px' }}>
    <h1>📋 Orders</h1>
    <p>Orders page loaded successfully!</p>
    <a href="/dashboard">← Back to Dashboard</a>
  </div>
);

const Customers = () => (
  <div style={{ padding: '20px' }}>
    <h1>👥 Customers</h1>
    <p>Customers page loaded successfully!</p>
    <a href="/dashboard">← Back to Dashboard</a>
  </div>
);

const Admin = () => (
  <div style={{ padding: '20px' }}>
    <h1>⚙️ Admin</h1>
    <p>Admin page loaded successfully!</p>
    <a href="/dashboard">← Back to Dashboard</a>
  </div>
);

const AppSimple = () => {
  console.log('🚀 AppSimple component rendering...');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<div style={{ padding: '20px' }}>
          <h1>404 - Page Not Found</h1>
          <a href="/dashboard">← Back to Dashboard</a>
        </div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppSimple;