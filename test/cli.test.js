import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = join(__dirname, '../src/bin/pikaso.js');

test('--help prints usage', () => {
  const result = spawnSync(process.execPath, [bin, '--help'], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0, `exit code: ${result.status}\nstderr: ${result.stderr}`);
  assert.match(result.stdout, /pikaso/, '--help output should mention pikaso');
  assert.match(result.stdout, /Usage:/, '--help output should include Usage:');
  assert.match(result.stdout, /--port/, '--help output should list --port flag');
});

test('--version prints semver', () => {
  const result = spawnSync(process.execPath, [bin, '--version'], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/);
});
