# Pikaso — Decision Log

Decisions made so far, newest context first. Companion to [CONTEXT.md](CONTEXT.md).

## Product

- **D1 — Build Pikaso for the hackathon.** Tool for design engineers: agent generates HTML mockups, user annotates visually, agent iterates from annotations, draft locks into an implementation handoff. Chosen because it hits the challenge statement (developer workflow, measurable impact), is clear of the saturated code-reviewer/onboarding crowd, and demos extremely well.
- **D2 — Core loop is annotate → apply → resolve.** Sticky-note-style iteration, not one-shot generation.
- **D3 — Mockups are static HTML.** Not framework apps, not the running product. Keeps generation cheap, selectors clean, and works with any stack.

## Architecture

- **D4 — Figma-like model: one board, many frames.** The main canvas is a viewport, not data. Frames (landing page, checkout, …) are the unit of storage and iteration.
- **D5 — Storage: JSON files, no database.** File-per-frame in a gitignored `.pikaso/` dir. Deciding factor: agents read/write plain files natively; SQLite would force agents through CLI SQL. One user, tiny data, no concurrent writers → no DB justified. JSON writes must be atomic (temp file + rename).
- **D6 — File layout is the contract.**
  - `project.json` — board metadata + frame geometry (x, y, w, h) + status. Owns nothing about frame content.
  - `frames/<name>/mockup.html` + `frames/<name>/annotations.json` — self-contained per frame. An agent can act on one frame by touching only its folder.
- **D7 — iframe per frame on a CSS-transform pan/zoom board.** Isolates each mockup's DOM (no CSS leaks, unambiguous selectors) and keeps per-iteration context small (Bobcoin budget).

## Agent integration

- **D8 — Harness-agnostic protocol, thin per-harness adapters.** The server never calls an agent API. AGENTS.md section (`/init` convention) is the universal floor; Bob skill/custom mode, Claude Code/ZCode skills, Cursor rules are thin wrappers. Discipline rule: any feature needing agent APIs must be redesigned as a file or a prompt.
- **D9 — The apply loop is file-driven.** Agent instruction: read `project.json` → for each frame with open annotations, read its `annotations.json`, edit its `mockup.html`, mark annotations resolved. Batch apply-cycles (not per-comment round-trips) to conserve Bobcoins.
- **D10 — Lock button emits an artifact, adapted per harness.** Generates `DESIGN-SPEC.md` (final mockups, resolved annotation history, accepted decisions) + an implementation prompt. `pikaso.config.json` maps `agentCommand`: Bob Shell non-interactive mode for the demo; clipboard-copy prompt as universal fallback.

## UX

- **D11 — Element-click annotation, not freeform drawing.** Click an element → comment anchored to its CSS selector path (scoped per frame/iframe). Freeform arrows/scribbles cut. Screenshot crop per annotation = optional stretch (html2canvas).
- **D12 — Live reload is mandatory.** File watcher + websocket so the board updates the instant the agent writes a mockup. This is the demo's make-or-break feel.
- **D13 — Annotation status states.** open / resolved per annotation, so the iteration loop is legible on screen and in the video.

## Hackathon strategy

- **D14 — Build and demo with Bob IDE (mandatory anyway); Bob Shell powers the lock-button moment.** Positioning: "an open annotation-and-handoff protocol for agent-driven design — Bob 2.0 as flagship integration."
- **D15 — Deliverables budget reserved.** ~1.5–2 h for the ≤500-word statements, slides, cover image, video (≤3 min, ≥90 s live demo), and `bob_sessions/` screenshots. Deadline: 2026-09-27 20:30 IST.

## UI (mockups approved 2026-09-27)

- **D16 — Board-first UI, no sidebars.** Figma needs layer panels because it edits geometry; Pikaso's geometry is data, not manual. Whole UI = board + pins + two floating controls. Keeps the build small for the deadline and the video reads as "canvas in, spec out."
- **D17 — Frame creation via a generation strip on the board** (settles the open frame-creation question): describe the screen → generate → new frame folder appears and renders once Bob writes `mockup.html`.

