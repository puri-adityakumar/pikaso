import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  loadProject,
  saveProject,
  createFrame,
  updateFrame,
  loadAnnotations,
  saveAnnotations,
  snapshotVersion,
  listVersions,
  revertFrame,
} from '../src/board.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpRoot() {
  return mkdtempSync(join(tmpdir(), 'pikaso-test-'));
}

// ---------------------------------------------------------------------------
// loadProject / saveProject
// ---------------------------------------------------------------------------

test('loadProject returns default when no project.json', () => {
  const root = tmpRoot();
  try {
    const proj = loadProject(root);
    assert.equal(typeof proj.name, 'string');
    assert.deepEqual(proj.frames, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveProject + loadProject roundtrip', () => {
  const root = tmpRoot();
  try {
    const original = { name: 'test-board', frames: [] };
    saveProject(root, original);
    const loaded = loadProject(root);
    assert.deepEqual(loaded, original);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('loadProject throws clear error on invalid JSON', () => {
  const root = tmpRoot();
  try {
    saveProject(root, { name: 'x', frames: [] });
    // Corrupt the file
    const p = join(root, 'project.json');
    writeFileSync(p, 'not json', 'utf8');
    assert.throws(() => loadProject(root), /invalid JSON/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveProject is atomic (writes .tmp then renames)', () => {
  const root = tmpRoot();
  try {
    saveProject(root, { name: 'board', frames: [] });
    // .tmp should not exist after save
    assert(!existsSync(join(root, 'project.json.tmp')), '.tmp should be cleaned up');
    assert(existsSync(join(root, 'project.json')), 'project.json should exist');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// createFrame
// ---------------------------------------------------------------------------

test('createFrame writes mockup.html and annotations.json', () => {
  const root = tmpRoot();
  try {
    const { frame } = createFrame(root, 'landing');
    assert.equal(frame.name, 'landing');
    assert.equal(frame.status, 'draft');
    assert(existsSync(join(root, 'frames', 'landing', 'mockup.html')));
    assert(existsSync(join(root, 'frames', 'landing', 'annotations.json')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createFrame registers frame in project.json', () => {
  const root = tmpRoot();
  try {
    createFrame(root, 'checkout');
    const project = loadProject(root);
    assert.equal(project.frames.length, 1);
    assert.equal(project.frames[0].name, 'checkout');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createFrame annotations.json starts as empty array', () => {
  const root = tmpRoot();
  try {
    createFrame(root, 'settings');
    const anns = loadAnnotations(root, 'settings');
    assert.deepEqual(anns, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createFrame assigns unique ids across multiple frames', () => {
  const root = tmpRoot();
  try {
    const { frame: f1 } = createFrame(root, 'frame-one');
    const { frame: f2 } = createFrame(root, 'frame-two');
    assert.notEqual(f1.id, f2.id);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createFrame rejects name with slash', () => {
  const root = tmpRoot();
  try {
    assert.throws(() => createFrame(root, 'bad/name'), /path separator/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createFrame rejects name with ..', () => {
  const root = tmpRoot();
  try {
    assert.throws(() => createFrame(root, '..'), /\.\./);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createFrame rejects duplicate frame name', () => {
  const root = tmpRoot();
  try {
    createFrame(root, 'hero');
    assert.throws(() => createFrame(root, 'hero'), /already exists/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// updateFrame
// ---------------------------------------------------------------------------

test('updateFrame mutates geometry in project.json', () => {
  const root = tmpRoot();
  try {
    const { frame } = createFrame(root, 'card');
    updateFrame(root, frame.id, { x: 100, y: 200, w: 1024, h: 768 });
    const project = loadProject(root);
    const f = project.frames[0];
    assert.equal(f.x, 100);
    assert.equal(f.y, 200);
    assert.equal(f.w, 1024);
    assert.equal(f.h, 768);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('updateFrame throws on unknown frame id', () => {
  const root = tmpRoot();
  try {
    saveProject(root, { name: 'x', frames: [] });
    assert.throws(() => updateFrame(root, 'no-such-id', { x: 0 }), /not found/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Annotations roundtrip
// ---------------------------------------------------------------------------

test('saveAnnotations + loadAnnotations roundtrip', () => {
  const root = tmpRoot();
  try {
    createFrame(root, 'hero');
    const ann = {
      id: 'ann-1',
      selector: 'body > h1',
      box: { x: 0, y: 0, w: 100, h: 30 },
      viewport: { w: 800, h: 600 },
      text: 'Make this larger',
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    saveAnnotations(root, 'hero', [ann]);
    const loaded = loadAnnotations(root, 'hero');
    assert.deepEqual(loaded, [ann]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Version history (snapshot / list / revert)
// ---------------------------------------------------------------------------

test('snapshotVersion writes v1 then v2, no-op on identical content', () => {
  const root = tmpRoot();
  try {
    createFrame(root, 'landing');

    const first = snapshotVersion(root, 'landing', '<h1>v1</h1>');
    assert.deepEqual(first, { version: 1 });
    const same = snapshotVersion(root, 'landing', '<h1>v1</h1>');
    assert.equal(same, null, 'identical content is a no-op');
    const second = snapshotVersion(root, 'landing', '<h1>v2</h1>');
    assert.deepEqual(second, { version: 2 });

    const versions = listVersions(root, 'landing');
    assert.equal(versions.length, 2);
    assert.equal(versions[0].version, 1);
    assert.equal(versions[1].version, 2);
    assert.ok(versions[1].mtime);
    assert.ok(versions[1].bytes > 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('listVersions returns empty for a frame without history', () => {
  const root = tmpRoot();
  try {
    createFrame(root, 'fresh');
    assert.deepEqual(listVersions(root, 'fresh'), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('listVersions throws for unknown frame', () => {
  const root = tmpRoot();
  try {
    assert.throws(() => listVersions(root, 'nope'), /not found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('revertFrame restores version content to mockup.html', () => {
  const root = tmpRoot();
  try {
    createFrame(root, 'landing');
    snapshotVersion(root, 'landing', '<h1>v1</h1>');
    snapshotVersion(root, 'landing', '<h1>v2</h1>');

    revertFrame(root, 'landing', 1);
    assert.equal(readFileSync(join(root, 'frames', 'landing', 'mockup.html'), 'utf8'), '<h1>v1</h1>');

    // reverting is itself a change → becomes the next version (linear history)
    const versions = listVersions(root, 'landing');
    assert.equal(versions.length, 3);
    assert.equal(versions[2].version, 3);

    assert.throws(() => revertFrame(root, 'landing', 99), /not found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
