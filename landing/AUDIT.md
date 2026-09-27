# Pikaso landing page — design audit vs. readily.ai

Auditor date: 2026-09-27. Reference fetched live (`https://readily.ai/`, CSS bundle `/_astro/index.ClAKGi_T.css`, three JS islands). Our sources: `index.html`, `src/App.jsx`, `src/styles.css`, plus 7 screenshots (3 reference, 4 ours).

Reference stack evidence: Astro + Tailwind v4; fonts self-hosted + Fontsource CDN; GSAP (`ScrollTrigger` ×2), Lenis smooth scroll (26 refs), `IntersectionObserver` ×3, `requestAnimationFrame` ×17; `data-reveal` ×31, `data-snap` ×9, `data-parallax`, `data-bg`/`data-bg-at` hero color/parallax hooks; keyframes `c-btn-lift` / `c-btn-drop`; drag carousel (`cursor-grab`/`grabbing`, `will-change-transform`).

---

## 1. Scorecard

| Dimension | Score | One-line justification |
|---|---|---|
| Design system | 7/10 | Palette and paper/grain mood genuinely map to readily's world, but we lack their per-hue tint scales, hard two-tone section splits, radius-0 buttons, and flush nav CTA. |
| Typography | 5/10 | Right *kind* of pairing (display serif + quirky sans) but Lora at weight 500 is the wrong character for PP Fragment Glare at 300, and our headlines run ~20% smaller. |
| Motion/Animation | 2/10 | We animate nothing except two hover lifts; readily runs smooth scroll, 31 reveal targets, parallax, 3D button keyframes, a drag marquee, and animated section backgrounds. |
| Copywriting | 7/10 | Specific, product-real language (selectors, `annotations.json`, harnesses) that readily can't match for a dev tool, let down by em-dash density and a borrowed headline formula. |
| AI-slop cleanliness | 5/10 | 18 em-dashes in `App.jsx` alone, "shockingly fast", two "zero X" constructions, one adjective-stack triple; clean otherwise (no seamlessly/effortlessly/unlock — verified by grep). |
| Overall fidelity to reference quality | 6/10 | Layout grammar, palette, and ghost-heading device land; the flatness (no motion) and heavy-handed headline weight keep it feeling like a still frame of the reference. |

---

## 2. Design system comparison

### Color palettes

readily.ai tokens (extracted verbatim from CSS bundle):

