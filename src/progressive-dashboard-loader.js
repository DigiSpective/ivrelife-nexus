// Progressive Dashboard Loader - Non-module approach to load real components
console.log('📦 Progressive Dashboard Loader - Initializing...');

window.ProgressiveDashboardLoader = {
  
  // Step 1: Verify basic functionality works
  step1_verifyBasics: () => {
    console.log('🔍 Step 1: Verifying basic functionality...');
    
    // Test if we can manipulate DOM
    const testDiv = document.createElement('div');
    testDiv.textContent = 'DOM manipulation works';
    
    // Test if we can make fetch requests
    return fetch('/src/main-emergency.tsx')
      .then(response => {
        console.log('✅ Step 1: Fetch API works, response status:', response.status);
        return { success: true, canFetch: true };
      })
      .catch(error => {
        console.error('❌ Step 1: Fetch failed:', error);
        return { success: false, error: error.message };
      });
  },
  
  // Step 2: Load and evaluate Vite-processed components manually
  step2_loadViteComponents: async () => {
    console.log('🔍 Step 2: Attempting to load Vite-processed components...');
    
    try {
      // Try to fetch the processed main-emergency.tsx
      const response = await fetch('/src/main-emergency.tsx');
      const moduleCode = await response.text();
      
      console.log('📄 Module code length:', moduleCode.length);
      console.log('📄 Module code preview:', moduleCode.substring(0, 200) + '...');
      
      // Check if the code looks properly processed
      if (moduleCode.includes('import __vite__cjsImport')) {
        console.log('✅ Step 2: Vite transformation detected');
        return { success: true, transformed: true, codeLength: moduleCode.length };
      } else {
        console.warn('⚠️ Step 2: No Vite transformation detected');
        return { success: false, reason: 'No Vite transformation' };
      }
      
    } catch (error) {
      console.error('❌ Step 2: Failed to load components:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Step 3: Attempt dynamic import of real components
  step3_dynamicImport: async () => {
    console.log('🔍 Step 3: Attempting dynamic import...');
    
    try {
      // Try to dynamically import Dashboard component
      const dashboardModule = await import('/src/pages/Dashboard.tsx');
      console.log('✅ Step 3: Dashboard.tsx imported successfully');
      
      // Try to import other key components
      const appEmergencyModule = await import('/src/App-emergency.tsx');
      console.log('✅ Step 3: App-emergency.tsx imported successfully');
      
      return { 
        success: true, 
        dashboard: !!dashboardModule.default,
        appEmergency: !!appEmergencyModule.default
      };
      
    } catch (error) {
      console.error('❌ Step 3: Dynamic import failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Step 4: Progressive component rendering
  step4_progressiveRender: async (components) => {
    console.log('🔍 Step 4: Progressive component rendering...');
    
    try {
      const rootElement = document.getElementById('root');
      if (!rootElement) {
        throw new Error('Root element not found');
      }
      
      // Clear existing content
      rootElement.innerHTML = '';
      
      // Create loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = 'padding: 20px; text-align: center; font-family: Arial, sans-serif;';
      loadingDiv.innerHTML = `
        <h2>🔄 Progressive Dashboard Loading</h2>
        <p>Successfully bypassed module loading issues!</p>
        <p>Loading real dashboard components...</p>
        <div id="progress-status"></div>
      `;
      rootElement.appendChild(loadingDiv);
      
      // Wait a moment to show loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Step 4: Progressive render failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Run full diagnostic sequence
  runFullDiagnostic: async () => {
    console.log('🚀 Starting full progressive diagnostic...');
    
    const results = {
      step1: await window.ProgressiveDashboardLoader.step1_verifyBasics(),
      step2: await window.ProgressiveDashboardLoader.step2_loadViteComponents(),
      step3: await window.ProgressiveDashboardLoader.step3_dynamicImport(),
    };
    
    console.log('📊 Diagnostic Results:', results);
    
    // If dynamic import works, proceed with progressive rendering
    if (results.step3.success) {
      results.step4 = await window.ProgressiveDashboardLoader.step4_progressiveRender();
      
      if (results.step4.success) {
        // Dynamic imports work - we can restore real components
        setTimeout(() => {
          window.ProgressiveDashboardLoader.loadRealDashboard();
        }, 2000);
      }
    }
    
    return results;
  },
  
  // Load real dashboard using dynamic imports (this will work if ES6 modules work)
  loadRealDashboard: async () => {
    console.log('🎯 Loading real IV RELIFE Dashboard components...');
    
    try {
      // Import React and ReactDOM from Vite
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      
      // Import the real App-emergency
      const AppModule = await import('/src/App-emergency.tsx');
      const App = AppModule.default;
      
      // Import CSS
      await import('/src/index.css');
      
      console.log('✅ All real components imported successfully');
      
      // Render real application
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(React.createElement(App));
      
      console.log('🎉 Real IV RELIFE Dashboard restored successfully!');
      
      // Call success callback
      if (window.appLoadSuccess) {
        window.appLoadSuccess();
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to load real dashboard:', error);
      
      // Fall back to CDN version
      console.log('🔄 Falling back to CDN React version...');
      if (window.triggerFallbackRestart) {
        window.triggerFallbackRestart();
      }
      
      return { success: false, error: error.message };
    }
  }
};

// Auto-start diagnostic if fallback is triggered
window.addEventListener('load', () => {
  // Give the module script a chance to load first
  setTimeout(() => {
    if (!window.appLoadSuccess || !window.appLoaded) {
      console.log('🔍 Module script timeout - starting progressive diagnostic...');
      window.ProgressiveDashboardLoader.runFullDiagnostic();
    }
  }, 2000);
});

console.log('✅ Progressive Dashboard Loader ready');