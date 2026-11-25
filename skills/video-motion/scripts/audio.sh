#!/usr/bin/env bash
# Wrapper that runs audio.py with the skill's Python environment.
source "$(dirname "$0")/env.sh"
exec "$PY" -I "$(dirname "$0")/audio.py" "$@"
