#!/usr/bin/env bash
# Resolves the tools the scripts need on Linux, macOS and Windows (Git Bash, which Claude Code uses on Windows).
# Sourced by the other .sh scripts. Override with VM_HOME, VM_FFMPEG or VM_FFPROBE if needed.
VM_HOME="${VM_HOME:-$HOME/.local/share/video-motion}"
if [ -x "$VM_HOME/venv/bin/python" ]; then PY="$VM_HOME/venv/bin/python"
elif [ -x "$VM_HOME/venv/Scripts/python.exe" ]; then PY="$VM_HOME/venv/Scripts/python.exe"
else echo "Ambiente Python da skill não encontrado em $VM_HOME/venv. Rode o instalador do repositório." >&2; exit 1; fi
FF="${VM_FFMPEG:-$(command -v ffmpeg || true)}"
[ -z "$FF" ] && [ -x "$HOME/.local/bin/ffmpeg" ] && FF="$HOME/.local/bin/ffmpeg"
[ -z "$FF" ] && FF="$("$PY" -I -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null || true)"
[ -z "$FF" ] && { echo "ffmpeg não encontrado. Rode o instalador do repositório." >&2; exit 1; }
FP="${VM_FFPROBE:-$(command -v ffprobe || true)}"
export VM_FFMPEG="$FF" VM_FFPROBE="$FP"
need_ffprobe() { [ -n "$FP" ] || { echo "Este comando precisa do ffprobe (vem com o ffmpeg completo: apt install ffmpeg, brew install ffmpeg ou winget install Gyan.FFmpeg)." >&2; exit 1; }; }
