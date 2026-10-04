import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { startServer } from '../src/server.js';
import { createFrame, loadAnnotations } from '../src/board.js';
import { buildSelectorPath } from '../src/selector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpRoot() {
  return mkdtempSync(join(tmpdir(), 'pikaso-api-'));
}

async function json(port, path, opts = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

const VALID_ANN = {
  selector: 'body > h1',
  box: { x: 10, y: 20, w: 200, h: 40 },
  viewport: { w: 800, h: 600 },
  text: 'Make this bigger',
};

// ---------------------------------------------------------------------------
// POST /api/frames
// ---------------------------------------------------------------------------

test('POST /api/frames creates frame and returns 201', async () => {
  const root = tmpRoot();
  let server;
  try {
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const { status, body } = await json(port, '/api/frames', {
      method: 'POST',
      body: JSON.stringify({ name: 'landing', description: 'Landing page' }),
    });
    assert.equal(status, 201);
    assert.equal(body.name, 'landing');
    assert.equal(body.status, 'draft');
    assert.ok(body.id);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('POST /api/frames with invalid name returns 400', async () => {
  const root = tmpRoot();
  let server;
  try {
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const { status } = await json(port, '/api/frames', {
      method: 'POST',
      body: JSON.stringify({ name: 'bad/name' }),
    });
    assert.equal(status, 400);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// POST /api/annotations/:frame
// ---------------------------------------------------------------------------

test('POST /api/annotations creates annotation with id and open status', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'hero');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    const { status, body } = await json(port, '/api/annotations/hero', {
      method: 'POST',
      body: JSON.stringify(VALID_ANN),
    });
    assert.equal(status, 201);
    assert.ok(body.id, 'id assigned');
    assert.equal(body.status, 'open');
    assert.equal(body.text, VALID_ANN.text);
    assert.equal(body.selector, VALID_ANN.selector);
    assert.ok(body.createdAt);
    assert.equal(body.resolvedAt, null);

    // Persisted to disk
    const anns = loadAnnotations(root, 'hero');
    assert.equal(anns.length, 1);
    assert.equal(anns[0].id, body.id);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('POST /api/annotations with missing fields returns 400', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'hero');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    const { status } = await json(port, '/api/annotations/hero', {
      method: 'POST',
      body: JSON.stringify({ selector: 'h1' }), // missing text, box, viewport
    });
    assert.equal(status, 400);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('POST /api/annotations accepts a freehand payload and stores points', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'sketch');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/annotations/sketch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'freehand',
        points: [[10, 10], [40, 25], [80, 20]],
        color: '#f0883e',
        viewport: { w: 800, h: 600 },
        text: 'Freehand annotation',
      }),
    });
    assert.equal(res.status, 201);
    const ann = await res.json();
    assert.equal(ann.type, 'freehand');
    assert.equal(ann.selector, null);
    assert.equal(ann.points.length, 3);
    assert.equal(ann.color, '#f0883e');

    const stored = JSON.parse(readFileSync(join(root, 'frames', 'sketch', 'annotations.json'), 'utf8'));
    assert.equal(stored[0].type, 'freehand');
    assert.equal(stored[0].status, 'open');
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('POST /api/annotations rejects a freehand payload without points', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'sketch2');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/annotations/sketch2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'freehand', viewport: { w: 800, h: 600 }, text: 'no points' }),
    });
    assert.equal(res.status, 400);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('POST /api/annotations to unknown frame returns 404', async () => {
  const root = tmpRoot();
  let server;
  try {
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    const { status } = await json(port, '/api/annotations/no-such-frame', {
      method: 'POST',
      body: JSON.stringify(VALID_ANN),
    });
    assert.equal(status, 404);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/annotations/:frame/:id
// ---------------------------------------------------------------------------

test('PATCH resolves annotation and sets resolvedAt', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'checkout');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    // Create first
    const { body: created } = await json(port, '/api/annotations/checkout', {
      method: 'POST',
      body: JSON.stringify(VALID_ANN),
    });

    // Resolve
    const { status, body } = await json(port, `/api/annotations/checkout/${created.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
    assert.equal(status, 200);
    assert.equal(body.status, 'resolved');
    assert.ok(body.resolvedAt, 'resolvedAt should be set');

    // Persisted
    const anns = loadAnnotations(root, 'checkout');
    assert.equal(anns[0].status, 'resolved');
    assert.ok(anns[0].resolvedAt);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('PATCH unknown annotation id returns 404', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'settings');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    const { status } = await json(port, '/api/annotations/settings/no-such-id', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
    assert.equal(status, 404);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('Annotations persist across server restart', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'persist-test');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    // Create annotation
    const { body: created } = await json(port, '/api/annotations/persist-test', {
      method: 'POST',
      body: JSON.stringify(VALID_ANN),
    });
    server.close();

    // Re-read directly from disk (simulates server restart)
    const anns = loadAnnotations(root, 'persist-test');
    assert.equal(anns.length, 1);
    assert.equal(anns[0].id, created.id);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Selector path builder (DOM-level unit tests via src/selector.js)
// ---------------------------------------------------------------------------

test('buildSelectorPath: element with id uses #id shortcut', () => {
  // Simulate a minimal stub document using a plain object tree
  const el = {
    id: 'hero',
    tagName: 'SECTION',
    nodeType: 1,
    parentElement: {
      tagName: 'BODY',
      nodeType: 1,
      parentElement: null,
      children: [],
    },
    get children() { return []; },
  };
  // patch parentElement.children to include el
  el.parentElement.children = [el];
  const path = buildSelectorPath(el, el.parentElement);
  assert.ok(path.includes('#hero'), `Expected #hero in path, got: ${path}`);
});

test('buildSelectorPath: nth-of-type for sibling disambiguation', () => {
  const parent = { tagName: 'BODY', nodeType: 1, parentElement: null, id: '', children: [] };
  const el1 = { id: '', tagName: 'DIV', nodeType: 1, parentElement: parent, children: [] };
  const el2 = { id: '', tagName: 'DIV', nodeType: 1, parentElement: parent, children: [] };
  parent.children = [el1, el2];
  const path1 = buildSelectorPath(el1, parent);
  const path2 = buildSelectorPath(el2, parent);
  assert.ok(path1.includes('nth-of-type(1)'), `path1: ${path1}`);
  assert.ok(path2.includes('nth-of-type(2)'), `path2: ${path2}`);
  assert.notEqual(path1, path2, 'siblings must have different paths');
});

test('buildSelectorPath: single child of type uses plain tag', () => {
  const parent = { tagName: 'BODY', nodeType: 1, parentElement: null, id: '', children: [] };
  const el = { id: '', tagName: 'H1', nodeType: 1, parentElement: parent, children: [] };
  parent.children = [el];
  const path = buildSelectorPath(el, parent);
  assert.ok(!path.includes('nth-of-type'), `should not use nth-of-type for single child, got: ${path}`);
  assert.ok(path.includes('h1'), `should include h1, got: ${path}`);
});
