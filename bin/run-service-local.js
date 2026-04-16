#!/usr/bin/env node
/**
 * Local Lambda Runner
 * Serves a backend service as a plain HTTP server.
 * Strips /api/<service-name>/ prefix so the service handler
 * sees a clean path like /login, /me, etc.
 *
 * Usage: node run-service-local.js <service-name> <port>
 */
const http = require('http');
const path = require('path');
const url = require('url');

const serviceName = process.argv[2];
const port = parseInt(process.argv[3], 10) || 3001;

if (!serviceName) {
  console.error('Usage: node run-service-local.js <service-name> <port>');
  process.exit(1);
}

const servicePath = path.resolve(__dirname, '../backend', serviceName, 'index.js');
let handler;
try {
  const service = require(servicePath);
  handler = service.handler;
  if (typeof handler !== 'function') throw new Error('No exported handler function found');
} catch (err) {
  console.error(`Error loading service "${serviceName}" from ${servicePath}:`, err.message);
  process.exit(1);
}

// Strip /api/<service-name> prefix from incoming paths
const servicePrefix = `/api/${serviceName}`;

const server = http.createServer(async (req, res) => {
  // CORS headers for browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    const parsed = url.parse(req.url, true);

    // Strip /api/<serviceName> prefix if present
    let cleanPath = parsed.pathname || '/';
    if (cleanPath.startsWith(servicePrefix)) {
      cleanPath = cleanPath.slice(servicePrefix.length) || '/';
    }

    // Build a Lambda-compatible event
    const event = {
      requestContext: {
        http: {
          method: req.method,
          path: cleanPath,
        }
      },
      httpMethod: req.method,
      rawPath: cleanPath,
      path: cleanPath,
      headers: req.headers,
      body: body || null,
      isBase64Encoded: false,
      queryStringParameters: Object.keys(parsed.query).length ? parsed.query : null,
    };

    try {
      console.log(`${req.method} ${req.url} → handler(${cleanPath})`);
      const result = await handler(event);

      const responseHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...(result.headers || {}),
      };
      // Remove CORS headers from service response (we set our own)
      delete responseHeaders['access-control-allow-origin'];
      responseHeaders['Access-Control-Allow-Origin'] = '*';

      res.writeHead(result.statusCode || 200, responseHeaders);
      res.end(result.body || '');
    } catch (err) {
      console.error('Handler error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });
});

server.on('error', (err) => {
  console.error(`Server error on port ${port}:`, err.message);
  process.exit(1);
});

server.listen(port, () => {
  console.log('==================================================');
  console.log(`✅ Service: ${serviceName}`);
  console.log(`   Listening on: http://localhost:${port}`);
  console.log(`   Handles: /api/${serviceName}/* and /*`);
  console.log('==================================================');
});
