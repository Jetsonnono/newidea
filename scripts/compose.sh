#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EP="${1:-01}"
DIST="$ROOT/episodes/$EP/dist"
FPS="$(python3 -c 'import json; print(json.load(open("'"$ROOT"'/episodes/'"$EP"'/timeline.json"))["fps"])')"
COUNT="$(find "$DIST/frames" -name '*.jpg' | wc -l | tr -d ' ')"
EXPECT="$(python3 -c 'import json; t=json.load(open("'"$ROOT"'/episodes/'"$EP"'/timeline.json")); print(t["fps"]*t["duration"])')"

if [[ "$COUNT" != "$EXPECT" ]]; then
  echo "expected $EXPECT frames, found $COUNT" >&2
  exit 1
fi

ffmpeg -y -loglevel error -framerate "$FPS" -i "$DIST/frames/%05d.jpg" \
  -c:v libx264 -pix_fmt yuv420p -crf 17 -r "$FPS" -movflags +faststart \
  "$DIST/${EP}-silent.mp4"

ffmpeg -y -loglevel error -i "$DIST/score.wav" \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 \
  "$DIST/score-broadcast.wav"

ffmpeg -y -loglevel error -framerate "$FPS" -i "$DIST/frames/%05d.jpg" -i "$DIST/score-broadcast.wav" \
  -c:v libx264 -pix_fmt yuv420p -crf 17 -r "$FPS" -c:a aac -b:a 192k \
  -shortest -movflags +faststart \
  "$DIST/${EP}.mp4"

ffprobe -v error -show_entries format=duration -show_entries stream=codec_type,width,height,avg_frame_rate,sample_rate -of json "$DIST/${EP}.mp4"
