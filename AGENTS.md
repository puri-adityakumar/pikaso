# AGENTS.md — Pikaso

Pikaso is a design-review tool for agent-driven development: agents write HTML
mockups onto a board, users pin annotations on elements, agents apply them with
live reload, and "Lock" condenses the draft into `DESIGN-SPEC.md`.

## Repo layout

- `src/` — the npm package (`pikaso-design`, bin: `pikaso`). Zero runtime deps; Node ≥ 20.
  - `server.js` (HTTP + SSE), `api.js` (REST routes), `board.js` (board state),
    `lock.js` (DESIGN-SPEC generation), `inject.js` (annotate.js injection into frames),
    `selector.js` (CSS selector paths), `init.js` (copies `integrations/` into workspaces),
    `bin/pikaso.js` (CLI entry)
- `public/` — board front-end served by the server: `index.html` + `board.js`
  (pan/zoom canvas, labels, lock modal) and `annotate.js` (injected into mockup
  iframes: hover outline, comment box, pins). Plain JS, no build step, no framework.
- `test/` — `node --test` suites (CLI, server, API, board, lock, init)
- `integrations/` — shipped agent kit: AGENTS.md protocol, Art Director skill,
  builder-rules, critic-rubric, config template. Copied verbatim by `pikaso init`.
- `landing/` — separate Vite+React marketing app (own package.json, `base: "./"`,
  committed `dist/`). Deployed to pikaso-design.vercel.app (Vercel builds from `main`).
- `docs/` — DECISIONS.md (product decisions D1–D26), PROTOCOL.md (file/REST/SSE spec),
  pikaso-deck.pdf
- `.pikaso/` — gitignored board state created at runtime; never commit it.

## Commands

```bash
npm test                  # node --test — run before every commit; must stay green
node src/bin/pikaso.js    # board server at http://localhost:7625 (project mode)
cd landing && npm install && npm run build   # marketing app (deploys need dist/ committed)
```

## Conventions and rules

- **JavaScript only, no TypeScript.** JSDoc types on exported functions.
- **Zero runtime dependencies** in the package — Node stdlib only.
- **Atomic writes** for board state (write temp file + rename).
- **State is files, not a DB**: `.pikaso/project.json`, per-frame `annotations.json`.
  Any feature must work with files + REST only (agents may be headless).
- **Batch API changes**; the apply loop reads all annotations, edits mockups, then
  resolves — never per-annotation round trips.
- **Design language is shared** between `public/` (board UI) and `landing/src/styles.css`:
  paper `#fbf9f4`, ink `#2b2a26`, green `#62d96b`, butter-deep `#f2cf62`, sky `#a9e8eb`,
  pink `#f4b8c0`, dark `#1d1c19`, dark-ink `#f4f2ea`; Epilogue 800 brand, Lora serif
  headings, Manrope body; hard offset shadows, `cubic-bezier(0.6,0,0,1)` easing.
  Board UI is light-default with a persisted dark toggle (`data-theme="dark"`).
  Keep both sides consistent when touching either.
- `annotate.js` runs inside untrusted mockup iframes — all its CSS/IDs are
  `pikaso-` prefixed; don't leak styles into host pages.
- Branches: work on `dev`, push to `origin/dev` only. `main` is the deploy branch
  (frozen archive; move it forward only on explicit request).
- Product decisions live in `docs/DECISIONS.md` — check it before changing the
  annotation format, file layout, or lock behavior; the protocol spec is
  `docs/PROTOCOL.md` and `integrations/AGENTS.md` must stay in sync with it.

## Gotchas

- Git Bash on Windows: use `//` for tool flags, write `.ps1` files instead of
  inline heredocs with `$` vars; `sed -i` writes CRLF here.
- The landing app resolves assets relative to `document.baseURI` (`base: "./"`),
  so paths work both at a domain root and under a sub-path — don't switch to
  absolute `/` paths.
- Iframe-piercing browser automation (click/type inside mockup frames) hangs
  some recorders; drive the annotate REST API instead when scripting.
