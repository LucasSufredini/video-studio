import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {words} from '../lib';
import {sans, theme} from '../theme';

type Props = {wordsPerLine?: number; top?: string; hideBetween?: [number, number][]};

/**
 * Word-by-word captions: groups of N words, the word being spoken gets a highlight pill.
 * hideBetween: time ranges (s) where captions are hidden (e.g. during full-screen scenes).
 */
export const Captions: React.FC<Props> = ({wordsPerLine = 3, top = '27%', hideBetween = []}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  if (hideBetween.some(([a, b]) => t >= a && t < b)) return null;

  const groups: (typeof words)[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) groups.push(words.slice(i, i + wordsPerLine));
  const group = groups.find((g, i) => {
    const next = groups[i + 1];
    return t >= g[0].start && t < (next ? next[0].start : g[g.length - 1].end + 0.4);
  });
  if (!group) return null;

  return (
    <AbsoluteFill style={{alignItems: 'center', top}}>
      <div style={{display: 'flex', gap: width * 0.015, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '90%', background: 'rgba(15,13,11,.55)', padding: '0.4em 0.6em', borderRadius: 16}}>
        {group.map((w, i) => {
          const next = group[i + 1];
          const active = t >= w.start && t < (next ? Math.min(next.start, w.end + 0.05) : w.end + 0.05);
          return (
            <span
              key={i}
              style={{
                fontFamily: sans,
                fontWeight: 800,
                fontSize: width * 0.065,
                textTransform: 'uppercase',
                color: active ? theme.ink : 'white',
                background: active ? theme.gold : 'transparent',
                padding: '0 0.18em',
                borderRadius: 6,
                textShadow: active ? 'none' : '0 3px 10px rgba(0,0,0,.7)',
              }}
            >
              {w.word.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
