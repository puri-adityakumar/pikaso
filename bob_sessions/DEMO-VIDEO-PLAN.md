# Pikaso — Demo Video Plan & Recording Runbook

Handoff doc: everything needed to finish the demo video chunks and assemble the
final demo. **Current state after this doc was pushed: chunk 1 is recorded and
committed; chunks 2–4 are fully scripted below and need ~20 minutes to capture.**

**Companion doc:** `docs/VIDEO-PLAN.md` — the ≤3:00 submission edit: hackathon
constraints, verbatim narration, scene timing, brand rules. This runbook captures
the raw chunks; that doc turns them into the final MP4.
Chunk → scene map: **chunk 1 → scene 2 · chunk 2 → scene 3 · chunk 3 → scene 4 ·
chunk 4 → scene 6** (capture at 1280×720; the edit upscales to 1080p).

Repo: `puri-adityakumar/pikaso` (main). Hackathon deadline: **2026-09-27 15:00 UTC.**

---

## 1. What already exists (committed)

| Asset | Path | Status |
|---|---|---|
| Video chunk 1 — board pan/zoom + create frame | `bob_sessions/videos/pikaso-demo-chunk-1-board-pan-zoom-new-frame.webm` | ✅ 7.5s, 181 frames, 24fps, 1280×720 |
| Screenshot — board initial | `bob_sessions/demo-01-board-initial.png` | ✅ |
| Screenshot — new frame created (toast) | `bob_sessions/demo-02-new-frame-created.png` | ✅ |
| Screenshot — three frames on board | `bob_sessions/demo-03-three-frames.png` | ✅ |
| Product fixes this session (all pushed, `npm test` 50/50 green) | watcher-leak fix, agentCommand shell dispatch, Copy-prompt spawn fix, DESIGN-SPEC purpose/token-contract/final-state, D22 attribution, PR #1 landing page merged | ✅ |

Demo board state on disk (`.pikaso/`): 3 frames — `pikaso-landing` (hero mockup),
`pricing-page-with-three-tiers` (starter), `checkout-page` (starter). Annotations: empty.

## 2. Setup for recording

```bash
# server (currently may already be running on 7625)
node src/bin/pikaso.js            # serves http://localhost:7625, project mode
npm test                          # 50/50 green sanity check
```

Recording mechanism that works (ZCode in-app browser):
- `tab.recording.start({ fps: 24, showCursor: true, maxDurationMs: 90000, viewport: {width:1280,height:720}, settleMs: 800, actions: [...] })`
  — the **actions array is mandatory in practice**: a bare `start()` job dies after ~1.4s.
- Poll `tab.recording.status(id)` until `completed`, then
  `tab.recording.status(id, { outputPath: "bob_sessions/videos/<name>.webm" })` to save.
- `maxDurationMs` hard cap is 90000. Keep each chunk under ~30s of actions.

Hard-won gotchas:
- `maxDurationMs` ≤ 90000 or the API rejects the call.
- Wheel zoom needs a `move` action first (wheel has no x/y; it fires at the current cursor).
- Wheel zooms the **board** only when the cursor is over the dotted background, not an
  iframe. At 100% zoom the background strips are: x<120, y<160, x>1400 (1280×720 viewport).
- Pan drag must **mousedown on the background** — a press over the iframe opens the
  annotation comment box instead (this is a feature, see chunk 2).
- Zoom pill buttons: use CSS ids `#zoom-in` / `#zoom-out` — name-matching "+" / "−" breaks
  on the Unicode minus.
- Tab viewport must be set to 1280×720 **before** recording so coordinates match
  (`tab.setViewportSize({width:1280,height:720})` + `tab.reload()` for a clean 100% view).
- ⚠ UNVERIFIED: whether the recorder's `type`/`click` selector actions pierce into the
  frame iframes (first chunk-2 attempt stalled in "preparing" and was cancelled — likely
  the iframe-piercing `type selector:"textarea"` action). Chunk 2 lists a proven fallback.

## 3. Shot list

### Chunk 1 — Board: pan, zoom, create mockup ✅ DONE
`pikaso-demo-chunk-1-board-pan-zoom-new-frame.webm` — wheel zoom-to-cursor, pan,
"+ Generate mockup" → `checkout-page` created with Bob-prompt toast, zoom out to
frame all three.

### Chunk 2 — Annotate an element  ⬜ (~8s)
File: `pikaso-demo-chunk-2-annotate.webm`

