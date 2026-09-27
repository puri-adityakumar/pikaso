# Pikaso Builder Rules

Rules for the Builder agent role when generating or revising `mockup.html` files.
Read these before writing a single line of HTML. They apply to every frame you build.

---

## 1 · Read the design brief before writing code

The Art Director will supply a brief. Read it completely before touching the editor.
Understand:

- **Purpose** — what does this screen do for the user?
- **Audience** — who will see it? (consumer vs. developer vs. enterprise)
- **Token contract** — which visual tokens (colours, type scale, spacing) are shared
  with other frames? Deviation from the contract breaks brand cohesion.
- **design-system.md** — if Scout has cached one, read it first. Match existing
  patterns (button styles, form layouts, nav structure) rather than inventing new ones.

---

## 2 · Design dials — set them consciously

Before laying out the frame, choose a position on each dial. State your choices in a
comment at the top of the `<style>` block:

| Dial | Low end | High end | Default |
|------|---------|----------|---------|
| **Variance** | Tight grid, minimal colour use | Expressive, asymmetric, rich colour | Medium-low |
| **Motion** | Static / no animation | Keyframe-heavy, parallax | None (mockup) |
| **Density** | Generous whitespace, few elements | Information-dense, data-table feel | Medium |

For mockups, default motion to **none** — animations waste agent cycles and confuse
annotation selectors.

---

## 3 · Anti-default discipline

Never use framework defaults as design decisions. Specifically:

- **No Bootstrap blue** (`#0d6efd`). Choose a deliberate primary colour from the brief.
- **No bare serif body text** — use a system sans stack unless the brief specifies a
  specific typeface (and inline it as a `data:` URI if it must load).
- **No 8px or 10px border-radius on every element** — vary radii to create hierarchy
  (0px on data tables, 4px on chips, 8px on cards, 999px on pills).
- **No `margin: auto` + fixed `max-width: 1200px` for every page** — consider
  sidebar layouts, full-bleed heroes, or fluid grids where appropriate.
- **No grey-on-grey placeholder text** — placeholder copy must meet 3:1 contrast on
  the input background.

---

## 4 · Type scale adherence

Use a consistent modular scale. The default scale (adjust via token contract):

```
--text-xs:   0.75rem   / 1.4   (12px)
--text-sm:   0.875rem  / 1.5   (14px)
--text-base: 1rem       / 1.6   (16px)
--text-lg:   1.125rem  / 1.5   (18px)
--text-xl:   1.25rem   / 1.4   (20px)
--text-2xl:  1.5rem    / 1.35  (24px)
--text-3xl:  1.875rem  / 1.25  (30px)
--text-4xl:  2.25rem   / 1.15  (36px)
```

Limit each frame to **3–4 distinct sizes**. More than 4 reads as noise.

Heading hierarchy: `h1` → `h2` → `h3` must decrease in visual weight. Never use
headings for styling — pick the semantically correct level.

---

## 5 · Spacing scale adherence

Use a 4px base unit. Prefer multiples: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
Do not invent ad-hoc values like `13px`, `22px`, or `37px`. The human eye detects
irregular spacing instantly.

---

## 6 · Contrast floors (WCAG 2.1 AA minimum)

| Text type | Minimum contrast ratio |
|-----------|----------------------|
| Normal text (< 18px or < 14px bold) | 4.5 : 1 |
| Large text (≥ 18px or ≥ 14px bold) | 3 : 1 |
| UI components & focus indicators | 3 : 1 |
| Decorative / disabled | No requirement |

Check visually before submitting. Dark-mode variants must also meet the floor.
Never place light-grey text on white backgrounds for body copy.

---

## 7 · Self-contained HTML requirements

The mockup must work when loaded as an iframe on a different origin:

- **All CSS inline** — inside `<style>` tags in `<head>`.
- **All JS inline** — inside `<script>` tags (avoid if possible; mockups rarely need JS).
- **No external resources** — no CDN links, no Google Fonts `<link>`, no relative
  `src="./img/hero.png"`. Use SVG inline or `data:` URIs for images.
- **`https://` stock images are acceptable** (Unsplash, Picsum) for hero images where
  a data URI would be impractical — mark them with `<!-- stock -->` comment.
- The file must render correctly with no server running — open it in a browser
  directly via `file://` and it should look right.

---

## 8 · Colour discipline

- Define all colours as CSS custom properties in `:root`. Never hardcode hex values
  in component rules.
- Derive semantic tokens from primitives:
  ```css
  :root {
    /* primitives */
    --blue-500: #3b82f6;
    /* semantics */
    --color-primary: var(--blue-500);
    --color-primary-fg: #fff;
  }
  ```
- Use a **limited palette**: 1 primary, 1 accent (optional), neutrals (3–5 steps),
  semantic (success/warning/error). A 12-colour palette for a mockup is a red flag.

---

## 9 · Interaction states (even in static mockups)

Show hover/focus/active states via CSS `:hover`, `:focus-visible`. Users annotating
the mockup will inspect these states. A button with no hover state looks unfinished.

---

## 10 · Completion checklist

Before returning the mockup, verify:

- [ ] Brief fully addressed — every section of the brief has a corresponding element.
- [ ] Token contract honoured — colours, type, spacing match other frames.
- [ ] Anti-defaults applied — no framework blue, no ad-hoc spacing, no grey-on-grey.
- [ ] Contrast floors met — check all text/background pairs visually.
- [ ] Self-contained — no external links, no relative paths.
- [ ] Selector stability — important elements have `id` attributes or stable class names
      so annotation selectors survive minor edits.
- [ ] File is valid HTML5 — opening `<!DOCTYPE html>`, `<html lang>`, `<meta charset>`.

---

> design rules distilled with inspiration from Leonxlnx/taste-skill (MIT)
