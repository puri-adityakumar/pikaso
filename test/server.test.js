import { test, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { startServer } from '../src/server.js';
import { createFrame } from '../src/board.js';
import { injectScript } from '../src/inject.js';

// ---------------------------------------------------------------------------
// injectScript unit tests
// ---------------------------------------------------------------------------

test('injectScript inserts before </body>', () => {
  const html = '<html><body><p>hello</p></body></html>';
  const result = injectScript(html);
  assert.ok(result.includes('<script src="/annotate.js"'), 'script tag present');
  assert.ok(result.indexOf('<script') < result.indexOf('</body>'), 'injected before </body>');
});

test('injectScript appends when no </body>', () => {
  const html = '<html><body><p>no close</p>';
  const result = injectScript(html);
  assert.ok(result.includes('<script src="/annotate.js"'), 'script tag appended');
  assert.ok(result.endsWith('</script>') || result.includes('annotate.js'), 'appended at end');
});

test('injectScript handles case-insensitive </BODY>', () => {
  const html = '<HTML><BODY><p>hi</p></BODY></HTML>';
  const result = injectScript(html);
  assert.ok(result.includes('<script src="/annotate.js"'));
});

// ---------------------------------------------------------------------------
// Server integration tests
// ---------------------------------------------------------------------------

function tmpRoot() {
  return mkdtempSync(join(tmpdir(), 'pikaso-srv-'));
}

async function get(port, path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  return res;
}

test('GET / returns 200 and index.html content', async () => {
  const root = tmpRoot();
  let server;
  try {
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await get(port, '/');
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<html'), 'should contain html');
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('GET /board.js returns 200 and JS MIME', async () => {
  const root = tmpRoot();
  let server;
  try {
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await get(port, '/board.js');
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('javascript'));
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('GET /frames/:name/mockup.html contains injected script and original markup', async () => {
  const root = tmpRoot();
  let server;
  try {
    // Create a frame with known content
    createFrame(root, 'landing');
    // Overwrite mockup with known HTML
    const mockupPath = join(root, 'frames', 'landing', 'mockup.html');
    writeFileSync(mockupPath, '<html><body><h1>Hello</h1></body></html>', 'utf8');

    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await get(port, '/frames/landing/mockup.html');
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<h1>Hello</h1>'), 'original markup preserved');
    assert.ok(text.includes('annotate.js'), 'annotate.js injected');
    assert.ok(text.indexOf('annotate.js') < text.indexOf('</body>'), 'injected before </body>');
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('GET /frames/:name/mockup.html handles missing </body>', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'nochrome');
    const mockupPath = join(root, 'frames', 'nochrome', 'mockup.html');
    writeFileSync(mockupPath, '<h1>No body tag</h1>', 'utf8');

    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await get(port, '/frames/nochrome/mockup.html');
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('annotate.js'), 'script still injected');
    assert.ok(text.includes('<h1>No body tag</h1>'), 'original content preserved');
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('GET /frames/unknown/mockup.html returns 404', async () => {
  const root = tmpRoot();
  let server;
  try {
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await get(port, '/frames/unknown/mockup.html');
    assert.equal(res.status, 404);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('GET /api/project returns project JSON', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'hero');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();
    const res = await get(port, '/api/project');
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('json'));
    const data = await res.json();
    assert.ok(Array.isArray(data.frames));
    assert.equal(data.frames[0].name, 'hero');
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('GET /events returns SSE stream', async () => {
  const root = tmpRoot();
  let server;
  try {
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    // Connect to SSE; read first chunk and verify headers
    const ctrl = new AbortController();
    const res = await fetch(`http://127.0.0.1:${port}/events`, { signal: ctrl.signal });
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/event-stream'));
    ctrl.abort();
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('SSE emits reload after mockup file edit', async () => {
  const root = tmpRoot();
  let server;
  try {
    createFrame(root, 'watch-frame');
    ({ server } = await startServer({ port: 0, root }));
    const { port } = server.address();

    // Collect SSE events for 1.5s
    const events = [];
    const ctrl = new AbortController();
    const ssePromise = (async () => {
      const res = await fetch(`http://127.0.0.1:${port}/events`, { signal: ctrl.signal });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          events.push(decoder.decode(value));
        }
      } catch { /* aborted */ }
    })();

    // Give SSE connection time to establish
    await new Promise(r => setTimeout(r, 200));

    // Edit the mockup file to trigger watcher
    const mockupPath = join(root, 'frames', 'watch-frame', 'mockup.html');
    writeFileSync(mockupPath, '<h1>Updated</h1>', 'utf8');

    // Wait for event to propagate
    await new Promise(r => setTimeout(r, 800));
    ctrl.abort();
    await ssePromise.catch(() => {});

    const allEvents = events.join('');
    assert.ok(allEvents.includes('reload'), `expected reload event, got: ${allEvents}`);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});
