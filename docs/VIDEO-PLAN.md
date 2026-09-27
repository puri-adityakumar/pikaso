# Pikaso — Final Demo Script & Production Plan (v2: FINAL)

> Target: **2:52** · hard cap 3:00 · in-action ≥ 90 s ✓ · narration via Kokoro TTS
> Raw-capture mechanics (recorder settings, gotchas, board reset): `bob_sessions/DEMO-VIDEO-PLAN.md`
> Creative laws: brag skill (hook ≤2s, fast-in/hold, show the thing, no SaaS language).

## Tools (final)

| Job | Tool |
|---|---|
| All footage | ZCode browser recorder — `tab.recording`, 1280×720@24fps, actions array, ≤90s/chunk |
| Title/step/outro/pipeline cards | Hand-built HTML/CSS in `video/cards/` — landing brand (Epilogue/Lora/Manrope, pastel palette, grain), brag motion laws (fast-in, hold ≥0.3s/word) |
| Pipeline animation (scene 3) | Hand-coded animated SVG in an HTML card |
| Voiceover | Kokoro TTS: `npx hyperframes tts "<line>" --voice af_heart --output video/voice/<id>.wav` (fallback: user voiceover from this script) |
| Music | brag bundled track `assets/music/happy-beats-*.mp3` (royalty-free), duck to 0.13 under voice |
| 1 new image | GMI free model `hy-image-v3.5-preview` — deliberate AI-slop purple-gradient page for scene 1 |
| Assembly | ffmpeg: normalize → concat → mix voice+music → MP4 1080p ≤ 3:00 |
| Social cut (optional, post-submission) | Real Hyperframes render, 15–25s |

## Scene timeline (sums to 2:52)

| # | Time | Scene | On screen | Narration (final, verbatim) |
|---|---|---|---|---|
| 1 | 0:00–0:24 | Problem | Montage: AI-purple slop page → our 2 generic AI images → terminal typing "make the CTA pop more". Stamp: "AI is great at making things." | "We're all tokenmaxxing right now. Building with AI, day and night. And we all quietly agree on one thing: AI is bad at frontend design. It's great at making stuff. HTML, pages, images, all day long. But when the design is wrong, you're stuck describing pixels in a chat box. And words lose intent." |
| 2 | 0:24–0:37 | Thus, Pikaso | Landing hero slow scroll (grainy pin-sun art) | "So we built Pikaso. Design review that lives on the mockup itself." |
| 3 | 0:37–0:57 | Pipeline | Animated SVG: mockup → pin drops → arrow → bot → file diff → board reload → lock → spec. Labels: Annotate / Apply / Lock | "The whole pipeline. Point at any element and comment. Every annotation is pinned to a real selector, with real coordinates. Your agent reads that file, edits the mockup, and the board reloads live. When the draft is right, you lock it. Every decision becomes a spec." |
| 4a | 0:57–1:07 | Meet the board | Live board: 3 frames, pan, pins | "This is a Pikaso board. Three mockups, one project. Everything here is plain HTML and JSON, sitting in the repo." |
| 4b | 1:07–1:10 | Slide | "STEP 1 · POINT" | — |
| 4c | 1:10–1:38 | Annotate live | Click heading → comment box → pin; 6 pins total across 2 frames | "I click any element and leave a comment. The comment becomes a pin, anchored to that exact selector, with its exact position. Six pins, two frames, thirty seconds. No describing, no guessing." |
| 4d | 1:38–1:41 | Slide | "STEP 2 · LET BOB COOK" | — |
| 4e | 1:41–2:21 | Bob applies | Bob applies annotations (terminal shows real Bob invocation); board live-reloads; pins resolve; second batch cycle | "Now Bob goes to work. It reads the annotations file, opens the mockup, and applies every pin. The board reloads the moment the file changes. Each resolved pin goes grey. Two batch applies, six annotations, no chat messages. This is the loop." |
| 4f | 2:21–2:24 | Slide | "STEP 3 · LOCK THE DRAFT" | — |
| 4g | 2:24–2:34 | Lock | Lock modal (stats) → DESIGN-SPEC.md in editor | "Draft looks right? Lock it. Every comment, every decision condenses into a design spec, ready for implementation." |
| 5 | 2:34–2:47 | Close | Outro card: bot council + "I'm a design engineer." | "I'm a design engineer, and this is how I make design with AI now. With Pikaso, you can make it too. Thank you." |
| 6 | 2:47–2:52 | End card | Logo · `npx pikaso` · github.com/puri-adityakumar/pikaso | (silent) |

**In-action audit:** 4a+4c+4e+4g = 92 s live product ✓ (scene 3's mechanism animation adds 20 s on top).

## Production order

1. `video/cards/` build: slop-prompt card, 3 step slides, pipeline SVG, outro, end card
2. GMI generate slop page (scene 1 asset)
3. TTS: generate all narration WAVs; verify Kokoro quality (fallback: user VO)
4. Record scenes in order (recorder settings per runbook; extended takes per timings above)
5. ffmpeg assemble → `bob_sessions/videos/pikaso-demo-final.mp4`
6. Review against edit checklist (≤3:00, voice present, Bob visible, zoom punches on pin/resolve/spec)
