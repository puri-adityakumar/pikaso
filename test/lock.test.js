import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { lockBoard } from '../src/lock.js';
import { createFrame, loadProject, saveAnnotations, loadAnnotations } from '../src/board.js';
import { startServer } from '../src/server.js';

function makeTmp() {
  return mkdtempSync(join(tmpdir(), 'pikaso-lock-'));
}

// ---------------------------------------------------------------------------
// lockBoard() unit tests
// ---------------------------------------------------------------------------

test('lock blocked while open annotations exist → throws 409', async () => {
  const root = makeTmp();
  try {
    // Create a frame with one open annotation
    createFrame(root, 'landing', {});
    const ann = {
      id: 'ann-1',
      selector: 'h1',
      box: { x: 0, y: 0, w: 100, h: 40 },
      viewport: { w: 1280, h: 800 },
      text: 'Make bigger',
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    saveAnnotations(root, 'landing', [ann]);

    await assert.rejects(
      () => lockBoard(root),
      (err) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /open annotation/i);
        return true;
      }
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('lock succeeds when all annotations resolved → writes DESIGN-SPEC.md', async () => {
  const root = makeTmp();
  try {
    createFrame(root, 'checkout', {});
    const ann = {
      id: 'ann-2',
      selector: 'button',
      box: { x: 0, y: 0, w: 80, h: 36 },
      viewport: { w: 1280, h: 800 },
      text: 'Make orange',
      status: 'resolved',
      createdAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
    };
    saveAnnotations(root, 'checkout', [ann]);

    const result = await lockBoard(root, { run: false });

    assert.ok(result.specPath, 'specPath should be set');
    assert.ok(existsSync(result.specPath), 'DESIGN-SPEC.md should exist');
    assert.ok(result.prompt.includes('checkout'), 'prompt should mention frame name');
    assert.equal(result.framesLocked, 1);

    const spec = readFileSync(result.specPath, 'utf8');
    assert.match(spec, /DESIGN-SPEC/);
    assert.match(spec, /checkout/);
    assert.match(spec, /Make orange/);
    assert.match(spec, /resolved/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('lock sets all frames status to locked in project.json', async () => {
  const root = makeTmp();
  try {
    createFrame(root, 'frame-a', {});
    createFrame(root, 'frame-b', {});
    // No annotations → all resolved (empty = no open)

    await lockBoard(root, { run: false });

    const project = loadProject(root);
    for (const frame of project.frames) {
      assert.equal(frame.status, 'locked', `${frame.name} should be locked`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('DESIGN-SPEC.md contains all frames and resolved annotation history', async () => {
  const root = makeTmp();
  try {
    createFrame(root, 'hero', {});
    const anns = [
      {
        id: 'r1',
        selector: 'h1',
        box: { x: 0, y: 0, w: 200, h: 50 },
        viewport: { w: 1280, h: 800 },
        text: 'Increase font size',
        status: 'resolved',
        createdAt: '2026-09-27T10:00:00Z',
        resolvedAt: '2026-09-27T10:30:00Z',
      },
      {
        id: 'r2',
        selector: 'p.sub',
        box: { x: 0, y: 60, w: 300, h: 24 },
        viewport: { w: 1280, h: 800 },
        text: 'Reduce opacity',
        status: 'resolved',
        createdAt: '2026-09-27T10:01:00Z',
        resolvedAt: '2026-09-27T10:31:00Z',
      },
    ];
    saveAnnotations(root, 'hero', anns);

    const result = await lockBoard(root, { run: false });
    const spec = readFileSync(result.specPath, 'utf8');

    assert.match(spec, /hero/);
    assert.match(spec, /Increase font size/);
    assert.match(spec, /Reduce opacity/);
    assert.match(spec, /2026-09-27T10:30:00Z/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fake agentCommand receives prompt on stdin', async () => {
  const root = makeTmp();
  // Write a config that uses node to echo stdin to a temp file.
  // Config lives inside the temp root so it cannot leak into the shared OS tmpdir.
  const outFile = join(root, 'agent-out.txt');
  writeFileSync(
    join(root, 'pikaso.config.json'),
    JSON.stringify({
      agentCommand: `node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>require('fs').writeFileSync('${outFile.replace(/\\/g, '\\\\')}',d))"`,
    }),
    'utf8'
  );

  try {
    createFrame(root, 'test-frame', {});

    const result = await lockBoard(root, { run: true });

    // The agent out file should contain the prompt
    assert.ok(existsSync(outFile), 'agent output file should exist');
    const written = readFileSync(outFile, 'utf8');
    assert.ok(written.length > 0, 'agent should have received the prompt on stdin');
    assert.equal(result.dispatch?.method, 'agent');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('no agentCommand → dispatch method is clipboard or stdout', async () => {
  const root = makeTmp();
  try {
    createFrame(root, 'page', {});

    const result = await lockBoard(root, { run: true });
    assert.ok(
      result.dispatch?.method === 'clipboard' || result.dispatch?.method === 'stdout',
      `expected clipboard or stdout, got: ${result.dispatch?.method}`
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// HTTP: POST /api/lock
// ---------------------------------------------------------------------------

test('POST /api/lock blocked with 409 while open annotations exist', async () => {
  const root = makeTmp();
  let server;
  try {
    createFrame(root, 'landing', {});
    saveAnnotations(root, 'landing', [{
      id: 'x1',
      selector: 'div',
      box: { x: 0, y: 0, w: 10, h: 10 },
      viewport: { w: 1280, h: 800 },
      text: 'fix this',
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    }]);

    ({ server } = await startServer({ port: 0, root }));
    const port = server.address().port;

    const res = await fetch(`http://127.0.0.1:${port}/api/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /open annotation/i);
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('POST /api/lock succeeds → returns prompt and specPath', async () => {
  const root = makeTmp();
  let server;
  try {
    createFrame(root, 'settings', {});
    // No annotations → can lock immediately

    ({ server } = await startServer({ port: 0, root }));
    const port = server.address().port;

    const res = await fetch(`http://127.0.0.1:${port}/api/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run: false }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.specPath, 'response should include specPath');
    assert.ok(body.prompt, 'response should include prompt');
    assert.equal(body.framesLocked, 1);
    assert.ok(existsSync(body.specPath), 'DESIGN-SPEC.md should be on disk');
  } finally {
    server?.close();
    rmSync(root, { recursive: true, force: true });
  }
});
