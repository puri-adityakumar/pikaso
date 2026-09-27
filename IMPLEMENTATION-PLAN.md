# Pikaso — Implementation Plan (executor: Bob)

You are building the Pikaso package. `CONTEXT.md` and `DECISIONS.md` are binding —
if you believe a decision is wrong, raise it; do not silently deviate.

**Scope guard: `landing/` is NOT part of this plan. Do not create or touch it.**
The runtime board lives in `src/` + `public/` only. Zero runtime dependencies
(Node built-ins only), ESM everywhere (`"type": "module"`), JSDoc on public seams.

Work phase by phase. **A phase is complete ONLY when its Done-when is true AND
every box in the MANDATORY CHECKLIST at the bottom is checked.** Report the
checked list back at the end of each phase. Commit after each phase
(`feat(phase-N): summary`).

---

## Phase 1 — Scaffold (task01)

**Build:** `package.json` (name `pikaso`, `bin` → `src/bin/pikaso.js`, `engines.node >= 20`,
`files`: `src`, `public`, `integrations`, `scripts.test`, no `dependencies`), `.gitignore`
(`.pikaso/`, `node_modules/`), empty `src/bin/pikaso.js` with `--help`, `src/`, `public/`,
`integrations/` dirs, `docs/PROTOCOL.md` stub.

**Tests:** `node --test` runs and passes (one smoke test: `--help` prints usage).
**Done-when:** `node src/bin/pikaso.js --help` works; `npm pack --dry-run` lists only
allowed files; `.pikaso/` ignored.

## Phase 2 — Board state core (task01)

**Build:** `src/board.js` — `loadProject(root)`, `saveProject` (**atomic**: write
`.tmp` → `rename`), `createFrame(root, name)` → `frames/<name>/mockup.html`
(starter self-contained HTML) + `annotations.json` (`[]`), `updateFrame`. Schemas in
JSDoc: project `{ name, frames: [{ id, name, x, y, w, h, status }] }`,
annotation `{ id, selector, box:{x,y,w,h}, viewport:{w,h}, text, status, createdAt,
resolvedAt }`.

**Tests:** roundtrip save/load; invalid JSON → clear error; createFrame writes both
files and registers in project.json; ids unique; reject frame names with `/` or `..`.
**Done-when:** `node --test src/board.test.js` green.

## Phase 3 — Server + injection + live reload (task02)

**Build:** `src/server.js` (node:http, no frameworks) — `GET /` → `public/index.html`;
`GET /frames/:name/mockup.html` → HTML with `annotate.js` injected before `</body>`
(`src/inject.js`; if no `</body>`, append at end — never write to disk); `GET /events`
→ SSE; `fs.watch` on `frames/**/mockup.html` → broadcast `reload` with frame name;
`GET /api/project` → project.json. Port from `--port` (default 7625), print URL +
mode (project/global/tmp per D18).

**Tests:** start on ephemeral port; `GET /frames/x/mockup.html` contains injected
script AND original markup; inject handles missing `</body>`; POST-less SSE emits
`reload` after a temp-file edit to a mockup; unknown frame → 404.
**Done-when:** all green + one manual check: browser open, edit a mockup file,
page updates without refresh (say so in the phase report).

## Phase 4 — Board UI (task03)

**Build:** `public/` vanilla ESM — pan/zoom board (hand-rolled: wheel = zoom to
cursor, drag = pan, CSS transform), frames as same-origin iframes positioned from
`/api/project` at x/y/w/h, frame labels (name · status · open count), zoom pill,
**+ New Frame** strip (POSTs `/api/frames`, then tells the user the prompt to give
Bob), dotted background. No framework, no bundler, no CDN scripts.

**Tests:** `inject`/`board` modules stay covered by unit tests; UI smoke: server test
asserts `index.html` + `board.js` served with 200 and correct MIME. Visual verification
is human's job (dogfood phase).
**Done-when:** manual check — 2 frames render side by side, pan/zoom smooth, live
reload updates the right iframe only.

## Phase 5 — Annotation overlay + API (task04)

