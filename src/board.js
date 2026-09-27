/**
 * @module board
 * Board state: load, save, and mutate project.json + per-frame files.
 * All writes are atomic (write to .tmp → rename).
 */

import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Schemas (JSDoc only — no runtime validation library)
// ---------------------------------------------------------------------------

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Box
 * @typedef {{ w: number, h: number }} Viewport
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   x: number,
 *   y: number,
 *   w: number,
 *   h: number,
 *   status: 'draft' | 'locked'
 * }} Frame
 *
 * @typedef {{
 *   name: string,
 *   frames: Frame[]
 * }} Project
 *
 * @typedef {{
 *   id: string,
 *   selector: string,
 *   box: Box,
 *   viewport: Viewport,
 *   text: string,
 *   status: 'open' | 'resolved',
 *   createdAt: string,
 *   resolvedAt: string | null
 * }} Annotation
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Write data atomically: serialise → write to .tmp → rename into place.
 * @param {string} filePath  Destination file path.
 * @param {unknown} data     Value to JSON-serialise.
 */
function atomicWrite(filePath, data) {
  const tmp = filePath + '.tmp';
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  renameSync(tmp, filePath);
}

/**
 * Reject frame names that could escape the frames/ directory.
 * @param {string} name
 */
function assertSafeName(name) {
  if (!name || typeof name !== 'string') throw new Error('Frame name must be a non-empty string');
  if (name.includes('/') || name.includes('\\')) throw new Error(`Frame name must not contain path separators: "${name}"`);
  if (name.includes('..')) throw new Error(`Frame name must not contain "..": "${name}"`);
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error(`Frame name must be alphanumeric/dash/underscore only: "${name}"`);
}

// ---------------------------------------------------------------------------
// Project load / save
// ---------------------------------------------------------------------------

/**
 * Load project.json from a board root directory.
 * Creates a default project if none exists yet.
 * @param {string} root  Path to the board root (e.g. `.pikaso/`).
 * @returns {Project}
 * @throws {Error} If project.json exists but contains invalid JSON.
 */
export function loadProject(root) {
  const projectPath = join(root, 'project.json');
  if (!existsSync(projectPath)) {
    const name = basename(process.cwd());
    return { name, frames: [] };
  }
  let raw;
  try {
    raw = readFileSync(projectPath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read project.json: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`project.json contains invalid JSON at ${projectPath}`);
  }
}

/**
 * Persist the project to disk atomically.
 * @param {string} root     Board root directory.
 * @param {Project} project
 */
export function saveProject(root, project) {
  mkdirSync(root, { recursive: true });
  const projectPath = join(root, 'project.json');
  atomicWrite(projectPath, project);
}

// ---------------------------------------------------------------------------
// Frame operations
// ---------------------------------------------------------------------------

/** Default mockup HTML for new frames */
function starterHtml(name) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      background: #fff;
      color: #1f2328;
      padding: 2rem;
    }
    .placeholder {
      border: 2px dashed #d0d7de;
      border-radius: 6px;
      padding: 3rem;
      text-align: center;
      color: #57606a;
    }
  </style>
</head>
<body>
  <div class="placeholder">
    <h1>${name}</h1>
    <p>Mockup goes here — ask Bob to design this screen.</p>
  </div>
</body>
</html>
`;
}

/**
 * Create a new frame folder with a starter mockup and empty annotations list.
 * Registers the frame in project.json (atomic save).
 *
 * @param {string} root   Board root directory.
 * @param {string} name   Frame name (alphanumeric, dash, underscore only).
 * @param {{ x?: number, y?: number, w?: number, h?: number }} [opts]
 * @returns {{ project: Project, frame: Frame }}
 * @throws {Error} If name is unsafe or already exists.
 */
export function createFrame(root, name, opts = {}) {
  assertSafeName(name);

  const project = loadProject(root);
  if (project.frames.some(f => f.name === name)) {
    throw new Error(`Frame "${name}" already exists`);
  }

  // Determine position — auto-cascade so frames don't overlap
  const existingCount = project.frames.length;
  const frame = {
    id: randomUUID(),
    name,
    x: opts.x ?? existingCount * 900,
    y: opts.y ?? 0,
    w: opts.w ?? 800,
    h: opts.h ?? 600,
    status: 'draft',
  };

  // Create frame directory + files
  const frameDir = join(root, 'frames', name);
  mkdirSync(frameDir, { recursive: true });

  const mockupPath = join(frameDir, 'mockup.html');
  writeFileSync(mockupPath, starterHtml(name), 'utf8');

  const annotationsPath = join(frameDir, 'annotations.json');
  atomicWrite(annotationsPath, []);

  // Register in project (atomic)
  project.frames.push(frame);
  saveProject(root, project);

  return { project, frame };
}

/**
 * Update frame geometry or status in project.json (atomic).
 * @param {string} root
 * @param {string} frameId  Frame `id` (UUID).
 * @param {Partial<Pick<Frame, 'x'|'y'|'w'|'h'|'status'>>} patch
 * @returns {Project}
 * @throws {Error} If frameId not found.
 */
export function updateFrame(root, frameId, patch) {
  const project = loadProject(root);
  const frame = project.frames.find(f => f.id === frameId);
  if (!frame) throw new Error(`Frame id "${frameId}" not found`);
  Object.assign(frame, patch);
  saveProject(root, project);
  return project;
}

// ---------------------------------------------------------------------------
// Annotation helpers
// ---------------------------------------------------------------------------

/**
 * Load annotations for a named frame.
 * @param {string} root
 * @param {string} name  Frame name.
 * @returns {Annotation[]}
 * @throws {Error} If annotations.json is missing or invalid.
 */
export function loadAnnotations(root, name) {
  assertSafeName(name);
  const p = join(root, 'frames', name, 'annotations.json');
  if (!existsSync(p)) throw new Error(`annotations.json not found for frame "${name}"`);
  let raw;
  try { raw = readFileSync(p, 'utf8'); } catch (e) { throw new Error(`Cannot read annotations for "${name}": ${e.message}`); }
  try { return JSON.parse(raw); } catch { throw new Error(`annotations.json contains invalid JSON for frame "${name}"`); }
}

/**
 * Save annotations atomically.
 * @param {string} root
 * @param {string} name  Frame name.
 * @param {Annotation[]} annotations
 */
export function saveAnnotations(root, name, annotations) {
  assertSafeName(name);
  const p = join(root, 'frames', name, 'annotations.json');
  atomicWrite(p, annotations);
}
