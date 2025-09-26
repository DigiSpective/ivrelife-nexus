const http = require('http');

// Simple debug server to test browser JavaScript execution
const server = http.createServer((req, res) => {
  console.log(`🔍 Request: ${req.method} ${req.url}`);
  
  if (req.url === '/debug-capture' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('📊 Browser Debug Data Received:', JSON.parse(body));
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(JSON.stringify({ received: true }));
    });
    return;
  }
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  const html = `<!DOCTYPE html>
<html>
<head><title>Browser JS Test</title></head>
<body>
    <h1 id="status">Testing...</h1>
    <div id="log"></div>
    <script>
        const status = document.getElementById('status');
        const log = document.getElementById('log');
        
        status.textContent = 'JavaScript is Working!';
        status.style.color = 'green';
        log.innerHTML += '<p>✅ DOM manipulation works</p>';
        
        const debugInfo = {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            jsWorking: true,
            consoleExists: !!console,
            fetchExists: !!fetch
        };
        
        log.innerHTML += '<pre>' + JSON.stringify(debugInfo, null, 2) + '</pre>';
        
        if (fetch) {
            fetch('http://localhost:8086/debug-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(debugInfo)
            }).then(() => {
                log.innerHTML += '<p>✅ Data sent to debug server</p>';
            }).catch(err => {
                log.innerHTML += '<p>❌ Debug server error: ' + err.message + '</p>';
            });
        }
        
        console.log('🔍 Debug info:', debugInfo);
    </script>
</body>
</html>`;
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(8086, () => {
  console.log('🔍 Debug server running on http://localhost:8086/');
});