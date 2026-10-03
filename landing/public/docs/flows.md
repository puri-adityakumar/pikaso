# User flows

Pikaso today, drawn as ASCII — one diagram per scenario. Everything here is
what the product implements right now.

## Scenario 1 — Generate a mockup (cold path)

You talk in the terminal; the board updates in front of you.

```text
You (terminal)                Agents                         Disk / Board
──────────────                ──────                         ────────────
"design a pricing page" ───►  Art Director
                              │
                              ├─► Scout (once per project)
                              │     reads codebase  ───────►  .pikaso/context/design-system.md
                              │
                              ├─► writes briefs
                              ├─► spawns Builders  ─────────► .pikaso/frames/pricing/mockup.html
                              ├─► spawns Critics ── verdict? ─┐ (rubric: critic-rubric.md)
                              │        │ approved             │
                              ▼        ▼                      ▼
        📋 toast: "pricing ready" ──────►  frame appears on the BOARD (localhost:7625)
```

## Scenario 2 — Review & annotate (you, on the board)

Nothing goes to the agent yet — pins are just files waiting.

```text
Browser (localhost:7625)
─────────────────────────
open board ──► click any element in the frame
                   │
                   ├─► dashed hover outline → comment box opens
                   ├─► type "make the headline pop" → save
                   ▼
              numbered pin ① sticks to the element
              frame label flips to  ◉ 1 open
```

## Scenario 3 — Agent applies your feedback (hot path)

The money shot: the frame reloads live, without a page refresh.

```text
You (terminal)                Agent                            Board
──────────────                ──────                           ─────
"apply the annotations" ───►  reads .pikaso/annotations/*.json
                              │
                              ├─► edits mockup.html (headline bigger...)
                              │        │
                              │        ▼
                              │   SSE live-reload ──────────►  iframe refreshes WITHOUT page reload
                              ├─► marks pin ① resolved
                              ▼
        board label:  ◎ 0 open · pin ① turns grey
       (loop: you re-review → new pins → apply again, until happy)
```

## Scenario 4 — Lock → handoff

One click turns the draft into a spec the next agent can implement from.

```text
Board                          Disk                            Terminal
─────                          ─────                           ────────
click 🔒 LOCK
   │  (409-blocked if pins still open — that's the product working)
   ▼
modal: "3 frames · N resolved · 0 open"
   │  Copy prompt
   ▼
                                                        paste into agent ──► implementation begins,
                                                                         guided by the spec
   └────────────────────────────────►  .pikaso/DESIGN-SPEC.md
                                        (per-frame Purpose · Token contract ·
                                         Final state · resolved history)
```

## Who does what

| Step | You are… | Where |
|------|----------|-------|
| 1. Generate | talker in terminal | agent + Council |
| 2. Review | designer on the board | browser, click + pin |
| 3. Apply | reviewer watching live reload | terminal ↔ board |
| 4. Lock | decision maker | one click → spec → build |

## What's not in any flow (yet)

Auditing a UI that already exists in production. Today the loop always starts
from a generated mockup, not from real shipped pages — that's the next idea on
the roadmap.
