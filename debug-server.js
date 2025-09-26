const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple debug server to capture browser requests and behavior
const server = http.createServer((req, res) => {
  console.log(`🔍 Request: ${req.method} ${req.url}`);
  console.log(`🔍 Headers:`, req.headers);
  
  if (req.url === '/debug-capture') {
    // Capture debug info from browser
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('🔍 Browser Debug Data:', body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
    return;
  }
  
  // Serve a simple test page
  if (req.url === '/' || req.url === '/debug') {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Direct Debug Test</title>
</head>
<body>
    <h1>Direct Debug Test</h1>
    <div id="results"></div>
    
    <script>
        const results = document.getElementById('results');
        results.innerHTML = '<p>✅ JavaScript executing</p>';
        
        // Try to send debug info back to server
        const debugInfo = {
            userAgent: navigator.userAgent,
            location: window.location.href,
            timestamp: new Date().toISOString(),
            jsExecuting: true,
            consoleAvailable: !!console,
            fetchAvailable: !!fetch
        };
        
        results.innerHTML += '<p>Debug info: ' + JSON.stringify(debugInfo, null, 2) + '</p>';
        
        // Try to send to debug server
        if (fetch) {
            fetch('/debug-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(debugInfo)
            }).then(() => {
                results.innerHTML += '<p>✅ Successfully sent debug info to server</p>';
            }).catch(err => {
                results.innerHTML += '<p>❌ Failed to send debug info: ' + err.message + '</p>';
            });
        }
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(8086, () => {
  console.log('🔍 Debug server running on http://localhost:8086/');
  console.log('🔍 Visit http://localhost:8086/debug to test basic JavaScript execution');
});