Main board:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ pikaso   > landing-site.board                             Bob: idle       [ + New Frame ]    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   LANDING PAGE   o 2 open                        CHECKOUT FLOW   o 0 open                    │
│   ┌────────────────────────────────────┐       ┌──────────────────────────┐                   │
│   │ (1) [Logo]   Home  Work  About     │       │ Email   [____________]   │                   │
│   │  ┌─────────────────────────────┐   │       │ Card    [____________]   │                   │
│   │  │ (2)  hero headline          │   │       │                          │                   │
│   │  │     subcopy text            │   │       │        [    Pay    ]     │                   │
│   │  └─────────────────────────────┘   │       └──────────────────────────┘                   │
│   │        ┌───────────┐   (3)        │                                                      │
│   │        │    CTA    │              │       SETTINGS   o locked                            │
│   │        └───────────┘              │       ┌──────────────────────────┐                   │
│   │ (4)   footer links                │       │  handed off to agent     │                   │
│   └────────────────────────────────────┘       │  checks: 12/12 passing   │                   │
│                                                └──────────────────────────┘                   │
│                                                                                              │
│      ╭─ (3) ────────────────────────────────╮                                                │
│      │ "CTA should be full-width & orange"  │                                                │
│      │ you · 14:32      [Resolve]  [Edit]   │                                                │
│      ╰──────────────────────────────────────╯                                                │
│                                                                                              │
│   [ - ]   [ 100% ]   [ + ]                     ┌────────────────────────────────┐             │
│                                                │  Lock draft   >   implement    │             │
│                                                └────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Top bar: board name + live agent state (`Bob: idle` → `applying 2 annotations…` while the loop runs — the demo money-shot) + New Frame. Frames sit at their `project.json` x/y; labels show status + open count; locked frames show the handoff state. Numbered pins = selector-anchored annotations, click opens the thread; resolved pins render greyed/checked. Bottom-right floating Lock button (D10), bottom-left zoom pill, dotted Figma-grid background with drag/wheel pan.

Annotating (hover outline → click → pin):

```
   ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
   ╎   CTA button      ╎   ← hovered element gets a dashed outline
   └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
        ╭───────────────────────╮
        │  +  Add comment       │   ← click opens the thread box,
        ╰───────────────────────╯      pin (n) stays on the element
```

New-frame generation strip:

```
┌ New frame ────────────────────────────────────────────────────────┐
│ Describe the screen:  "pricing page, 3 tiers, enterprise CTA"     │
│                                        [ Generate mockup ]        │
└───────────────────────────────────────────────────────────────────┘
     → drops a new frame folder + renders it once Bob writes mockup.html
```

Lock modal (harness adapter entry point):

```
        ┌────────────────────────────────────────────────┐
        │  Lock draft & start implementation?            │
        │                                                │
        │  3 frames  ·  5 resolved  ·  0 open            │
        │  writes  .pikaso/DESIGN-SPEC.md                │
        │                                                │
        │  [ Run with Bob Shell ]   [ Copy prompt ]      │
        │                                  [ Cancel ]    │
        └────────────────────────────────────────────────┘
```

## Runtime & install (2026-09-27)

