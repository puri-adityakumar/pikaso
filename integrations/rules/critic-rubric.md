# Pikaso Design Council — Critic Rubric

This rubric is for Design Council critic agents. Each critic audits a frame's
`mockup.html` against the checklist below and returns a structured verdict.

Verdict format (required, no deviations):

```
PASS
```

or

```
FIX: [comma-separated list of issue codes, each followed by a one-line description]
```

Example: `FIX: [CONTRAST-001 body text on hero fails 4.5:1, SPACING-003 nav padding uses 13px]`

The Art Director collects all FIX lists, deduplicates, and sends ONE consolidated
revision to the Builder. You are read-only — do not edit files.

---

## Rubric categories

### H — Hierarchy & Typography

| Code | Check | Fail condition |
|------|-------|----------------|
| H-001 | Heading levels decrease in visual weight | h2 appears larger or heavier than h1 |
| H-002 | Body text is legible base size | Body text below 14px |
| H-003 | Type scale is consistent | More than 4 distinct font sizes used |
| H-004 | Line length is readable | Body text lines exceed ~80 characters wide |
| H-005 | Heading hierarchy is semantic | Headings used purely for visual styling (skipped levels) |

### C — Colour & Contrast

| Code | Check | Fail condition |
|------|-------|----------------|
| C-001 | Normal text meets 4.5:1 contrast | Body text fails WCAG AA |
| C-002 | Large text meets 3:1 contrast | Heading/display text fails WCAG AA large |
| C-003 | UI components meet 3:1 | Button borders, form outlines, icons below threshold |
| C-004 | Palette is limited | More than 8 non-neutral colours in use |
| C-005 | Colour is not the only signal | Error/success state conveyed by colour only (no icon/text) |
| C-006 | No anti-default colours | Bootstrap blue (#0d6efd) or Material teal (#009688) unchanged |

### S — Spacing & Layout

| Code | Check | Fail condition |
|------|-------|----------------|
| S-001 | 4px grid adherence | Spacing values not on 4px grid (e.g. 13px, 22px) |
| S-002 | Consistent component padding | Identical components have inconsistent internal padding |
| S-003 | Whitespace signals hierarchy | Section boundaries lack sufficient breathing room |
| S-004 | No orphaned elements | Single items left-aligned in centred layouts, etc. |

### A — Accessibility & Semantics

| Code | Check | Fail condition |
|------|-------|----------------|
| A-001 | Interactive elements are keyboard-reachable | Buttons/links implemented as divs/spans with no role |
| A-002 | Images have alt text | `<img>` without `alt` attribute |
| A-003 | Form inputs are labelled | `<input>` without associated `<label>` or `aria-label` |
| A-004 | Focus styles visible | `:focus` style `outline: none` without replacement |
| A-005 | Language declared | Missing `lang` attribute on `<html>` |

### R — Responsiveness & Layout

| Code | Check | Fail condition |
|------|-------|----------------|
| R-001 | Layout reflows below 768px | Fixed-width layout breaks on narrow viewport |
| R-002 | Touch targets are large enough | Interactive elements below 44×44px (WCAG 2.5.5) |
| R-003 | Text doesn't overflow containers | Long words or URLs break out of fixed containers |

### B — Brand & Design System Consistency

| Code | Check | Fail condition |
|------|-------|----------------|
| B-001 | Token contract honoured | Primary colour differs from other frames without reason |
| B-002 | Component patterns consistent | Button style in this frame differs from design-system.md |
| B-003 | Tone is consistent | Visual weight / density is dramatically inconsistent with sibling frames |

### T — Technical (mockup-specific)

| Code | Check | Fail condition |
|------|-------|----------------|
| T-001 | File is self-contained | External CSS/JS links, CDN references, relative asset paths |
| T-002 | Selector stability | Key elements lack id or stable class names (hard to annotate) |
| T-003 | Valid HTML5 | Missing DOCTYPE, missing `<meta charset>`, unclosed tags |
| T-004 | No framework boilerplate | Unused CSS classes, default browser reset only partially applied |

---

## Scoring guidance

- A single **H-001**, **C-001**, or **T-001** failure is always a FIX — no exceptions.
- Minor issues (1–2 S-001 violations, 1 cosmetic B-003) may be bundled into one
  FIX item rather than separate codes.
- If all checks pass, respond with exactly `PASS` — no commentary, no suggestions.
- Do not re-audit after the fix cycle. One round of feedback per cold path.

---

## What critics do NOT do

- Do not suggest adding features not in the brief.
- Do not comment on content copy (spelling, marketing language) unless it affects
  accessibility (e.g. missing alt text).
- Do not suggest technology changes ("use React" / "add Tailwind").
- Do not rewrite or improve the mockup — only report issues.
