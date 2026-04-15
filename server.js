const http = require('http');

const PORT    = process.env.PORT    || 3000;
const VERSION = process.env.VERSION || '1.0.0';
const HOSTNAME = require('os').hostname();

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version: VERSION }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MyApp v${VERSION}</title>
  <div class="badge">UPDATED - LIVE</div>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: #f1f5f9;
    }
    .card {
      text-align: center;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 48px 64px;
      max-width: 480px;
    }
    .badge {
      display: inline-block;
      background: #6366f1;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 14px;
      border-radius: 999px;
      letter-spacing: 0.5px;
      margin-bottom: 24px;
    }
    h1 { font-size: 2.4rem; font-weight: 700; margin-bottom: 8px; }
    .version {
      font-size: 4rem;
      font-weight: 800;
      color: #818cf8;
      margin: 16px 0;
      letter-spacing: -1px;
    }
    .meta {
      font-size: 13px;
      color: #64748b;
      margin-top: 24px;
      line-height: 2;
    }
    .pod { color: #38bdf8; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    // <div class="badge">LIVE</div>
    <div class="badge">DEMO v2</div>
    <h1>MyApp</h1>
    <div class="version">v${VERSION}</div>
    <div class="meta">
      Pod: <span class="pod">${HOSTNAME}</span><br/>
      Uptime: ${Math.floor(process.uptime())}s<br/>
      Node: ${process.version}
    </div>
  </div>
</body>
</html>
  `);
});

server.listen(PORT, () => {
  console.log(`MyApp v${VERSION} running on port ${PORT}`);
});