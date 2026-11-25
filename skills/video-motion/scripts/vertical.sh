#!/usr/bin/env bash
# Usage: vertical.sh <input> <output.mp4> [--start S] [--end E] [--x 0.5]
# Cuts a stretch of a horizontal video and crops it to 1080x1920 for Shorts/Reels, keeping the audio.
# --x is where the crop sits horizontally: 0 = left edge, 0.5 = centre, 1 = right edge.
set -euo pipefail
[ $# -ge 2 ] || { echo "uso: vertical.sh <entrada> <saida.mp4> [--start S] [--end E] [--x 0.5]"; exit 2; }
IN="$1"; OUT="$2"; shift 2
START=0; END=""; X=0.5
while [ $# -gt 0 ]; do
  case "$1" in
    --start) START="$2"; shift 2 ;;
    --end) END="$2"; shift 2 ;;
    --x) X="$2"; shift 2 ;;
    *) echo "opção desconhecida: $1"; exit 2 ;;
  esac
done
source "$(dirname "$0")/env.sh"
mkdir -p "$(dirname "$OUT")"
args=(-ss "$START")
[ -n "$END" ] && args+=(-to "$END")
"$FF" -y -loglevel error -i "$IN" "${args[@]}" \
  -vf "crop=trunc(ih*9/16/2)*2:ih:(iw-trunc(ih*9/16/2)*2)*${X}:0,scale=1080:1920,fps=30,format=yuv420p" \
  -c:v libx264 -preset veryfast -crf 18 -c:a aac -b:a 192k -movflags +faststart "$OUT"
[ -n "$FP" ] && "$FP" -v error -show_entries stream=width,height:format=duration -of compact=p=0 "$OUT"
