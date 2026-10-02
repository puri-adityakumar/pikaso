# Lock & handoff

Lock is the moment a design draft stops being a draft.

## What happens

Click **Lock** on the board. Pikaso:

1. Refuses if any annotation is still open (`409` — resolve your pins first;
   that's the product working, not a bug)
2. Writes `.pikaso/DESIGN-SPEC.md`
3. Copies an implementation prompt to your clipboard

## DESIGN-SPEC.md

The spec is written for the agent that implements the real feature. Per frame:

- **Purpose** — what the screen is for
- **Token contract** — the exact colors, type and spacing the mockup settled on
- **Final state** — the structure and behavior of the approved mockup
- **Annotation history** — every pin you left and how it was resolved

## The implementation prompt

"Copy prompt" hands you a prompt that points your agent at the spec. Paste it
in the terminal and the real implementation starts — with the design decisions
already made, so the agent builds the thing you reviewed instead of inventing
one.

## After lock

Frames are marked `locked` in `project.json`. The board keeps the history;
the spec is the handoff artifact. Start a new board (or new frames) for the
next design round.

