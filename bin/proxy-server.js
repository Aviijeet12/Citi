#!/usr/bin/env node

/**
 * Development CORS Proxy Server
 *
 * This proxy server forwards requests from the React frontend (localhost:3000)
 * to Lambda Function URLs in LocalStack, working around CORS issues.
 *
 * Only needed for LocalStack development. AWS production handles CORS correctly.
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// Read endpoint mappings from .env.local
const envFile = path.join(__dirname, '../frontend/.env.local');
let endpoints = {};

try {
  const envContent = fs.readFileSync(envFile, 'utf8');

  function readEnvValue(content, key) {
    const lines = content.split(/\r?\n/);
    const prefix = `${key}=`;
    const line = lines.find((value) => value.startsWith(prefix));
    if (!line) return null;
    return line.slice(prefix.length).trim();
  }

  function stripSurroundingQuotes(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      return text.slice(1, -1);
    }
    return text;
  }

  const rawEndpoints =
    readEnvValue(envContent, 'VITE_API_ENDPOINTS') ||
    readEnvValue(envContent, 'REACT_APP_API_ENDPOINTS');

  if (rawEndpoints) {
    endpoints = JSON.parse(stripSurroundingQuotes(rawEndpoints));
    console.log('Loaded endpoints:', Object.keys(endpoints));
  }
} catch (err) {
  console.error('Could not load endpoints from .env.local:', err.message);
  console.error('Make sure to run: ./bin/generate-env.sh first');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Enable CORS (no cookies/credentials; JWT is sent via Authorization header)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, Accept, X-Requested-With, X-Request-Id, X-Requested-Id'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse request path: /api/{endpoint_name}
  const parsedUrl = url.parse(req.url);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

  if (pathParts[0] !== 'api' || pathParts.length < 2) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Development CORS Proxy Server',
      usage: 'GET /api/{endpoint_name}',
      endpoints: Object.keys(endpoints).map(name => `http://localhost:${PORT}/api/${name}`)
    }, null, 2));
    return;
  }

  const endpointName = pathParts[1];
  const targetBaseUrl = endpoints[endpointName];

  if (!targetBaseUrl) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `Unknown endpoint: ${endpointName}`,
      available: Object.keys(endpoints)
    }));
    return;
  }

  const nestedPath = pathParts.slice(2).join('/');
  const targetUrl = `${String(targetBaseUrl).replace(/\/+$/, '')}${nestedPath ? `/${nestedPath}` : ''}${parsedUrl.search || ''}`;

  console.log(`${req.method} ${parsedUrl.pathname}${parsedUrl.search || ''} -> ${targetUrl}`);

  // Parse target URL
  const target = url.parse(targetUrl);
  const protocol = target.protocol === 'https:' ? https : http;

  // Forward request - strip all CORS-related and browser headers
  const headers = { ...req.headers };

  // Remove headers that cause LocalStack CORS issues
  delete headers.origin;
  delete headers.referer;
  delete headers['sec-fetch-site'];
  delete headers['sec-fetch-mode'];
  delete headers['sec-fetch-dest'];

  // Keep only essential headers, but *do* forward authentication headers.
  const options = {
    hostname: target.hostname,
    port: target.port,
    path: target.path,
    method: req.method,
    headers: {
      accept: headers.accept || 'application/json',
      'content-type': headers['content-type'] || 'application/json',
      'user-agent': headers['user-agent'] || 'proxy-server',

      // Auth / tracing
      ...(headers.authorization ? { authorization: headers.authorization } : {}),
      ...(headers.cookie ? { cookie: headers.cookie } : {}),
      ...(headers['x-request-id'] ? { 'x-request-id': headers['x-request-id'] } : {}),

      // Preserve the client-visible host/proto for OAuth redirect_uri construction
      'x-forwarded-host': req.headers.host,
      'x-forwarded-proto': req.socket.encrypted ? 'https' : 'http',

      // Target host for the upstream request
      host: target.host,
    },
  };

  const proxyReq = protocol.request(options, (proxyRes) => {
    // Filter out CORS headers from Lambda response since we set our own
    const headers = { ...proxyRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];
    delete headers['access-control-max-age'];

    // Forward status and filtered headers
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log('');
  console.log('==================================================');
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log('==================================================');
  console.log('');
  console.log('Available endpoints:');
  for (const [name, targetUrl] of Object.entries(endpoints)) {
    console.log(`  /api/${name} -> ${targetUrl}`);
  }
  console.log('');
  console.log('==================================================');
  console.log(`Update frontend to use: http://localhost:${PORT}`);
  console.log('==================================================');
  console.log('');
});
