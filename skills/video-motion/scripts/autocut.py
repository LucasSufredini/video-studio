#!/usr/bin/env python3
"""Cut pauses, mistakes and retakes out of a prepared video-motion project.

Usage:
  autocut.py <project_dir> --list       show the transcript with word indexes and pauses
  autocut.py <project_dir> --dry-run    show what would be kept, change nothing
  autocut.py <project_dir>              cut the video and remap the transcript
  autocut.py <project_dir> --restore    go back to the uncut video

Words to remove (mistakes, repeated takes, filler) go in <project_dir>/cuts.json,
using the indexes printed by --list. Ranges are inclusive:
  [{"from": 12, "to": 18, "why": "retake"}]
Pauses longer than --max-pause are cut automatically. cuts.json is optional.

The first cut saves the originals in <project_dir>/source/. Every later run starts
from them, so it is safe to edit cuts.json and run again.
"""
import argparse, json, math, os, re, shutil, subprocess, sys

FFMPEG = os.environ.get("VM_FFMPEG") or shutil.which("ffmpeg") or os.path.expanduser("~/.local/bin/ffmpeg")
FADE = 0.012  # short audio fade on each side of a cut, avoids clicks
MAX_FILTER_CHARS = 120_000  # Linux limits a single argument to 128 KiB


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


def clock(t):
    return f"{int(t // 60):02d}:{t % 60:05.2f}"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


class Project:
    def __init__(self, root):
        self.root = os.path.abspath(root)
        self.video = os.path.join(self.root, "public", "video.mp4")
        self.meta = os.path.join(self.root, "src", "data", "meta.json")
        self.transcript = os.path.join(self.root, "src", "data", "transcript.json")
        self.cuts = os.path.join(self.root, "cuts.json")
        self.source = os.path.join(self.root, "source")
        self.raw_video = os.path.join(self.source, "video.raw.mp4")
        self.raw_meta = os.path.join(self.source, "meta.raw.json")
        self.raw_transcript = os.path.join(self.source, "transcript.raw.json")
        self.frames = os.path.join(self.root, "frames")
        self.pre_audio = os.path.join(self.source, "video.pre-audio.mp4")

    def forget_audio_treatment(self):
        """public/video.mp4 was just rewritten, so audio.py's saved copy no longer matches it."""
        if os.path.exists(self.pre_audio):
            os.remove(self.pre_audio)
            print("· o tratamento de áudio se perdeu com este corte; rode audio.sh de novo")

    def has_snapshot(self):
        return all(os.path.exists(p) for p in (self.raw_video, self.raw_meta, self.raw_transcript))

    def snapshot(self):
        if self.has_snapshot():
            return
        for p in (self.video, self.meta, self.transcript):
            if not os.path.exists(p):
                sys.exit(f"Arquivo não encontrado: {p}. Rode prepare.sh antes.")
        os.makedirs(self.source, exist_ok=True)
        shutil.copy2(self.pre_audio if os.path.exists(self.pre_audio) else self.video, self.raw_video)
        shutil.copy2(self.meta, self.raw_meta)
        shutil.copy2(self.transcript, self.raw_transcript)

    def current_transcript(self):
        path = self.raw_transcript if self.has_snapshot() else self.transcript
        if not os.path.exists(path):
            sys.exit(f"Arquivo não encontrado: {path}. Rode prepare.sh antes.")
        return load(path)


def removed_indexes(project, total):
    if not os.path.exists(project.cuts):
        return set()
    entries = load(project.cuts)
    if not isinstance(entries, list):
        sys.exit("cuts.json precisa ser uma lista de {from, to, why}.")
    removed = set()
    for e in entries:
        a, b = e.get("from"), e.get("to", e.get("from"))
        if not isinstance(a, int) or not isinstance(b, int) or not 0 <= a <= b < total:
            sys.exit(f"Intervalo inválido em cuts.json: {e} (palavras vão de 0 a {total - 1})")
        removed.update(range(a, b + 1))
    return removed


