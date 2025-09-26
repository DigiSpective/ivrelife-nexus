// Ultra minimal main - no CSS imports, minimal dependencies
console.log("🟢 ULTRA-MINIMAL: Script executing");

// Immediate body modification to prove script execution
document.body.style.backgroundColor = "#4ade80";
document.body.style.color = "white";
document.body.style.padding = "20px";
document.body.style.fontFamily = "Arial, sans-serif";

console.log("🟢 ULTRA-MINIMAL: Body style applied");

// Replace root content immediately
const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("🟢 ULTRA-MINIMAL: Root found, updating content");
  rootElement.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <h1 style="font-size: 2em; margin-bottom: 20px;">🟢 ULTRA MINIMAL SUCCESS</h1>
      <p style="font-size: 1.2em; margin-bottom: 15px;">Script is executing successfully!</p>
      <p style="font-size: 1em; margin-bottom: 20px;">Time: ${new Date().toLocaleString()}</p>
      <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2>✅ Diagnostics</h2>
        <p>✅ JavaScript execution: WORKING</p>
        <p>✅ DOM manipulation: WORKING</p>
        <p>✅ Module script loading: WORKING</p>
        <p>✅ Vite dev server: WORKING</p>
      </div>
      <button onclick="alert('Interaction test successful!')" style="padding: 10px 20px; font-size: 16px; background: white; color: #4ade80; border: none; border-radius: 5px; cursor: pointer;">Test Click</button>
    </div>
  `;
  console.log("🟢 ULTRA-MINIMAL: Content updated successfully");
} else {
  console.error("🟢 ULTRA-MINIMAL: No root element found!");
  document.body.innerHTML = `
    <div style="padding: 40px; background: red; color: white; text-align: center;">
      <h1>❌ NO ROOT ELEMENT FOUND</h1>
      <p>The DOM does not contain a div with id="root"</p>
    </div>
  `;
}

// Try to load React as a separate step
console.log("🟢 ULTRA-MINIMAL: Attempting React import...");
import('react').then(React => {
  console.log("🟢 ULTRA-MINIMAL: React imported successfully", React.version);
}).catch(error => {
  console.error("🟢 ULTRA-MINIMAL: React import failed", error);
});

console.log("🟢 ULTRA-MINIMAL: Script complete");