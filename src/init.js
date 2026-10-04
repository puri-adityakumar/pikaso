/**
 * @module init
 * `pikaso init` — copy integration files into the user's workspace.
 *
 * Copies integrations/ (AGENTS.md, rules/, pikaso.skill/, pikaso.config.json)
 * into either the current workspace or the global Bob skill directory.
 *
 * Behaviour:
 *   - Project mode (default): copies into <cwd>/  (AGENTS.md, pikaso.config.json)
 *     and <cwd>/rules/ and <cwd>/pikaso.skill/.
 *   - Global mode (--global): copies into ~/.pikaso/integrations/.
 *   - Idempotent: re-running overwrites existing files (no duplicates).
 */

import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import readline from 'node:readline/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Absolute path to the integrations/ source directory (inside this package). */
const INTEGRATIONS_SRC = join(__dirname, '..', 'integrations');

/**
 * Resolve the default board view for this installation.
 * Order: explicit --view flag → interactive prompt (TTY only) → 'html'.
 * @param {{ view?: string }} [opts]
 * @returns {Promise<'html'|'canvas'>}
 */
async function resolveDefaultView(opts = {}) {
  if (opts.view === 'canvas' || opts.view === 'html') return opts.view;
  try {
    if (process.stdin.isTTY && process.stdout.isTTY) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = (
        await rl.question('Default board view — [1] HTML (recommended) [2] Canvas: ')
      ).trim().toLowerCase();
      rl.close();
      if (answer === '2' || answer === 'canvas' || answer === 'c') return 'canvas';
      return 'html';
    }
  } catch { /* prompt failed → fall back to the default */ }
  return 'html';
}

/**
 * Write (or merge into) the workspace pikaso.config.json with the chosen
 * defaultView. Atomic: temp file + rename.
 * @param {string} dir  Directory that holds pikaso.config.json.
 * @param {'html'|'canvas'} view
 * @returns {string} Path written.
 */
function writeWorkspaceConfig(dir, view) {
  const cfgPath = join(dir, 'pikaso.config.json');
  let cfg = {};
  try {
    cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  } catch { /* no config yet → start fresh */ }
  cfg.defaultView = view;
  const tmpPath = cfgPath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(cfg, null, 2) + '\n');
  renameSync(tmpPath, cfgPath);
  return cfgPath;
}

/**
 * Copy integration files into the target workspace.
 *
 * @param {{ global?: boolean, cwd?: string, view?: string }} [opts]
 *   - `global`  If true, copies to `~/.pikaso/integrations/` instead of cwd.
 *   - `cwd`     Override process.cwd() for the project target (useful in tests).
 *   - `view`    Explicit default board view ('html'|'canvas'); skips the prompt.
 * @returns {{ dest: string, view: 'html'|'canvas', configPath: string|null }}  Where files were written and the chosen default view.
 */
export async function init(opts = {}) {
  const globalMode = Boolean(opts.global);
  const dest = globalMode
    ? join(homedir(), '.pikaso', 'integrations')
    : join(opts.cwd ?? process.cwd(), 'integrations');

  mkdirSync(dest, { recursive: true });

  // Copy the entire integrations/ tree into dest (overwrite existing files)
  cpSync(INTEGRATIONS_SRC, dest, { recursive: true, force: true });

  // Default board view — chosen at install time, HTML by default (D27)
  const view = await resolveDefaultView(opts);
  let configPath = null;
  if (!globalMode) {
    configPath = writeWorkspaceConfig(opts.cwd ?? process.cwd(), view);
  }

  process.stdout.write(`\npikaso init — integration files copied to:\n  ${dest}\n\n`);
  process.stdout.write(`Files installed:\n`);
  process.stdout.write(`  AGENTS.md             Universal agent protocol\n`);
  process.stdout.write(`  pikaso.config.json    Configuration template\n`);
  process.stdout.write(`  rules/builder-rules.md  Builder design rules\n`);
  process.stdout.write(`  rules/critic-rubric.md  Design Council rubric\n`);
  process.stdout.write(`  pikaso.skill/SKILL.md   Art Director skill\n\n`);
  process.stdout.write(`Default board view: ${view}${configPath ? `\n  (written to ${configPath})` : ''}\n\n`);

  if (!globalMode) {
    process.stdout.write(`Next step: open AGENTS.md and read the apply-loop instructions.\n`);
    process.stdout.write(`           Run \`npx pikaso\` to start the board server.\n\n`);
  }

  return { dest, view, configPath };
}
