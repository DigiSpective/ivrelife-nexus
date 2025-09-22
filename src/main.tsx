import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("🚀 Starting IV RELIFE Nexus application...");

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("✅ Application started successfully");
    
    // Notify success callback if available
    if (typeof window !== 'undefined' && window.appLoadSuccess) {
      window.appLoadSuccess();
    }
  } catch (error) {
    console.error("❌ Application failed to start:", error);
    
    // Notify error callback if available
    if (typeof window !== 'undefined' && window.appLoadError) {
      window.appLoadError(error);
    }
    
    rootElement.innerHTML = `
      <div style="padding: 40px; background: #f8d7da; color: #721c24; border-radius: 8px; margin: 20px;">
        <h2>❌ Application Failed to Start</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
} else {
  console.error("❌ Root element not found");
  
  // Notify error callback if available
  if (typeof window !== 'undefined' && window.appLoadError) {
    window.appLoadError(new Error("Root element not found"));
  }
}
