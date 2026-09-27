# HANDOVER — Pikaso demo recording session (2026-09-27)

Read this first, then `DEMO-VIDEO-PLAN.md` (capture runbook) and `docs/VIDEO-PLAN.md`
(the 3-minute edit plan with narration).

## What happened, honestly

**The fuckup: the in-app browser's tab recorder kept crashing the tab, and chunks 2–4
never got recorded on camera.**

Timeline:

1. **Chunk 1 recorded clean** (7.5s, 181 frames): zoom, pan, "+ Generate mockup" →
   `checkout-page` frame created on camera. This proved the actions-mode recorder works.
2. Chunk 2 attempts (annotate the headline): the recorder **stalled** twice — once in
   `preparing` forever, once `running` forever. Both jobs included either a coordinate
   `click x,y` action or a `type selector` that had to reach **inside the frame iframe**.
   Main-document selector actions (chunk 1: `#zoom-out`, `#new-frame-btn`) always worked;
   the moment a job needed to resolve something inside the iframe or at raw coordinates,
   the job hung.
3. Cancelling the hung jobs **poisoned the tab's debug session**: for minutes after,
   every click / evaluate / screenshot on that tab timed out (30s each). It recovered
   once after a long idle pause — I got one good probe back (pin rendering + enlarged
   headline on camera, saved as `demo-04-annotation-pin-applied.png`) — then the next
   recording attempt wedged it again permanently.
4. With the deadline close, I stopped gambling on the browser and finished the loop at
   the **protocol level** — the same HTTP API the UI's Save button, the Resolve tooltip
   and the Lock button call:
   - `POST /api/annotations/pikaso-landing` → pin persisted, status `open` ✅
   - Bob edit: headline token `--text-4xl` 2.5rem → 3.25rem in `mockup.html`
     (atomic tmp+rename) → `fs.watch` fired the SSE `reload` ✅
   - `PATCH … status: resolved` → `resolvedAt` set ✅
   - Bonus: a lock attempt with a still-open annotation correctly returned **409 with
     the open count** — the guard works ✅
   - `POST /api/lock run:false` → **`DESIGN-SPEC.md` generated** (3 frames, token
     contract, resolved history) + implementation prompt returned ✅
   Evidence copies in `bob_sessions/evidence/`.

**Net:** the product is fully working and demonstrated at protocol level; the *video*
only has chunk 1 as real footage. Chunks 2–4 exist as stills + B-roll, and as exact
scripts for whoever records them.

## What is committed

| Asset | Path |
|---|---|
| Real video chunk 1 (board pan/zoom/new frame) | `videos/pikaso-demo-chunk-1-board-pan-zoom-new-frame.webm` |
| B-roll video (zoom-pan over 4 stills, 10s) | `videos/pikaso-demo-broll-chunks-2-4.mp4` |
| Stills: initial board / frame-created toast / 3 frames / pin applied | `demo-01…04-*.png` |
| DESIGN-SPEC + final annotation + project state | `evidence/` |
| Capture runbook (recorder settings, gotchas, reset script) | `DEMO-VIDEO-PLAN.md` |
| Edit plan: narration script, scene timing, constraints | `docs/VIDEO-PLAN.md` |
| Product fixes this session (all tested, `npm test` 50/50) | watcher-leak fix, Windows test script, agentCommand shell dispatch, Copy-prompt spawn bug, DESIGN-SPEC sections, D22 attribution, PR #1 merged |

## What remains (≈ 25 min with a working browser)

1. **Chunk 2/3 on camera** — follow the safe recipe learned here:
   - recordings may contain **only main-document selector actions** (`#lock-btn`,
     `#zoom-out`, `#new-frame-btn`, …). Coordinate actions and anything that must resolve
     inside the frame iframes **will hang the job**.
   - do the in-iframe interactions (click element → type comment → Save; click pin →
     Resolve) **live between takes** via keyboard/mouse, and capture the payoff with
     short takes: pin visible → label `◉ 1 open`; after resolve → pin greyed.
   - the live-reload shot: start a `[wait]`-only take, edit `mockup.html` from a shell
     mid-take, the iframe flips on camera. Verify the take's `durationMs` before trusting it.
   - if a job stalls > 10s in `preparing`/`running`, do NOT cancel-and-continue — cancel,
     walk away 2–3 min, retry a simpler take. Cancelling wedges the tab.
2. **Lock modal take** (safest of all): `[{click #lock-btn}, {wait 1500}, {click #modal-copy-btn}, {wait 1500}]`.
   Board currently ships **locked** — use the reset script in `DEMO-VIDEO-PLAN.md` §5 first.
3. Assemble per `DEMO-VIDEO-PLAN.md` §4, narrate per `docs/VIDEO-PLAN.md`, export MP4 ≤ 3:00.

## Board state right now

Locked (`pikaso-landing`, `pricing-page-with-three-tiers`, `checkout-page`), both
annotations resolved, DESIGN-SPEC.md present, headline bumped to 3.25rem. Server: `node src/bin/pikaso.js` (port 7625).
