#!/usr/bin/env bash
# Wrapper that runs prepare.py with the skill's Python environment.
source "$(dirname "$0")/env.sh"
exec "$PY" -I "$(dirname "$0")/prepare.py" "$@"
