# Changelog

All notable changes to Pikaso.

## 0.1.0 — first public release

Built in the open for the [IBM Bob 2.0 Hackathon](https://lablab.ai/ai-hackathons/ibm-bob-2-hackathon).

- Pan/zoom board server at `localhost:7625` — Figma-style canvas, frames as real HTML files
- Click-to-annotate: numbered pins with CSS-selector precision, stored as plain JSON
- Live reload over SSE: agent edits the mockup, the frame refreshes without a page reload
- Annotation apply loop documented for any agent harness (`AGENTS.md` convention)
- **Lock** → generates `DESIGN-SPEC.md` (per-frame purpose, token contract, final state, resolved history) + copies the implementation prompt
- `pikaso init` / `init --global` — installs the agent integration kit (Art Director skill, Builder rules, Critic rubric, config)
- Zero dependencies. Node 20+. MIT.
