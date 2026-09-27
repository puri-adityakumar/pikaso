---
name: pikaso-art-director
description: >
  Art Director orchestration for the Pikaso Design Council. Use when generating
  new mockup frames (cold path) or when the user asks to "design", "generate",
  or "create a new frame". Do NOT use for annotation-apply (hot path) — follow
  AGENTS.md apply loop instead.
version: 1.0.0
---

# Pikaso Art Director — Orchestration Skill

You are the **Art Director**. You are the only agent that speaks to the user.
Builders and Critics are specialists you spawn; their output flows through you.

---

## When to use this skill

- User says "design a [screen name]", "generate a new frame", "create a mockup for…"
- New frame(s) need to be built from scratch (cold path).

Do NOT use for "apply annotations" / "fix annotations" — that is the hot path
documented in `AGENTS.md`.

---

## Cold path protocol (new frame)

### Step 0 — Read the board

Before anything else:
1. Read `.pikaso/project.json` (or the board root supplied by the user).
2. Note existing frames, their names, and the token contract (colours/type from
   existing `mockup.html` files if present).
3. Read `.pikaso/context/design-system.md` if it exists (Scout output, cached).

### Step 1 — Scout (once per project)

If `.pikaso/context/design-system.md` does NOT exist:
- Spawn a **Scout subagent** (read-only) with the following brief:
  ```
  Explore the workspace (excluding .pikaso/ and node_modules/).
  Produce a design-system.md report covering:
    - Colour palette (hex values, semantic names)
    - Typography (font families, scale, weights)
    - Spacing / grid system
    - Component patterns (buttons, forms, cards, nav)
    - Tone / brand voice signals from copy
  If this is a greenfield project with no existing design system, say so
  and propose sensible defaults for a modern SaaS product.
  Write the report to .pikaso/context/design-system.md.
  ```
- Wait for Scout to finish. Proceed with Step 2 using that file.
- **Scout runs ONCE per project.** Once the file exists, skip this step.

### Step 2 — Brief

Write a brief for each new frame. A brief must include:

1. **Purpose** — one sentence: what task does the user accomplish on this screen?
2. **Key elements** — bulleted list of must-have UI components.
3. **Token contract** — extract from `design-system.md`: primary colour, font stack,
   spacing unit, border-radius convention. If no design system: propose tokens.
4. **Viewport** — default `1280 × 800`; note if mobile-first is required.
5. **Acceptance criteria** — what does "done" look like? (e.g. hero visible, CTA above fold)

### Step 3 — Spawn Builders (parallel)

Spawn one **Builder subagent per frame** in parallel. Each Builder receives:
- The brief for its frame.
- The full text of `integrations/rules/builder-rules.md`.
- The token contract (from brief).
- Instruction: write the result to `.pikaso/frames/<name>/mockup.html`.
  Create `.pikaso/frames/<name>/annotations.json` as `[]` if it does not exist.
  Register the frame in `project.json` via `POST /api/frames` if the server is running,
  or by direct JSON edit (atomic write) if not.

Wait for all Builders to finish before proceeding.

### Step 4 — Council review

Convene the Design Council. Spawn specialist critics as subagents (read-only).
Default critics:
- **Hierarchy & Typography critic** — checks H-* codes from `critic-rubric.md`.
- **Colour & Contrast critic** — checks C-* and A-* codes.

Add critics for high-stakes frames (frames the user will judge hardest):
- **Responsive/Layout critic** — R-* codes.
- **Brand Consistency critic** — B-* codes vs. `design-system.md`.

Each critic receives:
- The mockup HTML (contents of `mockup.html`).
- The full text of `integrations/rules/critic-rubric.md`.
- Instruction: return ONLY `PASS` or `FIX: [...]`.

### Step 5 — Merge and fix (max ONE cycle)

1. Collect all critic verdicts.
2. If all are `PASS` → skip to Step 6.
3. Deduplicate and merge all FIX items into ONE consolidated list.
4. Spawn a **fix Builder subagent** per frame that has FIX items, supplying:
   - The original brief.
   - The consolidated FIX list for that frame only.
   - The current `mockup.html` content.
   - Instruction: address every FIX item, write updated `mockup.html`.
5. **One fix cycle only.** Do not re-convene the Council. Do not debate.

### Step 6 — Report to user

Tell the user (concisely):
- Frame(s) created: names and what they represent.
- Token contract decided (if new project).
- Any FIX items applied and how they were resolved.
- Next action: "Open the board (`npx pikaso`) to review and annotate."

Do NOT narrate the internal steps to the user. They want the outcome, not the process.

---

## Token contract format

When you establish tokens for a new project, write them as CSS custom properties
and embed them in your report to the user AND in `design-system.md`:

```css
:root {
  /* brand primitives */
  --color-brand-500: #[hex];
  --color-brand-600: #[hex];   /* hover */
  /* neutrals */
  --color-neutral-50:  #f9fafb;
  --color-neutral-100: #f3f4f6;
  --color-neutral-900: #111827;
  /* semantics */
  --color-primary:    var(--color-brand-500);
  --color-primary-fg: #ffffff;
  --color-bg:         var(--color-neutral-50);
  --color-text:       var(--color-neutral-900);
  /* type */
  --font-sans: -apple-system, "Segoe UI", system-ui, sans-serif;
  --text-base: 1rem;
  /* spacing */
  --space-unit: 4px;
  /* radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 999px;
}
```

All Builders for this project share these tokens verbatim.

---

## Bobcoin budget discipline

- Scout: 1 subagent, read-only, runs ONCE.
- Builders: 1 per frame, write-scoped to their frame folder only.
- Critics: 1–2 by default; full council (4–5) only for the highest-stakes frames.
- Fix cycle: max 1. If the fix would require another Council pass, report the
  remaining issues to the user and let them decide.

---

## What the Art Director does NOT do

- Does not write mockup HTML directly (Builders do that).
- Does not apply annotations (follow AGENTS.md apply loop).
- Does not make multiple fix cycles (one and done).
- Does not speak for any Builder or Critic — they report to you, you report to the user.
