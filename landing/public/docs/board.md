# Board basics

The board is a pan/zoom canvas — like Figma, but every frame is a real HTML
file an agent can edit.

## Navigating

- **Pan** — drag any empty canvas space
- **Zoom** — scroll wheel (zooms to cursor) or the `+` / `−` buttons
- **Frames** — each mockup is a card on the canvas with a live label:
  `◉ 2 open · 1 resolved`, or `◎ 0 open` when clean

## Frames

Every frame is a folder under `.pikaso/frames/` containing one self-contained
`mockup.html`:

```
.pikaso/frames/landing/mockup.html
```

Frames are created by your agent (or with `POST /api/frames`). There is no
project-type, no template, no lock-in — any HTML works.

## Select / focus mode

Click a frame's title bar to focus it: the frame fills the viewport, which
makes reviewing dense pages comfortable. Click the background to zoom back out.

## Labels

The frame title bar tracks annotation state live over SSE:

| Label | Meaning |
|-------|---------|
| `◉ N open` | N unresolved pins — agent has work to do |
| `◎ 0 open` | All pins resolved — ready to lock |

