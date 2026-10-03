/**
 * @module server
 * HTTP server for the Pikaso board.
 *
 * Routes:
 *   GET  /                         → public/index.html
 *   GET  /board.js                 → public/board.js
 *   GET  /annotate.js              → public/annotate.js
 *   GET  /frames/:name/mockup.html → HTML with annotate.js injected (never written to disk)
 *   GET  /site/                → redirect to /site/index.html (HTML mode entry)
 *   GET  /site/index.html      → entry frame as a site page (annotate.js injected)
 *   GET  /site/:name.html      → frame :name as a site page (annotate.js injected)
 *   GET  /api/project              → project.json
 *   GET  /api/annotations/:name    → frames/<name>/annotations.json
 *   GET  /events                   → SSE stream
 *
 * Additional routes for the API are layered in from src/api.js.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, watch, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
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

  // HTML mode: mockups as a browsable multi-page site
  //   /site/            → redirect to /site/index.html
  //   /site/index.html  → entry frame (named index/home, else the first frame)
  //   /site/<name>.html → that frame's mockup, annotate.js injected
  if (req.method === 'GET' && (pathname === '/site' || pathname === '/site/')) {
    res.writeHead(302, { Location: '/site/index.html' });
    res.end();
    return;
  }
  const siteMatch = pathname.match(/^\/site\/([^/]+\.html)$/);
  if (req.method === 'GET' && siteMatch) {
    const file = decodeURIComponent(siteMatch[1]);
    let mockupPath = null;
    if (file === 'index.html') {
      try {
        const project = loadProject(root);
        const frames = project.frames ?? [];
        const entry = frames.find(f => f.name === 'index' || f.name === 'home') ?? frames[0];
        if (entry) mockupPath = join(root, 'frames', entry.name, 'mockup.html');
      } catch { /* no project yet → falls through to 404 */ }
    } else {
      const name = file.slice(0, -'.html'.length);
      mockupPath = join(root, 'frames', name, 'mockup.html');
    }
    if (!mockupPath || mockupPath.includes('..') || !existsSync(mockupPath)) {
      res.writeHead(404, { 'Content-Type': MIME['.html'] });
      res.end('<h1>404 — page not found</h1>');
      return;
    }
    const injected = injectScript(readFileSync(mockupPath, 'utf8'));
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
 * The frames dir is created if missing so a fresh board gets live reload from
 * the first frame onward. The returned watcher MUST be closed (startServer
 * wires it to server 'close'); an open FSWatcher keeps the event loop alive.
 * @param {string} root  Board root.
 * @returns {import('node:fs').FSWatcher|null}
 */
function watchFrames(root) {
  const framesDir = join(root, 'frames');
  try {
    mkdirSync(framesDir, { recursive: true });
    const watcher = watch(framesDir, { recursive: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith('mockup.html')) return;
      // filename is like "landing/mockup.html" on Linux or "landing\mockup.html" on Windows
      const parts = filename.replace(/\\/g, '/').split('/');
      const frameName = parts[0];
      broadcastSSE('reload', { frame: frameName });
    });
    watcher.on('error', () => { /* dir removed mid-run: live reload just stops */ });
    return watcher;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// startServer
// ---------------------------------------------------------------------------

/**
 * Start the Pikaso HTTP server.
 * @param {{ port?: number, global?: boolean, tmp?: boolean, cwd?: string, root?: string }} opts
 * @returns {Promise<{ server: import('node:http').Server, root: string, port: number, watcher: import('node:fs').FSWatcher|null }>}
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

  const watcher = watchFrames(root);

  // An open FSWatcher keeps the event loop alive — tie its lifetime to the server.
  server.on('close', () => { try { watcher?.close(); } catch { /* already closed */ } });

  return { server, root, port, watcher };
}
