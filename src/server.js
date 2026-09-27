/**
 * @module server
 * HTTP server for the Pikaso board.
 *
 * Routes:
 *   GET  /                         → public/index.html
 *   GET  /board.js                 → public/board.js
 *   GET  /annotate.js              → public/annotate.js
 *   GET  /frames/:name/mockup.html → HTML with annotate.js injected (never written to disk)
 *   GET  /api/project              → project.json
 *   GET  /api/annotations/:name    → frames/<name>/annotations.json
 *   GET  /events                   → SSE stream
 *
 * Additional routes for the API are layered in from src/api.js.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, watch } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import { injectScript } from './inject.js';
import { loadProject, loadAnnotations } from './board.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// ---------------------------------------------------------------------------
// MIME types
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function mime(filePath) {
  return MIME[extname(filePath)] ?? 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

/** @type {Set<import('node:http').ServerResponse>} */
const sseClients = new Set();

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch { sseClients.delete(res); }
  }
}

// ---------------------------------------------------------------------------
// Board root resolution (D18)
// ---------------------------------------------------------------------------

/**
 * Resolve the board root directory based on startup flags.
 * @param {{ global?: boolean, tmp?: boolean, cwd?: string }} opts
 * @returns {string}
 */
function resolveBoardRoot(opts = {}) {
  if (opts.tmp) return join(tmpdir(), '.pikaso');
  if (opts.global) return join(homedir(), '.pikaso', 'boards', 'default');
  return join(opts.cwd ?? process.cwd(), '.pikaso');
}

// ---------------------------------------------------------------------------
// Request router
// ---------------------------------------------------------------------------

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} root  Board root directory.
 * @param {Function} apiHandler  Handler from api.js for mutation routes.
 */
function handleRequest(req, res, root, apiHandler) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // SSE
  if (req.method === 'GET' && pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // API: project
  if (req.method === 'GET' && pathname === '/api/project') {
    try {
      const project = loadProject(root);
      res.writeHead(200, { 'Content-Type': MIME['.json'] });
      res.end(JSON.stringify(project));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': MIME['.json'] });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API: annotations (GET)
  const annMatch = pathname.match(/^\/api\/annotations\/([^/]+)$/);
  if (req.method === 'GET' && annMatch) {
    const name = decodeURIComponent(annMatch[1]);
    try {
      const anns = loadAnnotations(root, name);
      res.writeHead(200, { 'Content-Type': MIME['.json'] });
      res.end(JSON.stringify(anns));
    } catch (err) {
      const status = err.message.includes('not found') ? 404 : 500;
      res.writeHead(status, { 'Content-Type': MIME['.json'] });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Frame mockup (inject script)
  const frameMatch = pathname.match(/^\/frames\/([^/]+)\/mockup\.html$/);
  if (req.method === 'GET' && frameMatch) {
    const name = decodeURIComponent(frameMatch[1]);
    const mockupPath = join(root, 'frames', name, 'mockup.html');
    if (!existsSync(mockupPath)) {
      res.writeHead(404, { 'Content-Type': MIME['.html'] });
      res.end('<h1>404 — frame not found</h1>');
      return;
    }
    const html = readFileSync(mockupPath, 'utf8');
    const injected = injectScript(html);
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(injected);
    return;
  }

  // Delegate mutation routes to apiHandler
  if (apiHandler && apiHandler(req, res, root, { broadcastSSE })) return;

  // Static: public/ files
  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = join(PUBLIC_DIR, 'index.html');
  } else {
    // Only serve files directly under public/ (no traversal)
    const rel = pathname.replace(/^\//, '');
    if (rel.includes('..')) {
      res.writeHead(400); res.end(); return;
    }
    filePath = join(PUBLIC_DIR, rel);
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    res.end('<h1>404</h1>');
    return;
  }

  res.writeHead(200, { 'Content-Type': mime(filePath) });
  res.end(readFileSync(filePath));
}

// ---------------------------------------------------------------------------
// File watcher for live reload
// ---------------------------------------------------------------------------

/**
 * Watch the frames directory for mockup.html changes and broadcast SSE reload.
 * @param {string} root  Board root.
 */
function watchFrames(root) {
  const framesDir = join(root, 'frames');
  if (!existsSync(framesDir)) return;

  try {
    watch(framesDir, { recursive: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith('mockup.html')) return;
      // filename is like "landing/mockup.html" on Linux or "landing\mockup.html" on Windows
      const parts = filename.replace(/\\/g, '/').split('/');
      const frameName = parts[0];
      broadcastSSE('reload', { frame: frameName });
    });
  } catch {
    // frames dir may not exist yet; watcher will be set up on next server start
  }
}

// ---------------------------------------------------------------------------
// startServer
// ---------------------------------------------------------------------------

/**
 * Start the Pikaso HTTP server.
 * @param {{ port?: number, global?: boolean, tmp?: boolean, cwd?: string, root?: string }} opts
 * @returns {Promise<{ server: import('node:http').Server, root: string, port: number }>}
 */
export async function startServer(opts = {}) {
  const root = opts.root ?? resolveBoardRoot(opts);

  // Lazy-load API handler to allow server to work without full board init
  let apiHandler = null;
  try {
    const { handleApiRequest } = await import('./api.js');
    apiHandler = handleApiRequest;
  } catch {
    // api.js may not exist yet (Phase 3 server, Phase 5 api)
  }

  const server = createServer((req, res) => {
    handleRequest(req, res, root, apiHandler);
  });

  const port = opts.port ?? 7625;
  await new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  // Determine mode string (D18)
  let mode = 'project';
  if (opts.tmp) mode = 'tmp';
  else if (opts.global) mode = 'global';

  const url = `http://localhost:${port}`;
  process.stdout.write(`\npikaso board running\n  ${url}\n  mode: ${mode}\n  root: ${root}\n\n`);

  watchFrames(root);

  return { server, root, port };
}
