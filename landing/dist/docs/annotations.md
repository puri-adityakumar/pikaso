# Annotations

Annotations are the contract between you and the agent. A pin stores *what*
you clicked and *what* you said — enough for an agent to act without asking.

## Creating one

1. Click any element inside a frame — it gets a dashed hover outline
2. Type your comment ("this CTA is too passive")
3. Save — a numbered pin appears at the element

## What's stored

Per frame, in `.pikaso/frames/<name>/annotations.json`:

```json
[
  {
    "id": "uuid",
    "selector": "CSS selector path (scoped to the frame document)",
    "box": { "x": 0, "y": 0, "w": 0, "h": 0 },
    "viewport": { "w": 1280, "h": 800 },
    "text": "this CTA is too passive",
    "status": "open",
    "createdAt": "2026-09-27T10:20:00Z",
    "resolvedAt": null
  }
]
```

- `selector` — stable CSS path to the exact element you pinned
- `box` + `viewport` — where the element was when you pinned it
- `status` — `open` until the agent resolves it

## Resolving

The agent (or you, via the pin tooltip) marks a pin resolved:

```bash
curl -X PATCH localhost:7625/api/annotations/landing/<id> \
  -d '{"status":"resolved"}'
```

Resolved pins grey out; the frame label counts down to `◎ 0 open`.

## You can also pin without the UI

Agents and scripts create annotations via the REST API:

```bash
curl -X POST localhost:7625/api/annotations/landing \
  -H 'content-type: application/json' \
  -d '{"selector":"h1","box":{"x":40,"y":60,"w":600,"h":80},"viewport":{"w":1280,"h":800},"text":"bigger headline"}'
```

