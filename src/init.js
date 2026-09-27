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

import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Absolute path to the integrations/ source directory (inside this package). */
const INTEGRATIONS_SRC = join(__dirname, '..', 'integrations');

/**
 * Copy integration files into the target workspace.
 *
 * @param {{ global?: boolean, cwd?: string }} [opts]
 *   - `global`  If true, copies to `~/.pikaso/integrations/` instead of cwd.
 *   - `cwd`     Override process.cwd() for the project target (useful in tests).
 * @returns {{ dest: string }}  The directory where files were written.
 */
export async function init(opts = {}) {
  const dest = opts.global
    ? join(homedir(), '.pikaso', 'integrations')
    : join(opts.cwd ?? process.cwd(), 'integrations');

  mkdirSync(dest, { recursive: true });

  // Copy the entire integrations/ tree into dest (overwrite existing files)
  cpSync(INTEGRATIONS_SRC, dest, { recursive: true, force: true });

  process.stdout.write(`\npikaso init — integration files copied to:\n  ${dest}\n\n`);
  process.stdout.write(`Files installed:\n`);
  process.stdout.write(`  AGENTS.md             Universal agent protocol\n`);
  process.stdout.write(`  pikaso.config.json    Configuration template\n`);
  process.stdout.write(`  rules/builder-rules.md  Builder design rules\n`);
  process.stdout.write(`  rules/critic-rubric.md  Design Council rubric\n`);
  process.stdout.write(`  pikaso.skill/SKILL.md   Art Director skill\n\n`);

  if (!opts.global) {
    process.stdout.write(`Next step: open AGENTS.md and read the apply-loop instructions.\n`);
    process.stdout.write(`           Run \`npx pikaso\` to start the board server.\n\n`);
  }

  return { dest };
}
