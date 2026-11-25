#!/usr/bin/env python3
"""Clean the voice and set the volume of a video-motion project for Reels/Shorts.

Usage:
  audio.py <project_dir>              treat public/video.mp4
  audio.py <project_dir> --restore    go back to the untreated audio

Chain: rumble filter, mild noise reduction, compression, then two-pass loudness
normalization (default -14 LUFS, peaks under -1.5 dBTP). The picture is not re-encoded.
Run it after autocut. Running it again starts from the untreated audio, so it never stacks.
"""
import argparse, json, os, re, shutil, subprocess, sys

FFMPEG = os.environ.get("VM_FFMPEG") or shutil.which("ffmpeg") or os.path.expanduser("~/.local/bin/ffmpeg")


def voice_chain(denoise, compress):
    steps = ["highpass=f=80"]
    if denoise > 0:
        steps.append(f"afftdn=nr={denoise}:nf=-35")
    if compress:
        steps.append("acompressor=threshold=-20dB:ratio=3:attack=10:release=150:makeup=2")
    return ",".join(steps)


def measure(src, chain, lufs, peak, lra):
    target = f"loudnorm=I={lufs}:TP={peak}:LRA={lra}:print_format=json"
    result = subprocess.run(
        [FFMPEG, "-hide_banner", "-nostats", "-i", src, "-map", "0:a:0", "-af", f"{chain},{target}", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    found = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", result.stderr)
    if result.returncode != 0 or not found:
        tail = result.stderr.strip().splitlines()[-1:] or ["sem detalhes"]
        sys.exit(f"Não consegui medir o áudio: {tail[0]}")
    stats = json.loads(found.group(0))
    if any(not re.fullmatch(r"[+-]?[\d.]+", stats[k].strip()) for k in
           ("input_i", "input_tp", "input_lra", "input_thresh", "target_offset")):
        sys.exit("Não há áudio suficiente para medir (trecho muito curto ou em silêncio).")
    return stats


def treat(src, dst, chain, lufs, peak, lra, stats):
    target = (
        f"loudnorm=I={lufs}:TP={peak}:LRA={lra}:linear=true"
        f":measured_I={stats['input_i']}:measured_TP={stats['input_tp']}"
        f":measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}"
        f":offset={stats['target_offset']}"
    )
    subprocess.run(
        [FFMPEG, "-y", "-v", "error", "-i", src, "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy",
         "-af", f"{chain},{target},aresample=48000", "-c:a", "aac", "-b:a", "192k",
         "-movflags", "+faststart", dst],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("--restore", action="store_true", help="return to the untreated audio")
    ap.add_argument("--lufs", type=float, default=-14.0, help="target loudness")
    ap.add_argument("--peak", type=float, default=-1.5, help="maximum true peak in dBTP")
    ap.add_argument("--lra", type=float, default=7.0, help="target loudness range")
    ap.add_argument("--denoise", type=float, default=10.0, help="noise reduction in dB; 0 turns it off")
    ap.add_argument("--no-compress", action="store_true", help="skip the compressor")
    a = ap.parse_args()

    root = os.path.abspath(a.project)
    video = os.path.join(root, "public", "video.mp4")
    untreated = os.path.join(root, "source", "video.pre-audio.mp4")
    if not os.path.exists(video):
        sys.exit(f"Arquivo não encontrado: {video}. Rode prepare.sh antes.")

    if a.restore:
        if not os.path.exists(untreated):
            sys.exit("O áudio deste vídeo ainda não foi tratado.")
        os.replace(untreated, video)
        print("· áudio original restaurado")
        return

    chain = voice_chain(a.denoise, not a.no_compress)
    created = not os.path.exists(untreated)
    if created:
        os.makedirs(os.path.dirname(untreated), exist_ok=True)
        shutil.copy2(video, untreated)
    temp = video + ".audio.mp4"
    try:
        stats = measure(untreated, chain, a.lufs, a.peak, a.lra)
        treat(untreated, temp, chain, a.lufs, a.peak, a.lra, stats)
        os.replace(temp, video)
    except BaseException:
        if created and os.path.exists(untreated):
            os.remove(untreated)
        raise
    finally:
        if os.path.exists(temp):
            os.remove(temp)
    print(f"· áudio tratado: entrada {float(stats['input_i']):.1f} LUFS → alvo {a.lufs:.1f} LUFS")


if __name__ == "__main__":
    main()
