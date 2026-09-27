# Pikaso — Universal Agent Protocol

This file tells any AI agent (Bob, Claude Code, Cursor, etc.) how to work with a
Pikaso board. It follows the `/init` convention: copy this file into the workspace
and the agent picks it up automatically.

---

## Board root

Default: `.pikaso/` in the current workspace root.

Override: if the user's message names a path with `@` (e.g. `@~/.pikaso/boards/b12`),
use that path as the board root instead.

---

## File layout

```
<board-root>/
  project.json                    board metadata + frame geometry
  frames/
    <name>/
      mockup.html                 self-contained HTML mockup (the frame)
      annotations.json            annotation list for this frame
  context/
    design-system.md              Scout output, cached once per project
  DESIGN-SPEC.md                  generated on lock
```

### project.json schema

```json
{
  "name": "string",
  "frames": [
    {
      "id": "uuid",
      "name": "string",
      "x": 0, "y": 0, "w": 800, "h": 600,
      "status": "draft | locked"
    }
  ]
}
```

### annotations.json schema (per frame)

```json
[
  {
    "id": "uuid",
    "selector": "CSS selector path (stable, scoped to frame document)",
    "box": { "x": 0, "y": 0, "w": 0, "h": 0 },
    "viewport": { "w": 1280, "h": 800 },
    "text": "annotation comment",
    "status": "open | resolved",
    "createdAt": "ISO-8601",
    "resolvedAt": "ISO-8601 | null"
  }
]
```

---

## REST API (when the Pikaso server is running)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/project` | Read full project + frames |
| GET | `/api/annotations/:name` | Read annotations for a frame |
| POST | `/api/annotations/:name` | Create annotation |
| PATCH | `/api/annotations/:name/:id` | Update status (resolve) |
| POST | `/api/frames` | Create a new frame |
| POST | `/api/lock` | Lock all frames, generate DESIGN-SPEC.md |
| GET | `/events` | SSE stream (reload / annotations events) |

---

## Apply loop (hot path — annotation apply)

When the user says "apply annotations", "fix the annotations", or similar:

1. Read `project.json` → collect every frame with `status: "draft"`.
2. For each such frame, read its `annotations.json`.
3. Filter to annotations with `status: "open"`.
4. If none are open, report "no open annotations" and stop.
5. **Batch all open annotations for a frame into one edit cycle** — do NOT round-trip
   per comment. Edit the frame's `mockup.html` to address every open annotation.
6. For each addressed annotation, set `status: "resolved"` and `resolvedAt` to the
   current ISO timestamp. Write `annotations.json` atomically (write to `.tmp` then
   rename).
7. Report a summary: frame name + how many annotations were resolved.

**Never** create new frames, delete frames, or touch `project.json` geometry during
the apply loop. Scope is annotations.json + mockup.html only.

---

## Cold path (new frame / full generation)

See `pikaso.skill/SKILL.md` for the Art Director orchestration protocol (Scout →
Builder → Council → fix cycle). That skill is only invoked by the Art Director role.

---

## Writing mockup.html

- The file must be **self-contained HTML** — no external CDN, no framework runtime,
  no relative asset paths that would break in an iframe on a different origin.
- Inline all CSS (`<style>`), inline all JS (`<script>`). Images may be SVG inline or
  `data:` URIs; `https://` stock photos are acceptable for mockups.
- Follow `integrations/rules/builder-rules.md` for design decisions.
- Never read or write any file outside the frame's folder (`frames/<name>/`).

---

## Atomic writes

All JSON writes **must** be atomic: write to `<file>.tmp` then rename to `<file>`.
This prevents half-written state if the agent is interrupted.

---

## What NOT to do

- Do not modify `project.json` geometry or status during annotation apply.
- Do not create files outside `.pikaso/`.
- Do not install npm packages or modify `package.json`.
- Do not touch `landing/`, `src/`, or `public/` (those belong to the Pikaso package,
  not the board state).
- Do not run `pikaso lock` — the user triggers that from the UI.
