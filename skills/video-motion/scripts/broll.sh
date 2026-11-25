#!/usr/bin/env bash
# Usage: broll.sh <project_dir> <clip-or-photo>...
# Converts phone clips and photos into public/broll/ at the project's size (H.264, 30 fps, no audio),
# then writes frames/broll/sheet.jpg with one frame per file and prints name, duration and orientation.
set -euo pipefail
export LC_ALL=C
[ $# -ge 2 ] || { echo "uso: broll.sh <projeto> <arquivo>..."; exit 2; }
DIR="$(cd "$1" && pwd)"; shift
source "$(dirname "$0")/env.sh"
need_ffprobe
read -r W H < <("$PY" -I -c "import json,sys;m=json.load(open(sys.argv[1]));print(m['width'],m['height'])" "$DIR/src/data/meta.json")
OUT="$DIR/public/broll"; SHEET="$DIR/frames/broll"
mkdir -p "$OUT" "$SHEET"
n=$(find "$OUT" -maxdepth 1 -type f | wc -l)
for f in "$@"; do
  n=$((n + 1))
  base=$(basename "$f"); stem=${base%.*}
  slug=$(printf '%s' "$stem" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//' | cut -c1-40)
  id=$(printf '%02d-%s' "$n" "$slug")
  scale="scale=${W}:${H}:force_original_aspect_ratio=increase:force_divisible_by=2"
  read -r iw ih < <("$FP" -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$f" | head -1 | tr ',' ' ')
  orient=$([ "${ih:-0}" -gt "${iw:-0}" ] && echo vertical || echo horizontal)
  case "${base,,}" in
    *.jpg|*.jpeg|*.png|*.webp|*.heic)
      "$FF" -y -loglevel error -i "$f" -vf "$scale" -frames:v 1 -q:v 2 "$OUT/$id.jpg"
      cp "$OUT/$id.jpg" "$SHEET/$id.jpg"
      printf '%-34s foto        %s\n' "broll/$id.jpg" "$orient" ;;
    *)
      "$FF" -y -loglevel error -i "$f" -an -vf "$scale,fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 20 -movflags +faststart "$OUT/$id.mp4"
      dur=$("$FP" -v error -show_entries format=duration -of csv=p=0 "$OUT/$id.mp4")
      mid=$("$PY" -I -c "import sys;print(float(sys.argv[1])/2)" "$dur")
      "$FF" -y -loglevel error -ss "$mid" -i "$OUT/$id.mp4" -frames:v 1 -vf "scale=480:-2" "$SHEET/$id.jpg"
      printf '%-34s %6.1fs     %s\n' "broll/$id.mp4" "$dur" "$orient" ;;
  esac
done
# Folha de contato numerada (sequência temporária: o ffmpeg do Windows não aceita glob)
TMP=$(mktemp -d); k=0
for img in "$SHEET"/[0-9]*.jpg; do k=$((k + 1)); cp "$img" "$TMP/$(printf 'img_%03d.jpg' "$k")"; done
"$FF" -y -loglevel error -i "$TMP/img_%03d.jpg" \
  -vf "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2,drawtext=text='%{eif\:n+1\:d}':x=10:y=10:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.6,tile=4x0:padding=4" \
  -frames:v 1 "$SHEET/sheet.jpg" 2>/dev/null || \
"$FF" -y -loglevel error -i "$TMP/img_%03d.jpg" \
  -vf "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2,tile=4x6:padding=4" -frames:v 1 "$SHEET/sheet.jpg"
rm -rf "$TMP"
echo "folha de contato: $SHEET/sheet.jpg"
