# Agent setup

Pikaso works with any agent harness that reads an `AGENTS.md`. One command
wires it up:

```bash
npx pikaso-design init
```

This copies into your workspace:

| File | Role |
|------|------|
| `AGENTS.md` | The universal agent protocol — apply loop, API, file layout |
| `pikaso.skill/` | The **Art Director** orchestration skill (design generation) |
| `rules/builder-rules.md` | HTML-building rules for Builder agents |
| `rules/critic-rubric.md` | Review rubric for Critic agents |
| `pikaso.config.json` | Editable config: board root, port, agent command |

Use `init --global` to install into your home config instead of the project.

## The Pikaso Design Council

When your agent generates a design, it runs as the **Art Director** — an
orchestrator that spawns specialists:

- **Scout** (once per project) — reads your codebase and writes
  `.pikaso/context/design-system.md`: your palette, type, spacing, components.
  New mockups inherit your design language, not a generic AI aesthetic.
- **Builders** — write the HTML mockups from briefs
- **Critics** — review drafts against the rubric before you ever see them

You only ever talk to the Art Director.

## Config

`pikaso.config.json`:

```json
{
  "agentCommand": "bob --non-interactive",
  "boardRoot": ".pikaso",
  "defaultPort": 7625
}
```

`agentCommand` is optional — set it if you want the board to be able to spawn
your agent (e.g. from a "generate mockup" button). Without it, everything
still works: the agent simply reads `AGENTS.md` in the workspace.

## Working headless

No browser needed. Everything the board does is files + REST:

- read/write `.pikaso/` directly, or
- use the API (see the [Protocol](/docs/protocol.md))

