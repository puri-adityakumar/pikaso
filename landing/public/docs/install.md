# Install

Pikaso runs as a single CLI — no dependencies, no database, no account.

```bash
npx pikaso-design
```

That's it. The command boots the board server and opens your workspace.

## Requirements

- Node.js 20 or newer
- A workspace folder (your project) — Pikaso stores its board inside it

## What you get

- A Figma-style board at `http://localhost:7625`
- A `.pikaso/` directory in your workspace holding frames, annotations and board state
- A `.pikaso/` entry is auto-added to `.gitignore` — board state is scratch space, not source

## Global install (optional)

```bash
npm install -g pikaso-design
pikaso
```

## Flags

| Flag | What it does |
|------|--------------|
| (none) | Project mode — board lives in `<workspace>/.pikaso` |
| `init` | Copy agent integration files (`AGENTS.md`, skill, rules) into your workspace |
| `init --global` | Install agent integration files into your home config instead |