- **D18 — Two independent axes: where state lives vs. where the skill lives.** Board state location is a run-time choice: `npx pikaso` (project, `./.pikaso/` gitignored, default), `--global` (`~/.pikaso/boards/<id>`, zero workspace traces, persistent), `--tmp` (`$TMPDIR`, zero traces, dies on reboot). `--global` means home dir, NOT `/tmp` (tmp is wiped on reboot). First-run prompt remembers the choice in `~/.pikaso/config.json`; flags are the scriptable path. Skill location is an install-time choice: `pikaso init` (project harness files) vs `init --global` (Bob global modes / `~/.claude/skills`).
- **D19 — The skill is location-agnostic via one protocol line.** "Board root defaults to `.pikaso/`; if the user's message names another path (e.g. `@~/.pikaso/boards/b12`), use that." Project mode = automatic relative paths; global/tmp modes = `@` mention or Copy-prompt button embedding the absolute path. Server prints a copy-pasteable agent instruction in global/tmp modes.
- **D20 — Install story = two touchpoints, zero dependencies.** (1) Once per harness: `npx pikaso init` copies integration text files. (2) Every session: `npx pikaso [flags]` runs the bridge — nothing enters package.json ever; `npm i -D pikaso` optional for pinned teams. The skill is what the agent knows; the server (npx) is what the browser talks to — neither half works alone.

## Agent team — the Pikaso Design Council (2026-09-27)

- **D21 — Four-role cast, our own agentic approach.** Art Director (Lead/orchestrator — briefs, decides, the only agent that speaks to the user), Scout (codebase design-context explorer, read-only), Builder (HTML mockup per frame, write-scoped to its frame folder), Design Council (critics). No external agent framework adopted; orchestration is Pikaso's own protocol in the skill/AGENTS.md.
- **D22 — Design rules are ours, distilled — taste-skill is inspiration, not a dependency.** No vendoring, no copying: our own compact `integrations/rules/builder-rules.md` (~1–2k words: design-read-before-code, dials variance/motion/density, anti-default discipline, type/spacing scale adherence, contrast floors, self-contained HTML) and `integrations/rules/critic-rubric.md` (audit checklist → PASS / FIX list). Attribution line only: "design rules distilled with inspiration from Leonxlnx/taste-skill (MIT)." Builders read brief + tokens + builder-rules; they never carry the full rule corpus in context.
- **D23 — Two cost paths.** Cold path (new frame) = full cast; hot path (apply annotations) = Art Director ALONE. Scout runs ONCE per project → `context/design-system.md` (cached; greenfield "no codebase" is a first-class report). One Builder per frame, spawned in parallel (Bob parallel tasks/subagents), all briefs share the same token contract so parallel frames look like one product.
- **D24 — The Design Council: many critics, convened per requirement.** The Director spawns N specialized critics as needed (e.g. hierarchy/typography, color & contrast/a11y, motion, responsive/layout, brand-consistency vs design-system.md) instead of one monolithic critic. Each critic is read-only and returns a structured verdict; the Director merges all FIX lists into ONE revision sent to the Builder — max one fix cycle, never a debate. Council convenes only on the cold path (or explicit review request), never on hot-path annotation applies; council size scales with frame stakes (default 1–2 critics, full council for the frames the user will judge hardest) to protect the Bobcoin budget.

- **D25 — Landing page as a separate Vite + React workspace.** `landing/` sibling to the npm package; two package.jsons, no monorepo tooling. The npm `files` field is the firewall — only `bin/src/public/integrations` publish, `landing/` never ships. Package board UI (`public/`) stays vanilla JS, no build step. Deploy: GitHub Actions → GitHub Pages with Vite `base: '/pikaso/'`; the Pages URL doubles as the submission form's Demo Application URL. `landing/` is also the dogfood target — the demo designs Pikaso's own landing page in the canvas, then implements it there.

- **D26 — Plain JavaScript (ESM) for the package; JSX for landing.** `"type": "module"`, no build step at all (the tsc variant was rejected on deadline economics: ~600–900 lines, one builder, zero compile step between agent edit and running server). JSDoc on public seams (board/annotation schemas, API handlers) as agent-friendly type hints. Landing page uses the Vite React-JS template. Post-hackathon JS→TS migration is cheap on a codebase this size if needed.

## Open (not yet decided)

- Server/runtime stack (Node + tiny static server + ws is the working assumption; nothing chosen).
- Hand-rolled vs. library pan/zoom (hand-rolled is the lean).
- Annotation schema fields, final naming (project name "Pikaso" assumed from workspace).
- Demo video script and shot list.
