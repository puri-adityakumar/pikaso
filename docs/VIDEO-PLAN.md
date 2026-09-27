# Pikaso — Demo Video Plan (target: ≤ 3:00, MP4)

## Hard constraints (from hackathon guidelines)

- **Max length 3:00** — judges stop watching at 3 minutes.
- **≥ 90 seconds** must show the solution in action on screen.
- **Narration required** — include voice describing what is being demonstrated.
- Must clearly demonstrate how **IBM Bob** was used.
- Upload **MP4** via the lablab.ai submission form.

## Tooling

| Asset | Tool |
|---|---|
| Board / canvas scenes | ZCode browser recording (`tab.recording` → WebM segments) |
| Title / outro cards | Brand HTML pages (same fonts + palette as landing) recorded the same way |
| Bob IDE / terminal scenes | Manual screen capture (OBS / Xbox Game Bar / QuickTime) |
| Hook segment (optional) | `/brag` or `/brag-slim` render (15–25 s, music + motion) |
| Illustrations | GMI free model (`hy-image-v3.5-preview`) — bot council + hero art already generated |
| Narration | **User voiceover** from the script below (ZCode cannot synthesize voice; brag `--voice` only covers its own 15–25 s render) |
| Music | Royalty-free bed at low volume under narration (brag render brings its own) |
| Edit / export | Clipchamp / CapCut / Shotcut → MP4, 1920×1080, ≤ 3:00 |

## Brand rules (match the landing)

Epilogue (wordmark) · Lora (display) · Manrope (body) · palette: paper `#fbf9f4`, ink `#2b2a26`, mint `#9fe7a4`, butter `#f8e9a9`, sky `#a9e8eb`, dark `#1d1c19` · grain texture · bot council characters (Scout / Art Director / Builder / Critic).

## Shot list (180 s)

| # | Time | Scene | On screen | Narration (verbatim) |
|---|---|---|---|---|
| 1 | 0:00–0:15 | Hook / problem | Title card: "Chat is a lossy channel for design." + quick cut of messy chat feedback | "Coding agents ship HTML in seconds. But when the design is wrong, you describe the problem in words. And words lose intent." |
| 2 | 0:15–0:30 | Meet Pikaso | Board (browser): two frames, pins visible, bot council image corner card | "Pikaso puts the mockup on a canvas. You point at what's wrong, and your coding agent applies every mark." |
| 3 | 0:30–0:55 | Annotate live | Browser recording: click CTA element → dashed outline → type comment → pin appears; second annotation on hero | "I click any element, leave a comment, and it becomes a pin anchored to that exact selector. No prose, no guessing." |
| 4 | 0:55–1:45 | **THE LOOP (Bob applies)** | Bob IDE: task session applying annotations; terminal output; back to board → live reload flips pins to resolved | "Now Bob reads the annotations file, edits the mockup, and marks each comment resolved. Watch the board reload live. Two annotations, one batch apply, under a minute." |
| 5 | 1:45–2:10 | Second cycle + Council | Annotate two more elements (checkout frame); Bob applies again; Council verdict card flash | "Batch everything, apply once. The design council of critic agents has already reviewed the draft before I ever comment." |
| 6 | 2:10–2:35 | Lock → implementation | Lock button → DESIGN-SPEC.md appears → Bob Shell starts implementation → implemented landing page | "When the draft is right, I lock it. Every decision becomes a design spec, and implementation starts from evidence, not memory." |
| 7 | 2:35–2:55 | Close | Outro card: bot council + badges (Bob IDE, Claude Code, Cursor, any AGENTS.md) + `npx pikaso` + GitHub URL | "Pikaso works with any harness. Built with Bob, on Bob, for the IBM Bob 2.0 Hackathon. Point. Don't describe." |
| 8 | 2:55–3:00 | End card | Logo + GitHub URL, silent tail | (none) |

Solution-in-action time: scenes 3–6 = **~95 s** ✓ (≥ 90 s requirement)

## Pre-recording checklist

- [ ] Board demo data staged: `pikaso-landing` board, 2 frames, 2 pre-written annotations ready to post
- [ ] Bob IDE open on hackathon account; tasks visible for the session-screenshot moment (scene 4 doubles as evidence)
- [ ] Landing implemented page reachable for scene 6 tail
- [ ] Browser at 1920×1080, bookmarks bar hidden, preview server running
- [ ] Mic test done; script printed

## Edit checklist

- [ ] Assemble segments, cut silences, keep total ≤ 3:00
- [ ] Narration under all scenes except end card; music −18 dB under voice
- [ ] Zoom punches on: pin creation, annotations.json diff, resolved flip
- [ ] Export MP4 1080p; verify duration ≤ 3:00 and audio present
- [ ] Also export the `/brag` 15–25 s cut as the social/share asset (README + Discord)
