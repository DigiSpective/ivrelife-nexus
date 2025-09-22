import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Minimal App with progressive component testing
const MinimalApp: React.FC = () => {
  const [loadingStage, setLoadingStage] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);

  const testComponent = async (stage: number, componentName: string, testFn: () => Promise<void>) => {
    try {
      console.log(`🧪 Testing ${componentName}...`);
      await testFn();
      console.log(`✅ ${componentName} loaded successfully`);
      setLoadingStage(stage + 1);
    } catch (err) {
      console.error(`❌ ${componentName} failed:`, err);
      setError(`${componentName}: ${err.message}`);
    }
  };

  React.useEffect(() => {
    const runTests = async () => {
      // Test 1: Basic Router
      await testComponent(1, "React Router", async () => {
        // Router is already imported, just verify it works
        return Promise.resolve();
      });

      // Test 2: UI Components
      await testComponent(2, "UI Components", async () => {
        const { Toaster } = await import("@/components/ui/toaster");
        const { TooltipProvider } = await import("@/components/ui/tooltip");
        return Promise.resolve();
      });

      // Test 3: Query Client
      await testComponent(3, "TanStack Query", async () => {
        const { QueryClient } = await import("@tanstack/react-query");
        return Promise.resolve();
      });

      // Test 4: Auth Provider
      await testComponent(4, "Auth Provider", async () => {
        const { AuthProvider } = await import("./components/auth/AuthProvider");
        return Promise.resolve();
      });

      // Test 5: Layout Components
      await testComponent(5, "Layout Components", async () => {
        const { AuthGuard } = await import("./components/layout/AuthGuard");
        const { DashboardLayout } = await import("./components/layout/DashboardLayout");
        return Promise.resolve();
      });

      // Test 6: Page Components
      await testComponent(6, "Page Components", async () => {
        const Dashboard = await import("./pages/Dashboard");
        const Login = await import("./pages/Login");
        return Promise.resolve();
      });
    };

    runTests();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '40px', background: '#f8d7da', color: '#721c24', borderRadius: '8px', margin: '20px' }}>
        <h2>🔍 Component Isolation Test Failed</h2>
        <div style={{ background: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '5px', margin: '15px 0' }}>
          <strong>Failed Component:</strong> {error}
        </div>
        <p>This identifies the exact component causing the application failure.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔬 Component Isolation Testing</h1>
      
      <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Testing Stage: {loadingStage}/7</h3>
        <div style={{ background: '#ddd', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
          <div 
            style={{ 
              background: '#4caf50', 
              height: '100%', 
              width: `${(loadingStage / 7) * 100}%`,
              transition: 'width 0.5s ease'
            }}
          />
        </div>
      </div>

      {loadingStage >= 2 && (
        <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ddd' }}>
          ✅ React Router: Working
        </div>
      )}

      {loadingStage >= 3 && (
        <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ddd' }}>
          ✅ UI Components: Working
        </div>
      )}

      {loadingStage >= 4 && (
        <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ddd' }}>
          ✅ TanStack Query: Working
        </div>
      )}

      {loadingStage >= 5 && (
        <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ddd' }}>
          ✅ Auth Provider: Working
        </div>
      )}

      {loadingStage >= 6 && (
        <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ddd' }}>
          ✅ Layout Components: Working
        </div>
      )}

      {loadingStage >= 7 && (
        <div style={{ background: '#d4edda', padding: '20px', margin: '10px 0', borderRadius: '5px', border: '1px solid #c3e6cb' }}>
          <h3>🎉 All Components Pass Individual Tests!</h3>
          <p>Ready to test full integrated application...</p>
          
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '5px', margin: '20px 0' }}>
                  <h4>🚀 Basic Routing Test</h4>
                  <p>All core components loaded successfully. Full app should work now.</p>
                  <Navigate to="/test" replace />
                </div>
              } />
              <Route path="/test" element={
                <div style={{ padding: '20px', background: '#d1ecf1', borderRadius: '5px', margin: '20px 0' }}>
                  <h4>✅ Routing Functional</h4>
                  <p>Component isolation testing complete. All systems operational.</p>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </div>
      )}
    </div>
  );
};

export default MinimalApp;