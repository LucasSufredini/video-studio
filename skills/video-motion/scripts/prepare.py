#!/usr/bin/env python3
"""Prepare a recording for a video-motion project.

Usage: prepare.py <video.mp4> <project_dir> [--model small] [--lang pt] [--frames 6] [--vocab "Claude, ..."]

Writes into the project:
  public/video.mp4           copy of the source video
  src/data/meta.json         duration, width, height, fps
  src/data/transcript.json   word-level timestamps (faster-whisper)
  frames/frame_XX_<t>s.jpg   evenly spaced frames for Claude to look at
  frames/sheet.jpg           contact sheet of those frames
"""
import argparse, json, os, re, shutil, subprocess, sys

FFMPEG = os.environ.get("VM_FFMPEG") or shutil.which("ffmpeg") or os.path.expanduser("~/.local/bin/ffmpeg")


def contact_sheet(images, out, cols, width=360):
    """Tiles images into one sheet. Copies them to a numbered sequence first: glob patterns don't work in ffmpeg on Windows."""
    import tempfile
    images = sorted(images)
    if not images:
        return
    rows = (len(images) + cols - 1) // cols
    with tempfile.TemporaryDirectory() as tmp:
        for i, src in enumerate(images):
            shutil.copy(src, os.path.join(tmp, f"img_{i:03d}.jpg"))
        subprocess.run([FFMPEG, "-y", "-v", "error", "-i", os.path.join(tmp, "img_%03d.jpg"),
                        "-vf", f"scale={width}:-2,tile={cols}x{rows}", "-frames:v", "1", out], check=True)


def probe(path):
    err = subprocess.run([FFMPEG, "-hide_banner", "-i", path], capture_output=True, text=True).stderr
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    v = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", err)
    f = re.search(r"([\d.]+) fps", err)
    rot = re.search(r"rotation of (-?[\d.]+)", err) or re.search(r"rotate\s*:\s*(-?\d+)", err)
    if not (d and v):
        sys.exit(f"Could not read video info from {path}")
    w, h = int(v.group(1)), int(v.group(2))
    if rot and abs(float(rot.group(1))) % 180 == 90:
        w, h = h, w
    dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3))
    return {"duration": round(dur, 3), "width": w, "height": h, "fps": float(f.group(1)) if f else 30.0}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("project")
    ap.add_argument("--model", default="small", help="tiny|base|small|medium|large-v3 (bigger = better, slower)")
    ap.add_argument("--lang", default="pt")
    ap.add_argument("--frames", type=int, default=6)
    ap.add_argument("--vocab", default="Claude, Claude Code, Remotion, Whisper, prompt, frames",
                    help="names/terms Whisper should spell right")
    a = ap.parse_args()

    proj = os.path.abspath(a.project)
    # A new recording invalidates any earlier autocut snapshot and word indexes.
    shutil.rmtree(os.path.join(proj, "source"), ignore_errors=True)
    if os.path.exists(os.path.join(proj, "cuts.json")):
        os.remove(os.path.join(proj, "cuts.json"))
    for sub in ("public", "src/data", "frames"):
        os.makedirs(os.path.join(proj, sub), exist_ok=True)

    meta = probe(a.video)
    # Re-encode to a clean H.264/AAC file so Remotion seeks reliably.
    dst = os.path.join(proj, "public", "video.mp4")
    print("· copiando vídeo…", flush=True)
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", a.video, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst], check=True)
    meta["video"] = "video.mp4"
    json.dump(meta, open(os.path.join(proj, "src/data/meta.json"), "w"), indent=2)
    print(f"· meta: {meta}", flush=True)

    # Frames
    fdir = os.path.join(proj, "frames")
    for old in os.listdir(fdir):
        os.remove(os.path.join(fdir, old))
    n = max(1, a.frames)
    for i in range(n):
        t = meta["duration"] * (i + 0.5) / n
        subprocess.run([FFMPEG, "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", a.video, "-frames:v", "1",
                        "-vf", "scale=540:-2", os.path.join(fdir, f"frame_{i+1:02d}_{t:05.1f}s.jpg")], check=True)
    cols = min(n, 3)
    rows = (n + cols - 1) // cols
    contact_sheet([os.path.join(fdir, f) for f in os.listdir(fdir) if f.startswith("frame_")], os.path.join(fdir, "sheet.jpg"), cols)
    print(f"· {n} frames em {fdir}", flush=True)

    # Transcription with word timestamps
    print(f"· transcrevendo com Whisper ({a.model})… pode levar alguns minutos na CPU", flush=True)
    import numpy as np
    from faster_whisper import WhisperModel
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", a.video, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio, language=a.lang, word_timestamps=True, vad_filter=True,
                                      initial_prompt=a.vocab)
    words, segs = [], []
    for s in segments:
        segs.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
        for w in s.words or []:
            words.append({"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)})
        print(f"  [{s.start:6.2f}] {s.text.strip()}", flush=True)
    json.dump({"language": info.language, "segments": segs, "words": words},
              open(os.path.join(proj, "src/data/transcript.json"), "w"), ensure_ascii=False, indent=1)
    print(f"· {len(words)} palavras → src/data/transcript.json")


if __name__ == "__main__":
    main()
