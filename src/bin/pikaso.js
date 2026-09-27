#!/usr/bin/env node
/**
 * pikaso — agent-driven mockup board CLI
 *
 * Usage:
 *   pikaso [--port <n>] [--global] [--tmp]   Start the board server
 *   pikaso init [--global]                   Copy integration files into workspace
 *   pikaso --help                            Show this message
 *   pikaso --version                         Print version
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

const HELP = `\
pikaso v${pkg.version} — agent-driven mockup board

Usage:
  pikaso [options]              Start the board server
  pikaso init [--global]        Copy integration files into workspace

Options:
  --port <n>    Port to listen on (default: 7625)
  --global      Store board state in ~/.pikaso/boards/<id>
  --tmp         Store board state in $TMPDIR (ephemeral)
  --help        Show this help message
  --version     Print version and exit

Examples:
  npx pikaso                    Start server in project mode (.pikaso/)
  npx pikaso --port 3000        Start on a custom port
  npx pikaso init               Copy integrations/ files into this workspace
  npx pikaso init --global      Install integration files globally
`;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(HELP);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
}

// Sub-command: init
if (args[0] === 'init') {
  const { init } = await import('../init.js');
  const isGlobal = args.includes('--global');
  await init({ global: isGlobal });
  process.exit(0);
}

// Default: start the server
const { startServer } = await import('../server.js');

const portArg = args.indexOf('--port');
const port = portArg !== -1 ? parseInt(args[portArg + 1], 10) : 7625;
const isGlobal = args.includes('--global');
const isTmp = args.includes('--tmp');

await startServer({ port, global: isGlobal, tmp: isTmp });
