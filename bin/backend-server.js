#!/usr/bin/env node
/**
 * Multi-Service Local Backend Server
 * Runs on port 3001 (the backend port).
 * Routes /api/<service-name>/<path> to the correct service handler.
 *
 * Frontend (port 3000) → calls http://localhost:3001/api/<service>/... 
 *                       → this server dispatches to the right handler
 */
const http = require('http');
const path = require('path');
const url = require('url');

const PORT = 3001;

// Map of service name → loaded handler
const services = {};
const SERVICE_DIR = path.resolve(__dirname, '../backend');

const SERVICE_NAMES = [
  'auth-service',
  'users-service',
  'teams-service',
  'achievements-service',
  'metadata-service',
  'performance-reviews-service',
  'development-plans-service',
  'competencies-service',
  'training-records-service',
  'project-outcomes-service',
  'reports-service',
];

// Load all available services
for (const name of SERVICE_NAMES) {
  const servicePath = path.join(SERVICE_DIR, name, 'index.js');
  try {
    const mod = require(servicePath);
    if (typeof mod.handler === 'function') {
      services[name] = mod.handler;
      console.log(`✅ Loaded: ${name}`);
    } else {
      console.warn(`⚠️  No handler in: ${name}`);
    }
  } catch (err) {
    console.warn(`⚠️  Skipped: ${name} — ${err.message}`);
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Helpers
  const setCorsHeaders = (response) => {
    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('access-control-allow-methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.setHeader('access-control-allow-headers', 'Content-Type, Authorization, Accept, X-Requested-Id');
    response.setHeader('access-control-max-age', '86400'); // 24 hours
  };

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname || '/';

    // Expect: /api/<service-name>[/<rest>]
    const match = pathname.match(/^\/api\/([^/]+)(\/.*)?$/);
    if (!match) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Local Backend Server — ACME Workforce',
        available: Object.keys(services).map(s => `/api/${s}`),
      }));
      return;
    }

    const serviceName = match[1];
    const cleanPath = match[2] || '/';
    const handler = services[serviceName];

    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Service "${serviceName}" not found or failed to load` }));
      return;
    }

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
      console.log(`${req.method} /api/${serviceName}${cleanPath}`);
      const result = await handler(event);

      const responseHeaders = {
        'content-type': 'application/json',
      };

      // Add service headers (ensuring no duplicates with case-insensitive check)
      if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey !== 'access-control-allow-origin' && 
              lowerKey !== 'access-control-allow-methods' && 
              lowerKey !== 'access-control-allow-headers') {
            responseHeaders[lowerKey] = value;
          }
        }
      }

      // Finalize CORS on the response
      setCorsHeaders(res);
      res.writeHead(result.statusCode || 200, responseHeaders);
      res.end(result.body || '');
    } catch (err) {
      console.error(`Handler error [${serviceName}]:`, err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Run: lsof -ti:${PORT} | xargs kill -9`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log('');
  console.log('==================================================');
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  console.log(`   Services loaded: ${Object.keys(services).length}`);
  console.log('==================================================');
  console.log('');
});
