# Pikaso Protocol

> Agent-to-board communication protocol. See also `integrations/AGENTS.md` for
> the apply-loop instructions.

## Overview

Pikaso is a file-driven annotation board. The board server (`pikaso`) serves
mockup HTML frames in a pan/zoom canvas, injects `annotate.js` into each frame,
and streams live-reload events over SSE.

Agents interact entirely through the filesystem and the REST API — no WebSocket
push from agent to server.

## File layout

```
.pikaso/
  project.json              Board metadata + frame geometry
  frames/
    <name>/
      mockup.html           Self-contained HTML mockup (agent edits this)
      annotations.json      Array of annotation objects
  context/
    design-system.md        Scout output — cached per project
  DESIGN-SPEC.md            Written on lock; input to implementation agent
```

## project.json schema

```json
{
  "name": "string",
  "frames": [
    {
      "id": "string (uuid)",
      "name": "string",
      "x": "number",
      "y": "number",
      "w": "number",
      "h": "number",
      "status": "draft | locked"
    }
  ]
}
```

## annotations.json schema (per frame)

```json
[
  {
    "id": "string (uuid)",
    "selector": "string (CSS selector path, scoped to frame doc)",
    "box": { "x": 0, "y": 0, "w": 0, "h": 0 },
    "viewport": { "w": 0, "h": 0 },
    "text": "string",
    "status": "open | resolved",
    "createdAt": "ISO 8601",
    "resolvedAt": "ISO 8601 | null"
  }
]
```

## REST API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/project` | Returns project.json |
| GET | `/api/annotations/:frame` | Returns annotations.json for a frame |
| POST | `/api/annotations/:frame` | Append a new annotation |
| PATCH | `/api/annotations/:frame/:id` | Update annotation (status, resolvedAt) |
| POST | `/api/frames` | Create a new frame |
| POST | `/api/lock` | Lock board and generate DESIGN-SPEC.md |
| GET | `/events` | SSE stream for live reload and label updates |

## SSE events

```
event: reload
data: {"frame":"<name>"}

event: annotations
data: {"frame":"<name>"}
```

## Apply loop (agent)

1. `GET /api/project` — list frames with `status: draft`
2. For each draft frame, `GET /api/annotations/:frame` — filter `status: open`
3. Edit `frames/<name>/mockup.html` to address each open annotation
4. `PATCH /api/annotations/:frame/:id` with `{ "status": "resolved" }` for each

Batch all changes in one pass. Never call the API per annotation in a loop.
