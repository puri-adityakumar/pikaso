/**
 * @module api
 * REST API handlers for annotations, frames, and lock.
 * Mounted into server.js via handleApiRequest().
 *
 * Routes handled:
 *   POST  /api/frames                      → createFrame
 *   POST  /api/annotations/:frame          → append annotation
 *   PATCH /api/annotations/:frame/:id      → update annotation (status/resolvedAt)
 *   POST  /api/lock                        → lock board + generate DESIGN-SPEC.md
 */

import { randomUUID } from 'node:crypto';
import { createFrame, loadAnnotations, saveAnnotations, listVersions, revertFrame } from './board.js';
import { lockBoard } from './lock.js';

const JSON_CT = 'application/json; charset=utf-8';

// ---------------------------------------------------------------------------
// Body parser
// ---------------------------------------------------------------------------

/**
 * Read and parse the JSON request body.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<unknown>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(Object.assign(new Error('Invalid JSON body'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': JSON_CT });
  res.end(JSON.stringify(data));
  return true; // routes `return send*()` must signal "handled" to the server router
}

function send400(res, msg) { return sendJson(res, 400, { error: msg }); }
function send404(res, msg) { return sendJson(res, 404, { error: msg }); }
function send409(res, msg) { return sendJson(res, 409, { error: msg }); }
function send500(res, msg) { return sendJson(res, 500, { error: msg }); }

// ---------------------------------------------------------------------------
// Annotation validation
// ---------------------------------------------------------------------------

/**
 * Validate an annotation payload from POST /api/annotations/:frame.
 * Two types:
 *   - pin      (default): selector + box + viewport + text
 *   - freehand: points [[x,y],...] + viewport + text (+ optional color); selector omitted
 * @param {unknown} body
 * @returns {object | null} Normalized payload, or null when invalid.
 */
function validateAnnotationBody(body) {
  if (!body || typeof body !== 'object') return null;
  const b = /** @type {any} */ (body);
  if (typeof b.text !== 'string' || !b.text.trim()) return null;
  if (!b.viewport || typeof b.viewport.w !== 'number' || typeof b.viewport.h !== 'number') return null;

  if (b.type === 'freehand' || b.type === 'region') {
    const pts = b.points;
    if (!Array.isArray(pts) || pts.length < 2 ||
        !pts.every(pt => Array.isArray(pt) && pt.length === 2 &&
          typeof pt[0] === 'number' && Number.isFinite(pt[0]) &&
          typeof pt[1] === 'number' && Number.isFinite(pt[1]))) return null;
    const xs = pts.map(pt => pt[0]);
    const ys = pts.map(pt => pt[1]);
    const box = {
      x: Math.min(...xs), y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys),
    };
    const color = typeof b.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(b.color)
      ? b.color
      : (b.type === 'region' ? '#62d96b' : '#f0883e');
    return { type: b.type, selector: null, points: pts, color, box, viewport: b.viewport, text: b.text.trim() };
  }

  if (typeof b.selector !== 'string' || !b.selector.trim()) return null;
  if (!b.box || typeof b.box.x !== 'number' || typeof b.box.y !== 'number' ||
      typeof b.box.w !== 'number' || typeof b.box.h !== 'number') return null;
  return { type: 'pin', selector: b.selector.trim(), box: b.box, viewport: b.viewport, text: b.text.trim() };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/**
 * Handle API mutation routes. Returns true if the request was handled.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} root  Board root directory.
 * @param {{ broadcastSSE: (event: string, data: object) => void }} ctx
 * @returns {boolean}
 */