| Token | Hex | Role |
|---|---|---|
| `--color-obsidian` | `#030303` | text, dark sections |
| `--color-cloud` | `#ffffff` | page base, nav |
| `--color-dust` | `#e9e5e0` | warm gray section bg (#problem) |
| `--color-stone` | `#bcb4ab` (+200 `#e9e5e0`, 300 `#d5cfc7`, 500 `#9b948b`, 600 `#79736b`, 700 `#58534d`, 800 `#3a3733`) | muted text, case-studies bg (`#79736b`), trust section (`stone-800`) |
| `--color-mint`/`meadow-200` | `#8eeba5` (meadow-100 `#c6f4d2`, 300 `#5fd98a`, 500 `#34a382`, 600 `#2a8a6e`) | mint section, nav CTA |
| `--color-pollen` | `#ffe27f` (100 `#fff3c6`, 500 text `#d29c12`) | butter sections, audit-review eyebrow |
| `--color-sky` | `#29cae6` (100 `#cff7ff`, 300 `#8de8fa`, 400 `#54d5ef`, 600 `#14a6c2`) | sky section |
| `--color-breeze` | `#bcf6ff` | accent tint |

Ours (`src/styles.css :root`): `--paper #fbf9f4`, `--ink #2b2a26`, `--muted #84837b`, `--green #62d96b`, `--mint #9fe7a4`, `--butter #f8e9a9`, `--butter-deep #f2cf62`, `--pink #f4b8c0`, `--sky #a9e8eb`, `--sky-pale #c9f0f2`, `--dark #1d1c19`, `--dark-ink #f4f2ea`.

**What readily does that we don't:**
- **Per-hue tint scales.** Every hue ships as a 100/300/600 family (`pollen-100 #fff3c6` section bg vs `pollen-200 #ffe27f` saturated panel vs `pollen-500 #d29c12` eyebrow text). We have exactly one value per hue, so our sections can't do the light-left/saturated-right split their pollen and sky sections use (clearly visible in the butter screenshot: `#fff3c6` copy half vs stronger yellow visual half).
- **Near-black, not warm-black.** Their ink is `#030303`; ours is `#2b2a26`. Intentional warmth is fine, but their obsidian makes headlines bite more.
- **Square buttons.** `.c-button` has no border-radius (hero screenshot confirms sharp corners on "Book a Demo"); ours are `border-radius: 8px`.
- **Flush nav CTA.** Their "Book a Demo" is a full-height (48px `h-12` nav) mint block glued to the right viewport edge; ours is a floating rounded pill.
- **Full-viewport section rhythm.** Every section is `data-snap` with `min-h-[840px]`/`lg:h-screen` and `py-[100px]`; vw-based gutters (`lg:pl-[5vw]`, `lg:pt-[11vw]`). Ours is a fixed rem scale (3rem gutters, 7–7.5rem section padding) and normal scroll flow.

**What we do that readily doesn't:**
- Rotated "pinned paper" transforms everywhere (`.frame-a rotate(-1.2deg)`, `.loop-card.r0 rotate(-1.6deg)`, `.code-card rotate(1deg)`, `.get-art rotate(1.4deg)`). Readily's cards sit straight; only their #problem pinwheel rotates. Our tilt-everything is a stylistic divergence — charming but busier.
- Grain on **all three** colored sections at `opacity .1 multiply`; readily applies `.noise` only to the stone-800 trust section, at full strength.
- Sticky blurred nav; theirs is fixed opaque with a hard edge.

**What we copied well:**
- Ghost watermark heading (their tone-on-tone "Case Files" on mint → our "The Loop" on mint).
- Pastel-section alternation: cloud → mint → butter → sky → dark → white maps 1:1 onto their cloud → dust/mint → pollen → sky → meadow → stone-800 → white rhythm.
- Muted warm-gray hero headline (their hero h1 renders in stone-gray, not black — ours matches with `--muted`).
- Dark "trust/badges" section analog (their SOC 2/HIPAA/ISO chips → our Bob IDE/Claude Code/Cursor chips).
- Grainy pastel hero illustration (their crayon landscape, parallaxed → our grainy still + CSS board).

### Card/shadow/eyebrow patterns

| Pattern | readily | Ours |
|---|---|---|
| Card radius | ~8–12px, straight | 12px (`--radius` n/a, hardcoded) |
| Card shadow | soft, toned to bg | `0 16px 36px rgba(43,42,38,.1)` — close |
| Button | radius 0, hover = 3D lift keyframes with dual butter shadows `#d8c68699`/`#d8c68633`, `translateZ(34px)` + `translateX(8px)`, 0.6s `cubic-bezier(.5,0,.5,1)` | radius 8px, hover `translateY(-2px)` + generic shadow, 0.15s |
| Eyebrow | `.eyebrow` = 12px, uppercase, tracking **0.06em**, stone-600; feature-section eyebrows are **18px in accent color** (pollen-500 `#d29c12`, sky-600 `#14a6c2`, meadow-600 `#2a8a6e`) | 11.5px, uppercase, tracking **0.2em**, always `--muted` |
| Body text | Special Gothic 16px | Manrope 16px/1.6 |

---

## 3. Typography comparison

### readily's actual fonts (with evidence)

- **Headlines: PP Fragment Glare** (Pangram Pangram), weights 300 (Light) and 400 (Regular), self-hosted and preloaded: `<link rel="preload" href="/assets/fonts/PPFragment-GlareLight.woff2" ...>` plus `@font-face{font-family:PP Fragment;src:url(/assets/fonts/PPFragment-GlareLight.woff2);font-weight:300...}`. Variable **Fraunces** loaded from Fontsource as fallback. `--font-headline:"PP Fragment", Fraunces, Georgia, serif`.
- **Body/UI: Special Gothic** (variable 400–700, Fontsource CDN) with Inter fallback: `--font-body:"Special Gothic", "Special Gothic Expanded One", Inter, system-ui, sans-serif`.
- Headline rules: `h1` fluid 48→80px (plus up to 15% oversize above 1440px), `font-weight:300`, `line-height:1.1`, `letter-spacing:-.01em`, `text-wrap:balance`; `h2` 48→64px same treatment. Giant display lines (final CTA): `clamp(52px,5.8vw,84px)`, `font-light`, `leading-[1.02]`, `tracking-[-0.02em]`, per-line `whitespace-nowrap`.
- Labels: `--text-label-1:12px`, `letter-spacing:.06em`, uppercase.

### Ours

- Epilogue 700/800 (brand wordmark only), **Lora 500/600** (all headings), Manrope 400–700 (body) via one Google Fonts link (`index.html` line 18).
- `.hero h1`: `clamp(2.7rem, 4.4vw, 4.1rem)` = 43.2→65.6px, weight 500, lh 1.1, ls −0.015em, color `--muted`.
- `h2`s: max ~49.6px; `.get h2` max 59.2px in `--muted`.

### Character differences at headline scale

- PP Fragment Glare is a **high-contrast display serif with flared "glare" terminals**, designed to be set huge and *light*; at 80px/300 it reads airy and editorial. Lora is a **text serif built for body sizes**; at weight 500 and 65px it reads bookish, dark, and slightly cramped — the opposite temperature. The screenshots show it plainly: readily's hero headline is delicate hairline-ish strokes; ours is sturdy and ink-heavy.
- Special Gothic has a condensed, slightly gothic personality; Manrope is a neutral geometric sans. Body reads fine but with less voice.

### Size ratio headlines-to-body

- readily: h1 80px vs 16px body = **5.0:1** (display CTA 84px = 5.25:1). Ours: h1 65.6px vs 16px = **4.1:1**. Their hierarchy is louder.

### Concrete CSS adjustments

1. `index.html`: load Lora 400 alongside 500 — `family=Lora:wght@400;500;600` → then `styles.css` line 31: `h1, h2, h3, .statement { font-weight: 400; letter-spacing: -0.01em; }` (400 at display size approximates the glare-light look; 500 reads heavy).
2. `.hero h1`: `font-size: clamp(3rem, 5vw, 5rem);` (→80px max, ratio 5:1) and `line-height: 1.08;`.
3. `.why h2, .council h2, .protocol h2`: `font-size: clamp(2.5rem, 4.2vw, 4rem);` (→64px, matches their h2).
4. `.get h2`: `font-size: clamp(3.25rem, 5.8vw, 5.25rem); line-height: 1.05; letter-spacing: -0.02em; color: var(--ink);` — readily's equivalent giant statement is obsidian, ours is muted gray.
5. Add `text-wrap: balance;` to `h1, h2` (readily uses `text-balance` throughout).
6. `.eyebrow`: `letter-spacing: 0.2em → 0.08em; font-size: 0.75rem;` (their tracking is 0.06em; ours is visibly airier than the reference).

---

## 4. Motion/animation audit

### What readily animates (evidence)

| Motion | Evidence |
|---|---|
| Lenis smooth scrolling | 26 `lenis` refs in `Layout` island; `{lerp, duration, easing}` config |
| Scroll-triggered reveals, 31 targets | `data-reveal` ×31; GSAP in Layout.js: `utils.toArray("[data-reveal]")`, default `y:40`, `data-reveal-from` left/right variants, trigger at `"88%"` viewport; disabled under `prefers-reduced-motion` |
| Full-viewport section snapping | `data-snap` on 9 sections |
| Hero parallax + background morph | `data-parallax="true"` on hero art; `data-bg="cloud" data-bg-at="top top"`; `data-paper-animation` on #problem (section bg animates between tab states) |
| 3D button lift/drop | `@keyframes c-btn-lift` / `c-btn-drop`: `perspective(900px) rotateY(0) translateZ(34px)`, dual shadow layers `#d8c68699`/`#d8c68633`, `--button-lift-duration:.6s` (0.35s small), `--button-hover-translate-x:8px`, easing `cubic-bezier(.5,0,.5,1)` |
| Drag testimonial marquee | `testimonials__container ... will-change-transform`, `cursor-grab`/`grabbing` |
| Pinwheel / product UI motion | `ProblemSolution`/`Features` islands (rotating card pinwheel on mint section, blurred list rows animating in the pollen panel screenshot) |

### What we animate

- `.btn:hover`/`.cmd:hover`: `translateY(-2px)`, 0.15s. That is the complete inventory.
- Static transforms (card rotations) and `scroll-behavior: smooth`. No IntersectionObserver anywhere, no keyframes, no transitions beyond hovers.

### Proposed minimal motion spec (no libraries; IntersectionObserver + CSS)

Shared easing token: `--ease-out: cubic-bezier(0.6, 0, 0, 1);` (readily's `--ease-default`, verbatim).

1. **`reveal-up`** — section headers, `.statement`, `.lede`, `.cast-item`, `.code-card`, `.council-card`, `.dark-card`, `.get-copy`. Base: `opacity:0; transform:translateY(28px)`; `.is-visible`: `opacity:1; transform:none`; `transition: opacity .7s var(--ease-out), transform .7s var(--ease-out)`; stagger via `[data-delay="1|2|3"] { transition-delay: .08s/.16s/.24s }`. JS: one `IntersectionObserver` (threshold 0.15) adding `.is-visible` once, guarded by `matchMedia("(prefers-reduced-motion: reduce)")` (mirrors readily's exact pattern: y=40 at 88% with reduced-motion bail-out).
2. **`card-drop`** — the three `.loop-card`s: same reveal but from `translateY(40px) rotate(var(--tilt))` so the rotation settles in; stagger 0/.12s/.24s.
3. **`pin-pop`** — hero board `.pin-1/2/3`: `@keyframes pin-pop { 0% {transform: scale(0)} 60% {transform: scale(2.1)} 100% {transform: scale(1.7)} }`, `.5s var(--ease-out) both`, delays `.9s/1.1s/1.3s` after load. Cheap, on-brand (pins literally popping onto the board).
4. **`term-type`** — `.term-body p`: `opacity:0; transform:translateY(6px)` → in, `fadeUp .35s ease-out both`, sequential delays `1.2s/1.5s/1.8s/2.1s`, runs once on load. Sells the "agent applies" story in the hero.
5. **`btn-lift`** — replace current hover with readily's directional lift approximation: `.btn, .cmd { transition: transform .45s cubic-bezier(.5,0,.5,1), box-shadow .45s cubic-bezier(.5,0,.5,1); }` `.btn-butter:hover { transform: translate(-3px,-3px); box-shadow: 6px 8px 0 -1px rgba(216,198,134,.55), 2px 2px 4px rgba(216,198,134,.4); }` (butter-toned dual shadow = their `#d8c686` pair); `.btn-green:hover` same shape with `rgba(3,3,3,.28)`.
6. **`ghost-drift`** (progressive enhancement only): `@supports (animation-timeline: view()) { .ghost { animation: ghost-drift linear both; animation-timeline: view(); } }` with `translateY(48px) → translateY(-32px)`. Zero JS; degrades to static.
7. **`cmd-copied`** — `.cmd` on copy: quick `scale(0.97)` pulse (120ms) before the label flips to "copied ✓". Feedback the reference also lacks; 3 lines.

Deliberately not proposed: smooth-scroll hijack (Lenis), section snapping, bg morphing — high risk, low fidelity payoff for a static clone.

---

## 5. Copywriting audit, section by section

### Nav
- **Theirs:** Product · Testimonials · Login · **Book a Demo** (mint block).
- **Ours:** How it works · Why · Council · Protocol · GitHub · **Start building**.
- Verdict: ours is a long-scroll anchor nav naming invented section names; acceptable, but "Start building" promises more than an `npx` demo does. "Get the beta" or keep — minor.

### Hero
- **Theirs (verbatim):** kicker "The AI-native compliance platform for healthcare" (sentence case, plain body text — *not* their `.eyebrow`); h1 "Healthcare compliance deserves better tools"; sub "Readily connects regulatory change to your policies and operations — so your team stays audit-ready, in one system you can trust."; CTA "Book a Demo →"; "Backed by" + YC/Define Ventures/CHCF logos.
- **Ours (verbatim):** eyebrow "DESIGN REVIEW FOR AGENT-DRIVEN DEVELOPMENT"; h1 "Design review deserves better than chat."; lede "Coding agents ship HTML shockingly fast — but your feedback travels as prose, so intent gets lost and everything becomes rework. Pikaso puts the mockup on a canvas: point at any element, leave a comment, and your agent applies every mark — live."; CTAs "npx pikaso →" and "See the loop".
- Verdict: structure matches (kicker/h1/sub/dual CTA). Two problems: the h1 is a structural paraphrase of their headline (see §6), and our lede is two sentences + 2 em-dashes where theirs is one clean sentence. The `npx pikaso` CTA is *better* than theirs for this audience — keep.

### Mint section (their #problem vs our Loop)
- **Theirs:** tab chips "Policies / Legislation / Regulations / Contracts / Reports / Case Files"; ghost heading "Case Files"; rotating white-card pinwheel; h2 "All connected on a single platform".
- **Ours:** ghost "The Loop"; statement "Three moves. / Zero lost intent."; cards "01 Annotate / 02 Apply / 03 Lock" with 2–3 sentence bodies.
- Verdict: ghost device copied well; our statement is punchier than their flat h2. But their section *moves* (pinwheel rotates, bg morphs per tab) and ours is three static tilted cards — the motion gap is most visible exactly here.

### Butter section (their Audit Review vs our Why)
- **Theirs:** eyebrow "Audit Review"; h2 "Stop hunting for evidence"; body "Readily analyzes each audit requirement, cites supporting evidence, and drafts the assessment — so reviewers verify in seconds instead of digging for hours." One sentence, verb-triple formula ("analyzes…, cites…, and drafts… — so…"), repeated across all three feature sections ("scans…, identifies…, and drafts…", "collects…, scrubs…, and flags…").
- **Ours:** eyebrow "Why we're building this"; h2 "Chat is a lossy channel for design."; three paragraphs including the quoted user speech ("the header feels crowded, the CTA should pop more") and the `annotations.json` code card.
- Verdict: theirs is a *capability* section, ours is a *manifesto* — a legitimate fork, and our specifics (selector + box coordinates in the JSON) are stronger evidence than their abstractions. But 3 dense paragraphs vs their 1 sentence; cut paragraph 1's quote-play down or tighten. Eyebrow "Why we're building this" is generic; their eyebrows name the capability.

### Sky section (their Regulatory Change Management vs our Council)
- **Theirs:** eyebrow "Regulatory Change Management"; h2 "From rule change to redline"; one-sentence body.
- **Ours:** eyebrow "The design council"; h2 "A design team meets before you ever click."; intro + 4 cast items (Scout / Art Director / Builders ×N / The Council) + `art-director — design read` card.
- Verdict: ours is the most original section on the page; "The only agent that talks to you" is genuinely good. Keep almost verbatim.

### Dark section (their Trust vs our Protocol)
- **Theirs:** h2 "Built for the trust healthcare runs on"; h3s Confidentiality/Assurance/Control with one-liners; chips SOC 2 / HIPAA / ISO 42001; "Explore Our Trust Center →".
- **Ours:** eyebrow "Open protocol"; h2 "Any harness speaks Pikaso."; lede "The runtime state is files — the server is a bridge, the skill is text. Nothing is locked to one tool…"; two code cards; badges Bob IDE (lit) / Bob Shell / Claude Code / ZCode / Cursor / any AGENTS.md.
- Verdict: good structural analog; badges ≈ their compliance chips is a smart transplant. Ours is more technical, theirs more trust-building — for a hackathon judges audience, ours is correct.

### Final CTA
- **Theirs:** display headline "Your expertise deserves better infrastructure" (84px, obsidian); "Book a demo and see how Readily would handle a regulation or audit your team is tackling right now."; CTA Book a Demo.
- **Ours:** "Point. Don't describe."; copy-button `npx pikaso` with "copy/copied ✓"; small print "Zero dependencies, nothing in your package.json. The board lives in a gitignored `.pikaso/` — or pass `--global` and your workspace never sees it at all."
- Verdict: ours is shorter, more imperative, and the clipboard button is a better CTA than theirs. Main gap is scale/color (see §3) — theirs is 84px near-black, ours ~59px muted gray. Also note: their headline is the *third* "deserves better" on their site; ours deliberately does not copy it here — good.

### Footer
- **Theirs:** full description paragraph, Quick Links, Trust Pages, Follow us, "© 2026 Readily. All rights reserved."
- **Ours:** "pikaso · MIT" + "Built for the IBM Bob 2.0 Hackathon · Sept 25–27 2026 · built with Bob, on Bob".
- Verdict: thinner but honest and specific. Fine.

---

## 6. AI-slop sweep of OUR copy

### Em-dashes — 20 total (18 in `App.jsx`, 2 in `index.html`)

| # | File:line | Sentence (quoted) |
|---|---|---|
| 1 | App.jsx:76 | `✓ header.cta — updated` |
| 2 | App.jsx:77 | `✓ hero.sub — updated` |
| 3 | App.jsx:92 | "Coding agents ship HTML shockingly fast — but your feedback travels as prose…" |
| 4 | App.jsx:95 | "…your agent applies every mark — live." |
| 5 | App.jsx:119 | "…anchored to that element — not to a paragraph of prose." |
| 6–7 | App.jsx:124 | "…structured annotations — selector, position, comment — edits the mockup…" (two in one sentence) |
| 8 | App.jsx:129 | "…condenses into a DESIGN-SPEC.md — design intent survives the handoff…" |
| 9 | App.jsx:165 | "Agents are better at HTML than we expected — and worse at design review than we need." |
| 10 | App.jsx:178 | "…it doesn't evaporate into chat history — it becomes a spec…" |
| 11 | App.jsx:204 | "…extracts the design system — or reports, cleanly, that there isn't one." |
| 12 | App.jsx:206 | "…parallel, write-scoped agents — one per frame…" |
| 13 | App.jsx:207 | "…specialist critics convened per frame — typography, contrast, layout." |
| 14 | App.jsx:216 | "…small, opinionated, and scoped — built on our own orchestration…" |
| 15 | App.jsx:230 | `art-director — design read` (card label) |
| 16 | App.jsx:253 | "The runtime state is files — the server is a bridge, the skill is text." |
| 17 | App.jsx:275 | `3 batch applies — never per-comment` |
| 18 | App.jsx:309 | "…gitignored `.pikaso/` — or pass `--global`…" |
| 19 | index.html:6 | `<title>Pikaso — Design review for agent-driven development</title>` |
| 20 | index.html:9 | meta: "…on a canvas — you annotate, the agent applies…" |

Why it matters: 20 em-dashes on one page is the single most recognizable LLM-prose fingerprint. #1, #2, #15, #17 sit inside terminal/code-card fiction where a dash reads as machine output — **defensible, keep those four**. The other 16 are narrator voice and should go. Rewrites (no em-dashes):

- #3: "Coding agents ship HTML in seconds, but your feedback travels as prose, so intent gets lost and everything becomes rework." (also kills "shockingly fast", see below)
- #4: "…and your agent applies every mark live."
- #5: "…anchored to that element, not to a paragraph of prose."
- #6–7: "Your agent reads the pins as structured annotations (selector, position, comment), edits the mockup, and marks each one resolved."
- #8: "…condenses into a DESIGN-SPEC.md, so design intent survives the handoff to implementation."
- #9: "Agents are better at HTML than we expected, and worse at design review than we need."
- #10: "…it doesn't evaporate into chat history; it becomes a spec the next agent can implement from."
- #11: "…extracts the design system, or reports cleanly that there isn't one."
- #12: "…parallel, write-scoped agents, one per frame, sharing one token contract…"
- #13: "…specialist critics convened per frame: typography, contrast, layout."
- #14: "…small and opinionated, with tight scope: built on our own orchestration…" (also fixes the adjective stack, below)
- #16: "The runtime state is files: the server is a bridge, the skill is text."
- #18: "…gitignored `.pikaso/`, or pass `--global` and your workspace never sees it at all."
- #19: `<title>Pikaso: Design review for agent-driven development</title>`
- #20: "…on a canvas: you annotate, the agent applies, the draft locks into a spec."

### "deserves better" — TOO CLOSE, rewrite

Ours (App.jsx:90): **"Design review deserves better than chat."** readily's h1: **"Healthcare compliance deserves better tools"**; their final CTA repeats the formula: **"Your expertise deserves better infrastructure"**. Our headline reproduces the exact "X deserves better (than) Y" skeleton of the reference's most prominent string. On a deliberate pastiche this could read as homage; on a hackathon entry judged next to the reference it reads as lifted. **Verdict: rewrite.** Suggested: **"Design review belongs on the mockup."** (short, points at the mechanism, no echo; also frees "Point. Don't describe." from redundancy).

### "shockingly fast"

App.jsx:92: "Coding agents ship HTML **shockingly fast**". Intensifier-adverb crutch; the claim carries no number. Rewrite above ("ship HTML in seconds") or make it real: "ship a screen before you've opened Figma".

### "zero X" — twice

- App.jsx:141: statement "Three moves. / **Zero lost intent.**" → "Three moves. **Nothing lost.**" (same punch, no template).
- App.jsx:308: "**Zero dependencies**, nothing in your package.json." → "**No dependencies**, nothing in your package.json." (two "zero X" on one page is the tell; one instance of either would have been fine).

### Rule-of-three constructions

- "selector, position, comment" (App.jsx:124) — literal enumeration of a data schema, **defend**: it names actual JSON keys.
- "typography, contrast, layout" (App.jsx:207) — literal list of council specialisms, **defend**.
- "Annotate / Apply / Lock" + "Three moves." — structural, **defend**.
- "small, opinionated, and scoped" (App.jsx:216) — *character-triple adjective stack*, the one genuine offender. Rewrite: "small and opinionated, with tight scope".

### Italic/emphasis crutches

- `<strong>point</strong>` (App.jsx:94) — single, load-bearing, mirrors the product gesture. **Defend, keep.**
- `<em>describe</em>` (App.jsx:167) — italicizing a word that is immediately followed by the actual quotation is redundant crutching. Drop the `em`: "you describe what's wrong ("the header feels crowded…")" — the quote does the work.

### "seamlessly/effortlessly/elevate/unlock/empower" type words

Grep across `App.jsx` and `index.html`: **zero hits**. Clean.

### Lowercase-brand affectation

Nav/footer render the wordmark as "pikaso" (lowercase) while `index.html` title uses "Pikaso". readily capitalizes "Readily" everywhere. Lowercase wordmarks are a known indie-brand affectation. **Verdict:** the lowercase wordmark next to the pin glyph is a coherent brand choice — keep it in the logo lockup, but stop mixing: the `<title>` and body prose should consistently use "Pikaso" (title already does; body prose at App.jsx:95/173 does — consistent enough; just never write "pikaso" in prose).

### Generic-vs-specific misses

- **No numbers anywhere.** readily's case-study section is all proof: "saved **90%** of time", "saved **$734K** annually", "audits from **20 → 150**". Our page has zero quantified claims. We don't need fake customer stats, but the demo's real numbers belong somewhere (e.g. under the CTA: "the demo board: 9 pins, 2 batch applies, one locked spec").
- **"Why we're building this" eyebrow** is the only generic label on the page; their eyebrows name capabilities ("Audit Review", "Monitoring"). Suggest "The lossy channel".
- **Hero lede** says "everything becomes rework" without naming the artifact loop; the Why section then does it better. Trimming the lede to one sentence (rewrite above) fixes both density and vagueness.

---

## 7. Prioritized fix list

| # | P | File | Exact change |
|---|---|---|---|
| 1 | P0 | `src/App.jsx` | De-em-dash pass: apply the 16 narrator-voice rewrites in §6 (lines 92, 95, 119, 124, 129, 165, 178, 204, 206, 207, 216, 253, 309 + title/meta in `index.html:6,9`). Keep the 4 terminal/code-card dashes. |
| 2 | P0 | `src/App.jsx:90` | Replace h1 string "Design review deserves better than chat." → "Design review belongs on the mockup." (removes the readily echo). |
| 3 | P0 | `src/App.jsx:92` | "shockingly fast" → "in seconds" (covered by #1's line-92 rewrite; listed separately because it must not survive any partial pass). |
| 4 | P0 | `src/styles.css` + `src/App.jsx` | Add reveal system: CSS — `.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.6,0,0,1),transform .7s cubic-bezier(.6,0,0,1)} .reveal.is-visible{opacity:1;transform:none} [data-delay="1"]{transition-delay:.08s} [data-delay="2"]{transition-delay:.16s}` wrapped in `@media (prefers-reduced-motion: no-preference)`. JS — one `useEffect` IntersectionObserver (threshold .15, unobserve after fire) toggling `.is-visible` on ~12 elements (section headers, `.loop-card` ×3 staggered, `.cast-item` ×4, `.code-card`, `.dark-card` ×2, `.get-copy`). |
| 5 | P0 | `index.html` (line 18) + `src/styles.css` (line 31, 111–116, 246, 284, 309) | Load `Lora:wght@400;500;600`; set headings `font-weight:400; letter-spacing:-0.01em; text-wrap:balance`; `.hero h1{font-size:clamp(3rem,5vw,5rem);line-height:1.08}`; `.why h2,.council h2,.protocol h2{font-size:clamp(2.5rem,4.2vw,4rem)}`; `.get h2{font-size:clamp(3.25rem,5.8vw,5.25rem);line-height:1.05;letter-spacing:-0.02em;color:var(--ink)}`. |
| 6 | P1 | `src/styles.css` (68–79, 310–323) | Button lift upgrade: `.btn,.cmd{transition:transform .45s cubic-bezier(.5,0,.5,1),box-shadow .45s cubic-bezier(.5,0,.5,1)}`; `.btn-butter:hover{transform:translate(-3px,-3px);box-shadow:6px 8px 0 -1px rgba(216,198,134,.55),2px 2px 4px rgba(216,198,134,.4)}`; `.btn-green:hover{transform:translate(-3px,-3px);box-shadow:6px 8px 0 -1px rgba(3,3,3,.2),2px 2px 4px rgba(3,3,3,.15)}`. |
| 7 | P1 | `src/styles.css` (199–204) | Ghost heading tone-on-tone like readily's "Case Files" (darker than bg, not lighter): `.ghost{color:rgba(0,0,0,0.12)}` (renders as darker mint on `#9fe7a4`). |
| 8 | P1 | `src/App.jsx:141,308` | "Zero lost intent." → "Nothing lost."; "Zero dependencies" → "No dependencies". |
| 9 | P1 | `src/styles.css` (48–57) + per-section | Eyebrow fix: base `letter-spacing:.08em;font-size:.75rem`; accent eyebrows like readily (18px tinted): `.why .eyebrow{color:#a97e0e;font-size:1.05rem}` (pollen-500 analog), `.council .eyebrow{color:#15707f;font-size:1.05rem}` (sky-600 analog). Also rename App.jsx:162 eyebrow "Why we're building this" → "The lossy channel". |
| 10 | P1 | `src/styles.css` (245, 264) | Hard two-tone splits (readily's pollen/sky pattern): `.why{background:linear-gradient(105deg,#fdf0bd 0%,#fdf0bd 50%,#f6dd7a 50%,#f6dd7a 100%)}`; `.council{background:linear-gradient(105deg,#c9f0f2 0%,#c9f0f2 50%,#a9e8eb 50%,#a9e8eb 100%)}` (uses existing tokens' lighter/deeper pair). |
| 11 | P2 | `src/styles.css` (37–46) | Hero micro-motion: `@keyframes pin-pop{0%{transform:scale(0)}60%{transform:scale(2.1)}100%{transform:scale(1.7)}}` applied to `.pin-1/2/3` (`animation:pin-pop .5s cubic-bezier(.6,0,0,1) both; animation-delay:.9s/1.1s/1.3s` — note these selectors currently use `transform:scale(1.7)`; the keyframe end state replaces it); `.term-body p{animation:fadeUp .35s ease-out both}` with sequential delays 1.2–2.1s. |
| 12 | P2 | `src/App.jsx` (Get section) + `src/styles.css` | Add one concrete proof line under `.cmd`: "The demo board: 9 pins, 2 batch applies, one locked DESIGN-SPEC." (matches the hero terminal fiction; replaces genericness with numbers). Optionally square the nav CTA toward readily's flush block: `.nav{padding:.6rem 3rem}` + `.nav-cta .btn-green{border-radius:2px}`. |

*(Count: 12. P0 = 5, P1 = 5, P2 = 2.)*