def find_silences(video, shortest=0.25):
    """Silent stretches of the recording, with a threshold fitted to its noise and voice levels."""
    import numpy as np

    raw = subprocess.run([FFMPEG, "-v", "error", "-i", video, "-map", "0:a:0", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    samples = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = 320  # 20 ms
    count = len(samples) // hop
    if count == 0:
        return []
    levels = 20 * np.log10(np.sqrt(np.mean(samples[:count * hop].reshape(count, hop) ** 2, axis=1)) + 1e-6)
    floor, voice = np.percentile(levels, [10, 90])
    if voice - floor < 12:  # no clear gap between noise and voice: do not guess
        return []
    silent = levels < (floor + voice) / 2
    edges = np.flatnonzero(np.diff(np.concatenate(([0], silent.astype(np.int8), [0]))))
    return [(a * 0.02, b * 0.02) for a, b in zip(edges[::2], edges[1::2]) if (b - a) * 0.02 >= shortest]


def tighten_to_speech(words, silences):
    """Whisper often stretches a word over the silence next to it. Trim that silence off."""
    for quiet_start, quiet_end in silences:
        for w in words:
            if w["start"] < quiet_start < w["end"] <= quiet_end + 0.02:
                w["end"] = round(max(w["start"] + 0.05, quiet_start + 0.02), 3)
            elif quiet_start <= w["start"] < quiet_end < w["end"]:
                w["start"] = round(min(w["end"] - 0.05, quiet_end - 0.02), 3)


def print_list(words, gap):
    line, line_start = [], 0.0
    def flush():
        if line:
            print(f"{clock(line_start)}  " + " ".join(line))
    for i, w in enumerate(words):
        pause = w["start"] - words[i - 1]["end"] if i else 0
        if i and (pause > gap or len(line) >= 12):
            flush()
            line = []
            if pause > gap:
                print(f"          ·· pausa {pause:.2f}s")
        if not line:
            line_start = w["start"]
        line.append(f"{i}:{w['word']}")
    flush()


def keep_ranges(words, removed, duration, fps, pad_in, pad_out, max_pause, silences=()):
    """Returns (first_frame, end_frame) pairs, in order, that survive the cut."""
    ranges = []
    previous_kept = None
    for i, w in enumerate(words):
        if i in removed:
            continue
        low = words[i - 1]["end"] if i > 0 and i - 1 in removed else 0.0
        high = words[i + 1]["start"] if i + 1 < len(words) and i + 1 in removed else duration
        start = max(low, w["start"] - pad_in)
        end = min(high, w["end"] + pad_out)
        end = max(end, start + 1 / fps)
        joined = (
            ranges
            and previous_kept == i - 1
            and (w["start"] - words[i - 1]["end"] <= max_pause or start <= ranges[-1][1])
        )
        if joined:
            ranges[-1][1] = max(ranges[-1][1], end)
        else:
            ranges.append([start, end])
        previous_kept = i

    # Pauses Whisper hid inside a "word" are only visible in the audio.
    for quiet_start, quiet_end in silences:
        cut_start, cut_end = quiet_start + pad_out, quiet_end - pad_in
        if quiet_end - quiet_start <= max_pause or cut_end <= cut_start:
            continue
        pieces = []
        for start, end in ranges:
            if cut_end <= start or cut_start >= end:
                pieces.append([start, end])
                continue
            if start < cut_start:
                pieces.append([start, cut_start])
            if end > cut_end:
                pieces.append([cut_end, end])
        ranges = pieces

    frames = []
    last_frame = math.ceil(duration * fps)
    for start, end in ranges:
        a = max(0, math.floor(start * fps))
        b = min(last_frame, math.ceil(end * fps))
        if frames and a <= frames[-1][1]:
            frames[-1][1] = max(frames[-1][1], b)
        elif b - a >= 2:
            frames.append([a, b])
    return frames


def render(src, dst, frames, fps):
    parts, inputs = [], []
    for i, (a, b) in enumerate(frames):
        start, end, n = a / fps, b / fps, b - a
        length = n / fps
        fade_out = max(0.0, length - FADE)
        parts.append(
            f"[0:v]trim=start={start:.6f}:end={end:.6f},setpts=PTS-STARTPTS,fps={fps},"
            f"tpad=stop_mode=clone:stop=2,trim=end_frame={n},setpts=PTS-STARTPTS[v{i}]"
        )
        parts.append(
            f"[0:a]atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS,"
            f"afade=t=in:st=0:d={FADE},afade=t=out:st={fade_out:.6f}:d={FADE}[a{i}]"
        )
        inputs.append(f"[v{i}][a{i}]")
    parts.append("".join(inputs) + f"concat=n={len(frames)}:v=1:a=1[v][a]")
    graph = ";".join(parts)
    if len(graph) > MAX_FILTER_CHARS:
        sys.exit(f"Cortes demais para um único comando ({len(frames)}). Aumente --max-pause.")
    subprocess.run(
        [FFMPEG, "-y", "-v", "error", "-i", src, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst],
        check=True,
    )


def remap(transcript, removed, frames, fps):
    """Moves every surviving word to its time in the cut video."""
    spans, cursor = [], 0.0
    for a, b in frames:
        spans.append((a / fps, b / fps, cursor))
        cursor += (b - a) / fps

    def place(t):
        best = min(spans, key=lambda s: 0 if s[0] <= t <= s[1] else min(abs(t - s[0]), abs(t - s[1])))
        return best[2] + min(max(t, best[0]), best[1]) - best[0]

    new_words, kept_by_index = [], {}
    for i, w in enumerate(transcript["words"]):
        if i in removed:
            continue
        start = place(w["start"])
        end = max(start, place(w["end"]))
        item = {"word": w["word"], "start": round(start, 3), "end": round(end, 3)}
        new_words.append(item)
        kept_by_index[i] = item

    new_segments, i = [], 0
    source_words = transcript["words"]
    for segment in transcript.get("segments", []):
        members = []
        while i < len(source_words) and source_words[i]["start"] <= segment["end"] + 0.05:
            if i in kept_by_index:
                members.append(kept_by_index[i])
            i += 1
        if members:
            new_segments.append({
                "start": members[0]["start"],
                "end": members[-1]["end"],
                "text": " ".join(m["word"] for m in members),
            })
    return {**transcript, "segments": new_segments, "words": new_words}, cursor


def refresh_frames(project, duration, count=6):
    os.makedirs(project.frames, exist_ok=True)
    for old in os.listdir(project.frames):
        os.remove(os.path.join(project.frames, old))
    for i in range(count):
        t = duration * (i + 0.5) / count
        subprocess.run([FFMPEG, "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", project.video, "-frames:v", "1",
                        "-vf", "scale=540:-2", os.path.join(project.frames, f"frame_{i + 1:02d}_{t:05.1f}s.jpg")],
                       check=True)
    contact_sheet([os.path.join(project.frames, f) for f in os.listdir(project.frames) if f.startswith("frame_")],
                  os.path.join(project.frames, "sheet.jpg"), 3)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("--list", action="store_true", help="show words with indexes and pauses")
    ap.add_argument("--dry-run", action="store_true", help="report the cut without changing files")
    ap.add_argument("--restore", action="store_true", help="return to the uncut video")
    ap.add_argument("--max-pause", type=float, default=0.30, help="longest pause left untouched, in seconds")
    ap.add_argument("--pad-in", type=float, default=0.10, help="seconds kept before a word")
    ap.add_argument("--pad-out", type=float, default=0.12, help="seconds kept after a word")
    a = ap.parse_args()
    project = Project(a.project)

    if a.restore:
        if not project.has_snapshot():
            sys.exit("Este projeto ainda não foi cortado.")
        shutil.copy2(project.raw_video, project.video)
        project.forget_audio_treatment()
        shutil.copy2(project.raw_meta, project.meta)
        shutil.copy2(project.raw_transcript, project.transcript)
        refresh_frames(project, load(project.raw_meta)["duration"])
        print("· vídeo original restaurado")
        return

    transcript = project.current_transcript()
    words = transcript["words"]
    if not words:
        sys.exit("A transcrição não tem palavras; não há como cortar.")
    if a.list:
        print_list(words, a.max_pause)
        return

    removed = removed_indexes(project, len(words))
    if len(removed) == len(words):
        sys.exit("cuts.json remove todas as palavras.")
    meta_path = project.raw_meta if project.has_snapshot() else project.meta
    meta = load(meta_path)
    fps = float(meta.get("fps") or 30.0)
    silences = find_silences(project.raw_video if project.has_snapshot() else project.video)
    tighten_to_speech(words, silences)
    frames = keep_ranges(words, removed, meta["duration"], fps, a.pad_in, a.pad_out, a.max_pause, silences)
    if not frames:
        sys.exit("Nenhum trecho sobrou depois do corte.")
    new_duration = sum(b - c for c, b in frames) / fps
    share = new_duration / meta["duration"] * 100
    print(f"· {meta['duration']:.2f}s → {new_duration:.2f}s ({share:.0f}% do original), "
          f"{len(frames)} trechos, {len(removed)} palavras removidas")
    if a.dry_run:
        for c, b in frames:
            print(f"  manter {clock(c / fps)} – {clock(b / fps)}")
        return

    project.snapshot()
    temp = project.video + ".cutting.mp4"
    try:
        render(project.raw_video, temp, frames, fps)
        os.replace(temp, project.video)
        project.forget_audio_treatment()
    finally:
        if os.path.exists(temp):
            os.remove(temp)
    new_transcript, duration = remap(transcript, removed, frames, fps)
    save(project.transcript, new_transcript)
    save(project.meta, {**load(project.raw_meta), "duration": round(duration, 3), "fps": fps, "video": "video.mp4"})
    refresh_frames(project, duration)
    print(f"· pronto: {project.video}")


if __name__ == "__main__":
    main()
