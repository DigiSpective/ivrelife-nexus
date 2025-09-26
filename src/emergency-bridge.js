// Emergency Bridge - Non-module script to help diagnose and resolve the issue
console.log('🌉 Emergency Bridge - Initializing diagnostic bridge...');

// Store execution timeline
window.emergencyBridge = {
  startTime: Date.now(),
  moduleScriptDetected: false,
  diagnosticsRun: false,
  fallbackActivated: false,
  realDashboardLoaded: false,
  
  // Check if module script executed
  checkModuleExecution: () => {
    return !!(window.moduleExecutionStarted || window.appLoadSuccess);
  },
  
  // Force immediate diagnostic
  runImmediateDiagnostic: () => {
    console.log('🔍 Running immediate diagnostic...');
    
    const status = {
      timestamp: new Date().toISOString(),
      moduleExecutionStarted: !!window.moduleExecutionStarted,
      moduleExecutionTime: window.moduleExecutionTime,
      reactAvailable: !!window.React,
      viteClientConnected: !!window.__vite_is_modern_browser,
      fetchAPI: !!window.fetch,
      es6Support: (() => {
        try {
          new Function('() => {}');
          return true;
        } catch (e) {
          return false;
        }
      })(),
      promiseSupport: !!window.Promise,
      moduleSupport: (() => {
        try {
          new Function('import("")');
          return true;
        } catch (e) {
          return false;
        }
      })()
    };
    
    console.log('📊 Immediate Diagnostic Results:', status);
    
    // Update UI with diagnostic info
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) {
      loadingStatus.innerHTML = `
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4>🔍 Emergency Bridge Diagnostic</h4>
          <div style="font-family: monospace; font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 3px;">
            <div>⏰ Time since start: ${Date.now() - window.emergencyBridge.startTime}ms</div>
            <div>📦 Module execution: ${status.moduleExecutionStarted ? '✅' : '❌'}</div>
            <div>⚛️ React available: ${status.reactAvailable ? '✅' : '❌'}</div>
            <div>🔧 Vite client: ${status.viteClientConnected ? '✅' : '❌'}</div>
            <div>🌐 Fetch API: ${status.fetchAPI ? '✅' : '❌'}</div>
            <div>🔮 ES6 support: ${status.es6Support ? '✅' : '❌'}</div>
            <div>📋 Promise support: ${status.promiseSupport ? '✅' : '❌'}</div>
            <div>📦 Module support: ${status.moduleSupport ? '✅' : '❌'}</div>
          </div>
          <button onclick="window.emergencyBridge.forceProgressiveLoad()" style="margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🚀 Force Progressive Load
          </button>
        </div>
      `;
    }
    
    return status;
  },
  
  // Force progressive loading
  forceProgressiveLoad: () => {
    console.log('🚀 Force progressive load initiated...');
    
    if (window.ProgressiveDashboardLoader) {
      window.ProgressiveDashboardLoader.runFullDiagnostic()
        .then(results => {
          console.log('✅ Progressive loading completed:', results);
        })
        .catch(error => {
          console.error('❌ Progressive loading failed:', error);
          // Trigger CDN fallback
          if (window.triggerFallbackRestart) {
            window.triggerFallbackRestart();
          }
        });
    } else {
      console.error('❌ Progressive dashboard loader not available');
      // Direct CDN fallback
      if (window.triggerFallbackRestart) {
        window.triggerFallbackRestart();
      }
    }
  }
};

// Run immediate diagnostic
setTimeout(() => {
  window.emergencyBridge.runImmediateDiagnostic();
}, 500);

// Check for module execution every second for first 5 seconds
let checkCount = 0;
const moduleCheckInterval = setInterval(() => {
  checkCount++;
  
  if (window.emergencyBridge.checkModuleExecution()) {
    console.log('✅ Module execution detected, clearing interval');
    clearInterval(moduleCheckInterval);
    return;
  }
  
  if (checkCount >= 5) {
    console.warn('⚠️ Module execution not detected after 5 seconds');
    clearInterval(moduleCheckInterval);
    
    // Force progressive load if module execution failed
    setTimeout(() => {
      if (!window.emergencyBridge.checkModuleExecution()) {
        console.log('🔄 Auto-triggering progressive load...');
        window.emergencyBridge.forceProgressiveLoad();
      }
    }, 1000);
  }
}, 1000);

console.log('✅ Emergency Bridge initialized');