export function handleApiRequest(req, res, root, ctx) {
  const { broadcastSSE } = ctx;
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const method = req.method;

  // POST /api/frames
  if (method === 'POST' && path === '/api/frames') {
    readBody(req).then(body => {
      const b = /** @type {any} */ (body);
      const name = typeof b.name === 'string' ? b.name.trim() : '';
      if (!name) return send400(res, 'name is required');
      // The board UI sends the user's intent as `description`; API clients may use `purpose`.
      const purposeRaw = typeof b.description === 'string' ? b.description
                       : typeof b.purpose === 'string' ? b.purpose : '';
      const purpose = purposeRaw.trim().slice(0, 300);
      try {
        const { frame } = createFrame(root, name, purpose ? { purpose } : {});
        // Broadcast to all SSE clients that project updated
        broadcastSSE('annotations', { frame: name });
        sendJson(res, 201, frame);
      } catch (err) {
        if (err.message.includes('already exists')) return sendJson(res, 409, { error: err.message });
        if (err.message.includes('path separator') || err.message.includes('..') || err.message.includes('alphanumeric')) {
          return send400(res, err.message);
        }
        send500(res, err.message);
      }
    }).catch(err => send400(res, err.message));
    return true;
  }

  // POST /api/annotations/:frame
  const postAnn = path.match(/^\/api\/annotations\/([^/]+)$/);
  if (method === 'POST' && postAnn) {
    const frameName = decodeURIComponent(postAnn[1]);
    readBody(req).then(body => {
      const validated = validateAnnotationBody(body);
      if (!validated) return send400(res, 'selector, text, box {x,y,w,h}, and viewport {w,h} are required');

      let anns;
      try { anns = loadAnnotations(root, frameName); }
      catch (err) {
        return err.message.includes('not found') ? send404(res, err.message) : send500(res, err.message);
      }

      /** @type {import('./board.js').Annotation} */
      const ann = {
        id: randomUUID(),
        type: validated.type,
        selector: validated.selector,
        ...(validated.type === 'freehand' || validated.type === 'region'
          ? { points: validated.points, color: validated.color }
          : {}),
        box: validated.box,
        viewport: validated.viewport,
        text: validated.text,
        status: 'open',
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      };

      anns.push(ann);
      saveAnnotations(root, frameName, anns);

      // Broadcast label count update
      const openCount = anns.filter(a => a.status === 'open').length;
      broadcastSSE('annotations', { frame: frameName, open: openCount });

      sendJson(res, 201, ann);
    }).catch(err => send400(res, err.message));
    return true;
  }

  // GET /api/frames/:name/versions — mockup version history (oldest first)
  const versionsGet = path.match(/^\/api\/frames\/([^/]+)\/versions$/);
  if (method === 'GET' && versionsGet) {
    const frameName = decodeURIComponent(versionsGet[1]);
    try {
      const versions = listVersions(root, frameName);
      sendJson(res, 200, versions);
    } catch (err) {
      err.message.includes('not found') ? send404(res, err.message) : send500(res, err.message);
    }
    return true;
  }

  // POST /api/frames/:name/revert — restore a mockup version (becomes a new version)
  const versionsRevert = path.match(/^\/api\/frames\/([^/]+)\/revert$/);
  if (method === 'POST' && versionsRevert) {
    const frameName = decodeURIComponent(versionsRevert[1]);
    readBody(req).then(body => {
      const b = /** @type {any} */ (body);
      const version = Number(b.version);
      if (!Number.isInteger(version) || version < 1) {
        return send400(res, 'version (positive integer) is required');
      }
      try {
        revertFrame(root, frameName, version);
        // the mockup write fires the watcher → the reverted content becomes the latest version
        broadcastSSE('reload', { frame: frameName });
        sendJson(res, 200, { ok: true, revertedTo: version });
      } catch (err) {
        err.message.includes('not found') ? send404(res, err.message) : send500(res, err.message);
      }
    }).catch(err => send400(res, err.message));
    return true;
  }

  // PATCH /api/annotations/:frame/:id
  const patchAnn = path.match(/^\/api\/annotations\/([^/]+)\/([^/]+)$/);
  if (method === 'PATCH' && patchAnn) {
    const frameName = decodeURIComponent(patchAnn[1]);
    const annId     = decodeURIComponent(patchAnn[2]);

    readBody(req).then(body => {
      const b = /** @type {any} */ (body);

      let anns;
      try { anns = loadAnnotations(root, frameName); }
      catch (err) {
        return err.message.includes('not found') ? send404(res, err.message) : send500(res, err.message);
      }

      const ann = anns.find(a => a.id === annId);
      if (!ann) return send404(res, `Annotation "${annId}" not found in frame "${frameName}"`);

      // Apply allowed patch fields
      if (b.status === 'resolved' && ann.status !== 'resolved') {
        ann.status = 'resolved';
        ann.resolvedAt = new Date().toISOString();
      } else if (b.status === 'open' && ann.status !== 'open') {
        ann.status = 'open';
        ann.resolvedAt = null;
      }
      if (typeof b.text === 'string' && b.text.trim()) {
        ann.text = b.text.trim();
      }

      saveAnnotations(root, frameName, anns);

      // Broadcast label count update
      const openCount = anns.filter(a => a.status === 'open').length;
      broadcastSSE('annotations', { frame: frameName, open: openCount });

      sendJson(res, 200, ann);
    }).catch(err => send400(res, err.message));
    return true;
  }

  // DELETE /api/annotations/:frame/:id — remove a pin/freehand entirely
  const deleteAnn = path.match(/^\/api\/annotations\/([^/]+)\/([^/]+)$/);
  if (method === 'DELETE' && deleteAnn) {
    const frameName = decodeURIComponent(deleteAnn[1]);
    const annId     = decodeURIComponent(deleteAnn[2]);

    let anns;
    try { anns = loadAnnotations(root, frameName); }
    catch (err) {
      return err.message.includes('not found') ? send404(res, err.message) : send500(res, err.message);
    }

    const idx = anns.findIndex(a => a.id === annId);
    if (idx === -1) return send404(res, `Annotation "${annId}" not found in frame "${frameName}"`);

    const [removed] = anns.splice(idx, 1);
    saveAnnotations(root, frameName, anns);

    const openCount = anns.filter(a => a.status === 'open').length;
    broadcastSSE('annotations', { frame: frameName, open: openCount });
    sendJson(res, 200, { ok: true, deleted: removed.id });
    return true;
  }

  // POST /api/lock
  if (method === 'POST' && path === '/api/lock') {
    readBody(req).then(async (body) => {
      const b = /** @type {any} */ (body);
      const run = b.run !== false; // default: attempt agentCommand
      try {
        const result = await lockBoard(root, { run });
        // Broadcast lock event so board labels update
        broadcastSSE('lock', { framesLocked: result.framesLocked });
        sendJson(res, 200, {
          specPath: result.specPath,
          prompt: result.prompt,
          framesLocked: result.framesLocked,
          dispatch: result.dispatch,
        });
      } catch (err) {
        if (err.status === 409) {
          return send409(res, err.message);
        }
        send500(res, err.message);
      }
    }).catch(err => send400(res, err.message));
    return true;
  }

  return false; // not handled
}
