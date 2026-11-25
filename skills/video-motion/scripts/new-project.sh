#!/usr/bin/env bash
# Usage: new-project.sh <project_dir>
# Copies the Remotion template into <project_dir> and installs dependencies.
set -euo pipefail
DIR="$1"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
if [ -e "$DIR/package.json" ]; then echo "Projeto já existe em $DIR"; exit 0; fi
mkdir -p "$DIR"
cp -r "$SKILL/template/." "$DIR/"
cd "$DIR"
npm install --no-audit --no-fund --loglevel=error
echo "Projeto criado em $DIR"
