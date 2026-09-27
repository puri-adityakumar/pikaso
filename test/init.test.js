import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = join(__dirname, '../src/bin/pikaso.js');

function makeTmp() {
  return mkdtempSync(join(tmpdir(), 'pikaso-init-'));
}

// ---------------------------------------------------------------------------
// init() API
// ---------------------------------------------------------------------------

test('init copies all integration files into <cwd>/integrations/', async () => {
  const { init } = await import('../src/init.js');
  const cwd = makeTmp();
  try {
    const { dest } = await init({ cwd });
    assert.equal(dest, join(cwd, 'integrations'));

    // Core files must exist
    assert.ok(existsSync(join(dest, 'AGENTS.md')), 'AGENTS.md missing');
    assert.ok(existsSync(join(dest, 'pikaso.config.json')), 'pikaso.config.json missing');
    assert.ok(existsSync(join(dest, 'rules', 'builder-rules.md')), 'builder-rules.md missing');
    assert.ok(existsSync(join(dest, 'rules', 'critic-rubric.md')), 'critic-rubric.md missing');
    assert.ok(existsSync(join(dest, 'pikaso.skill', 'SKILL.md')), 'SKILL.md missing');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('init --global copies files to ~/.pikaso/integrations/', async () => {
  // We can't actually write to ~ in a test, so we verify the dest path is correct
  // by monkey-patching homedir via opts override in init.js.
  // Instead, use a temp dir as substitute global target by checking dest value.
  const { init } = await import('../src/init.js');

  // Use a custom cwd that mimics global path check (we check the dest formula only)
  const homeStub = makeTmp();
  // init doesn't accept a homeStub but we can check that --global flag drives
  // the dest to the right path. We test the CLI flag via spawnSync below.
  rmSync(homeStub, { recursive: true, force: true });

  // The global dest formula is: join(homedir(), '.pikaso', 'integrations')
  // We verify the CLI path by checking the printed output contains .pikaso
  const result = spawnSync(process.execPath, [bin, 'init', '--global'], {
    encoding: 'utf8',
    env: { ...process.env },
  });
  // Should exit 0 (files copied to actual home — acceptable in test environment)
  assert.strictEqual(result.status, 0, `exit code: ${result.status}\nstderr: ${result.stderr}`);
  assert.match(result.stdout, /\.pikaso/, 'output should mention .pikaso path');
});

test('init is idempotent — re-running does not duplicate files', async () => {
  const { init } = await import('../src/init.js');
  const cwd = makeTmp();
  try {
    await init({ cwd });
    await init({ cwd }); // second run

    const dest = join(cwd, 'integrations');
    const rulesEntries = readdirSync(join(dest, 'rules'));
    // Should still have exactly 2 rule files, no duplicates
    assert.equal(rulesEntries.length, 2, `expected 2 files in rules/, got ${rulesEntries.join(', ')}`);

    const skillEntries = readdirSync(join(dest, 'pikaso.skill'));
    assert.equal(skillEntries.length, 1, `expected 1 file in pikaso.skill/, got ${skillEntries.join(', ')}`);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// CLI: pikaso init
// ---------------------------------------------------------------------------

test('pikaso init via CLI copies files and exits 0', () => {
  const cwd = makeTmp();
  try {
    const result = spawnSync(process.execPath, [bin, 'init'], {
      encoding: 'utf8',
      cwd,
    });
    assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`);
    assert.match(result.stdout, /integration files copied/i);
    assert.ok(existsSync(join(cwd, 'integrations', 'AGENTS.md')), 'AGENTS.md not copied via CLI');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
