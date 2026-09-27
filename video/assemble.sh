#!/usr/bin/env bash
# assemble.sh - build the Pikaso demo video
#
# Usage (from anywhere, Git Bash):
#   bash /c/Workspace/pikaso/video/assemble.sh
#
# Prerequisites before running:
#   - bob_sessions/videos/cards/*.webm         (card recordings, optional but expected)
#   - bob_sessions/videos/pikaso-demo-*.webm   (demo chunks; *.mp4 also accepted)
#   - video/order.txt                          (one normalized filename per line, e.g. "card-01.mp4")
#   - bob_sessions/videos/voice/{s1,s2,s3,s4a,s4c,s4e,s4g,s5}.mp3
# Output:
#   bob_sessions/videos/pikaso-demo-final.mp4  (1280x720 30fps h264/aac, +faststart, yuv420p)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
VID_DIR="$REPO_DIR/bob_sessions/videos"
CARDS_DIR="$VID_DIR/cards"
VOICE_DIR="$VID_DIR/voice"
NORM_DIR="$VID_DIR/norm"
ORDER_FILE="$SCRIPT_DIR/order.txt"
MUSIC_DIR="/c/Users/puria/.agents/skills/brag/assets/music"
FINAL_OUT="$VID_DIR/pikaso-demo-final.mp4"

VIDEO_CODEC_ARGS=(-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p)
FPS=30
W=1280
H=720

shopt -s nullglob

# ---------------------------------------------------------------- step 1
echo "== Step 1: normalizing recordings to ${W}x${H} ${FPS}fps h264/yuv420p into $NORM_DIR"
mkdir -p "$NORM_DIR"

inputs=()
for f in "$CARDS_DIR"/*.webm "$VID_DIR"/pikaso-demo-*.webm "$VID_DIR"/pikaso-demo-*.mp4; do
  [ -f "$f" ] || continue
  base="$(basename "$f")"
  [ "$base" = "pikaso-demo-final.mp4" ] && continue   # never re-ingest our own output
  inputs+=("$f")
done

if [ "${#inputs[@]}" -eq 0 ]; then
  echo "ERROR: no input recordings found (looked in $CARDS_DIR and $VID_DIR/pikaso-demo-*)" >&2
  exit 1
fi

for f in "${inputs[@]}"; do
  base="$(basename "$f")"
  out="$NORM_DIR/${base%.*}.mp4"
  echo "   normalizing: $base -> $(basename "$out")"
  ffmpeg -hide_banner -loglevel error -y -i "$f" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS}" \
    -an "${VIDEO_CODEC_ARGS[@]}" "$out"
done

# ---------------------------------------------------------------- step 2
echo "== Step 2: concatenating clips listed in $ORDER_FILE"
if [ ! -f "$ORDER_FILE" ]; then
  echo "ERROR: order file not found: $ORDER_FILE" >&2
  exit 1
fi

CONCAT_LIST="$NORM_DIR/concat.txt"
: > "$CONCAT_LIST"
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%#*}"
  line="$(echo "$line" | tr -d '[:space:]')"
  [ -z "$line" ] && continue
  if [ ! -f "$NORM_DIR/$line" ]; then
    echo "ERROR: order.txt references missing normalized file: $line" >&2
    exit 1
  fi
  printf "file '%s'\n" "$NORM_DIR/$line" >> "$CONCAT_LIST"
done < "$ORDER_FILE"

COMBINED="$NORM_DIR/combined.mp4"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$CONCAT_LIST" -c copy "$COMBINED"

VIDEO_DUR="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$COMBINED")"
echo "   combined video: $COMBINED (${VIDEO_DUR}s)"

# ---------------------------------------------------------------- step 3
echo "== Step 3: building voice track (s1,s2,s3,s4a,s4c,s4e,s4g,s5) and ducked music bed"
VOICE_ORDER=(s1 s2 s3 s4a s4c s4e s4g s5)

VOICE_LIST="$NORM_DIR/voice-concat.txt"
: > "$VOICE_LIST"
for name in "${VOICE_ORDER[@]}"; do
  f="$VOICE_DIR/$name.mp3"
  if [ ! -f "$f" ]; then
    echo "ERROR: missing voice file: $f" >&2
    exit 1
  fi
  printf "file '%s'\n" "$f" >> "$VOICE_LIST"
done

VOICE_WAV="$NORM_DIR/voice.wav"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$VOICE_LIST" \
  -ar 48000 -ac 2 -c:a pcm_s16le "$VOICE_WAV"

VOICE_DUR="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VOICE_WAV")"
echo "   voice track: $VOICE_WAV (${VOICE_DUR}s)"

MUSIC="$(ls "$MUSIC_DIR"/*.mp3 2>/dev/null | sort | head -n 1 || true)"
if [ -z "$MUSIC" ]; then
  echo "ERROR: no music track found in $MUSIC_DIR" >&2
  exit 1
fi
echo "   music track: $MUSIC"

# ---------------------------------------------------------------- step 4
echo "== Step 4: mixing audio over video and exporting $FINAL_OUT"
# Music: looped, trimmed to video length; volume 0.13 while voice plays ([0, VOICE_DUR]),
# 0.35 elsewhere. Voice is padded to video length. amix without normalization.
ffmpeg -hide_banner -loglevel error -y \
  -i "$COMBINED" \
  -stream_loop -1 -i "$MUSIC" \
  -i "$VOICE_WAV" \
  -filter_complex "[1:a]atrim=0:${VIDEO_DUR},asetpts=N/SR/TB,volume=volume='if(lt(t\\,${VOICE_DUR})\\,0.13\\,0.35)':eval=frame[music];[2:a]apad[voice];[music][voice]amix=inputs=2:duration=first:normalize=0[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -b:a 192k \
  -movflags +faststart \
  "$FINAL_OUT"

echo "== Done: $FINAL_OUT ($(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_OUT")s, 1280x720 30fps, yuv420p, faststart)"