**Build:** `public/annotate.js` (injected into frames): hover dashed outline,
click = capture selector path (stable: id → nth-of-type chain, scoped to frame doc)
+ bounding box + viewport; comment box (textarea, Save/Cancel); numbered pins
positioned at boxes; resolved pins greyed. `src/api.js`: `POST /api/annotations/:frame`
(validate selector/text/box → append, status `open`), `GET /api/annotations/:frame`,
`PATCH /api/annotations/:frame/:id` (status ↔ resolved, set `resolvedAt`), all writes
atomic via board module, each mutation broadcasts SSE so the label counts update.

**Tests:** API — create → file contains annotation with id/status; invalid payload → 400;
resolve → `resolvedAt` set; persistence across reload. Overlay — DOM-level test of the
selector-path builder (given a nested stub doc, path is stable and unambiguous).
**Done-when:** manual round-trip in browser: click element → comment → appears in
`annotations.json`; Bob-edit the file flipping status → pin greys out.

## Phase 6 — Council integration files (task05)

**Build:** `integrations/` — `AGENTS.md` (universal protocol: board root default
`.pikaso/`, override via path in user message; apply-loop = read open annotations per
frame → edit that frame's `mockup.html` → mark resolved; batch, never per-comment),
`rules/builder-rules.md` (~1–2k words: design-read-first, dials variance/motion/density,
anti-defaults, scale adherence, contrast floors, self-contained HTML),
`rules/critic-rubric.md` (checklist → verdict `PASS` / `FIX: [...]`),
`pikaso.skill/SKILL.md` (Art Director orchestration per D21–D24: Scout once per project
→ `context/design-system.md`; briefs; parallel Builders; Council convene/merge; ONE fix
cycle; Director is the only voice), `pikaso.config.json` template with `agentCommand`.
`pikaso init` = copy these into the user's workspace (project or `--global`).

**Tests:** `init` copies all files to a temp dir and rewrites nothing else; `--global`
path targets home; idempotent re-run (overwrite is fine, no duplicates).
**Done-when:** `node --test` green; `pikaso init` verified in a sandbox dir.

## Phase 7 — Lock flow (task06)

**Build:** `src/lock.js` — `POST /api/lock`: verify no `open` annotations (else 409 with
count), set frames status `locked`, generate `.pikaso/DESIGN-SPEC.md` (per frame: purpose
line from prompt, token contract, resolved annotation history, final state) + return the
implementation prompt. Adapter: if `agentCommand` configured → spawn it with the prompt
(Bob Shell: `bob --non-interactive`), else print prompt + attempt clipboard
(`clip`/`pbcopy`/`xclip`, degrade gracefully to stdout). Lock button UI state per modal.

**Tests:** lock blocked while open annotations exist; lock writes spec containing all
frames + resolved annotations; fake `agentCommand` (`node -e "process.stdout.write('x')"`)
receives prompt on stdin; no config → prompt printed.
**Done-when:** all green; manual: click Lock on demo board → DESIGN-SPEC.md appears,
prompt readable.

## Phase 8 — Dogfood + demo rehearsal (task07)

**Build:** nothing new. Create demo board `pikaso-landing` (1 frame: landing page
mockup), run ≥2 full cycles: annotate → Bob applies → resolved → live reload → lock.
This doubles as demo rehearsal and produces the strongest `bob_sessions` evidence.

**Tests:** none new — the cycle itself is the test.
**Done-when:** one annotation cycle completed with Bob live; screenshots taken.

---

## MANDATORY CHECKLIST — every phase, no exceptions

A phase is NOT done until all boxes are checked and reported. Skipping any box
means the phase is not done, regardless of what was built.

- [ ] `node --test` fully green (no skipped tests)
- [ ] Zero runtime deps (`package.json` has no `dependencies`; only Node built-ins used)
- [ ] Only Node built-ins + files inside scope (no `landing/`, no `demo/` writes)
- [ ] All file writes that touch state are atomic (tmp + rename)
- [ ] New public functions have JSDoc including the schemas from Phase 2
- [ ] Phase's Done-when manually verified and stated in one line
- [ ] `bob_sessions/pikaso_task<NN>_<desc>.png` captured for this phase
  (screenshot the task session summary — see `bob_sessions/README.md`)
- [ ] Committed: `feat(phase-N): <summary>` — one commit per phase, no mixed commits
- [ ] If any decision in `DECISIONS.md` was impossible to follow: STOP and say which
  (D1–D26) before improvising

Out of scope for this plan, do not build: `landing/`, GitHub Pages deploy, npm publish,
slides, video.