1. Reset: `tab.setViewportSize(1280×720)` → `tab.reload()` → wait 1s (view = 100%).
2. `move` to x760 y560, then `click` x760 y590 → lands on the hero heading
   "Annotate. Iterate." inside the `pikaso-landing` iframe → hover dashed outline, then
   the comment box opens (`Add a comment…`).
3. Type: `Make the headline pop — larger display size` → click `.pikaso-btn-save`.
4. Expected: numbered pin ① at the heading, top label flips to `◉ 1 open`.

**Fallback (proven path) if selector actions don't pierce the iframe:** perform steps
2–3 live via `tab.dom_cua` (click → textarea is auto-focused by annotate.js, type, press
Ctrl+Enter) **without recording**, then record the *result* with a short actions job
(zoom to the pin, hover it, open tooltip) and capture stills:
`bob_sessions/demo-04-annotation-pin.png`, `demo-05-comment-box.png`.
Verify with `curl localhost:7625/api/annotations/pikaso-landing` → 1 open annotation.

### Chunk 3 — Bob iterates + live reload + resolve  ⬜ (~10s)
File: `pikaso-demo-chunk-3-live-reload-resolve.webm`

1. Start recording with the board framed on `pikaso-landing`.
2. **While recording**, from a shell run the "Bob edit":
   ```bash
   # .pikaso/frames/pikaso-landing/mockup.html — swap the h1 accent color/size, e.g.:
   sed -i 's/#58a6ff/#f78166/' .pikaso/frames/pikaso-landing/mockup.html   # pick the h1 var
   ```
3. Expected: the iframe reloads **without a page refresh** (SSE `reload` event) — say it
   in the narration; this is the money shot.
4. Click pin ① → tooltip → `.pikaso-resolve-btn` → pin greys out, label `◎ 0 open`.
   (Same iframe-piercing caveat as chunk 2; fallback = live resolve + still shots.)
5. Stills: `demo-06-live-reload.png`, `demo-07-pin-resolved.png`.

### Chunk 4 — Lock → DESIGN-SPEC → implementation prompt  ⬜ (~8s)
File: `pikaso-demo-chunk-4-lock.webm`

1. Resolve any open annotations first (lock is 409-blocked otherwise — that's the
   product working; optionally record the 409 toast as a bonus beat).
2. Click `#lock-btn` → modal shows stats `3 frames · N resolved · 0 open`.
3. Click **Copy prompt** (sends `run:false` — must NOT spawn an agent; that bug is fixed
   and tested). Toast "Prompt copied".
4. Show the written file — `.pikaso/DESIGN-SPEC.md` now has per-frame **Purpose /
   Token contract / Final state / resolved annotation history**.
5. Stills: `demo-08-lock-modal.png`, `demo-09-design-spec.png`
   (spec open in an editor with the token contract visible).

### Chunk 5 (optional) — Landing page intro/outro
`landing/` (merged from PR #1) is the marketing one-pager: `cd landing && npm install
&& npm run dev` → record 5s hero scroll for the video intro. Stills from
`landing/dist/img/` are presentation-ready.

## 4. Assembly

```bash
# normalize + concat (all chunks are 1280×720 @24fps webm)
cd bob_sessions/videos
for f in pikaso-demo-chunk-*.webm; do
  ffmpeg -y -i "$f" -c:v libx264 -pix_fmt yuv420p -r 30 "${f%.webm}.mp4"
done
printf "file '%s'\n" pikaso-demo-chunk-*.mp4 > list.txt
ffmpeg -y -f concat -safe 0 -i list.txt -c copy pikaso-demo-final.mp4
```

Order: chunk 1 (board) → 2 (annotate) → 3 (live reload + resolve) → 4 (lock).
Narration beats: "click any element" → "Bob edits the file" → "iframe reloads live" →
"lock writes DESIGN-SPEC and fires the implementation prompt".

Screenshots double as: README hero, slide stills, `bob_sessions` evidence
(`pikaso_task<NN>_*.png` convention per `bob_sessions/README.md`).

## 5. Reset the demo board (for re-takes)

```bash
rm -rf .pikaso/frames/checkout-page
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('.pikaso/project.json'));p.frames=p.frames.filter(f=>f.name!=='checkout-page');fs.writeFileSync('.pikaso/project.json',JSON.stringify(p,null,2))"
curl -s localhost:7625/api/annotations/pikaso-landing   # should be []
```

## 6. When all chunks are ready

Pull latest main → drop the webms into `bob_sessions/videos/` per the names above →
run assembly (§4) → commit `feat(demo): final video + stills` → push. The demo is then
board-live (`node src/bin/pikaso.js`) with the final video as the fallback playback.
