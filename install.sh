#!/usr/bin/env bash
# Instalador para Linux e macOS. No Windows, use install.ps1.
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
VM_HOME="${VM_HOME:-$HOME/.local/share/video-motion}"
VOICE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium"

say() { printf '\n== %s\n' "$1"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "Falta $1. $2"; exit 1; }; }

say "Conferindo requisitos"
need python3 "Instale o Python 3.10 ou mais novo."
need node "Instale o Node.js 18 ou mais novo (https://nodejs.org)."
need npm "Ele vem com o Node.js."
node -e 'process.exit(parseInt(process.versions.node) >= 18 ? 0 : 1)' || { echo "Node.js 18 ou mais novo é necessário."; exit 1; }

say "Ambiente Python (Whisper, voz Piper, ffmpeg portátil)"
[ -x "$VM_HOME/venv/bin/python" ] || python3 -m venv "$VM_HOME/venv"
"$VM_HOME/venv/bin/pip" install -q --upgrade pip
"$VM_HOME/venv/bin/pip" install -q faster-whisper imageio-ffmpeg piper-tts numpy

say "Voz pt-BR (Piper, ~63 MB)"
mkdir -p "$VM_HOME/voices"
for f in pt_BR-faber-medium.onnx pt_BR-faber-medium.onnx.json; do
  [ -s "$VM_HOME/voices/$f" ] || curl -fsSL -o "$VM_HOME/voices/$f" "$VOICE_URL/$f"
done

say "ffmpeg"
if command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg do sistema: $(command -v ffmpeg)"
else
  mkdir -p "$HOME/.local/bin"
  ln -sf "$("$VM_HOME/venv/bin/python" -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')" "$HOME/.local/bin/ffmpeg"
  echo "ffmpeg portátil ligado em ~/.local/bin/ffmpeg"
fi
command -v ffprobe >/dev/null 2>&1 || echo "Aviso: sem ffprobe. Os comandos broll e vertical precisam dele (apt install ffmpeg ou brew install ffmpeg)."

say "Ligando a skill ao Claude Code"
mkdir -p "$HOME/.claude/skills"
DEST="$HOME/.claude/skills/video-motion"
if [ -e "$DEST" ] && [ ! -L "$DEST" ]; then mv "$DEST" "$DEST.bak-$(date +%Y%m%d%H%M%S)"; echo "Skill antiga guardada como backup."; fi
ln -sfn "$REPO/skills/video-motion" "$DEST"
chmod +x "$REPO"/skills/video-motion/scripts/*.sh
echo "Skill ligada: $DEST -> $REPO/skills/video-motion"

say "Pronto. Abra o Claude Code e peça, por exemplo: \"edita esse vídeo com animações\"."
