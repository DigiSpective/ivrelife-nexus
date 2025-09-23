// Import CSS immediately to ensure styles load
import "./index.css";

// Import bootstrap loader
import { initApp } from "./bootstrap";

console.log("🚀 Starting IV RELIFE Nexus application...");

// Actually call the bootstrap initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready, call immediately
  initApp();
}
