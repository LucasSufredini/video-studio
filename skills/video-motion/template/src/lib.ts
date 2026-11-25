import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import transcript from './data/transcript.json';

export type Word = {word: string; start: number; end: number};
export const words: Word[] = transcript.words;

/** Seconds -> frames for the current composition. */
export const useSec = () => {
  const {fps} = useVideoConfig();
  return (s: number) => Math.round(s * fps);
};

/** Start time (s) of the n-th occurrence of a word in the transcript (case/accents-insensitive). */
export const wordAt = (text: string, occurrence = 1): number => {
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
  const target = norm(text);
  let n = 0;
  for (const w of words) {
    if (norm(w.word) === target && ++n === occurrence) return w.start;
  }
  throw new Error(`Word "${text}" (#${occurrence}) not found in transcript`);
};

/** 0→1 spring that starts at a local frame. */
export const usePop = (delayFrames = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delayFrames, fps, config: {damping}});
};

/** Fade in over the first `inF` frames and out over the last `outF` frames of a Sequence. */
export const useFade = (durationInFrames: number, inF = 8, outF = 8) => {
  const frame = useCurrentFrame();
  const i = Math.min(inF, durationInFrames / 3);
  const o = Math.min(outF, durationInFrames / 3);
  return interpolate(
    frame,
    [0, i, durationInFrames - o, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)},
  );
};
