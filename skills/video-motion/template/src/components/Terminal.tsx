import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {mono, theme} from '../theme';

export type Line = {at: number; text: string; kind?: 'prompt' | 'tool' | 'out' | 'ok'};

/**
 * Fake terminal panel. Each line appears at `at` seconds (relative to the Sequence start);
 * prompts are typed out character by character.
 */
export const Terminal: React.FC<{title?: string; lines: Line[]; size?: number}> = ({title = 'claude', lines, size = 0.03}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const fs = width * size;
  const color = {prompt: theme.ink, tool: theme.text, out: theme.muted, ok: theme.green};
  return (
    <AbsoluteFill style={{background: theme.bg, padding: width * 0.05, justifyContent: 'center'}}>
      <div style={{background: theme.panel, borderRadius: 16, padding: width * 0.04, border: '1px solid #2c2824', minHeight: '55%'}}>
        <div style={{display: 'flex', gap: 8, alignItems: 'center', marginBottom: fs}}>
          {['#e06c5a', '#e5b94e', '#7fc8a9'].map((c) => <div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c}} />)}
          <span style={{fontFamily: mono, color: theme.muted, fontSize: fs * 0.8, marginLeft: 10}}>{title}</span>
        </div>
        {lines.filter((l) => t >= l.at).map((l, i) => {
          const kind = l.kind ?? 'out';
          const chars = kind === 'prompt' ? Math.floor((t - l.at) * 28) : l.text.length;
          const op = interpolate(t - l.at, [0, 0.15], [0, 1], {extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{fontFamily: mono, fontSize: fs, color: color[kind], opacity: op, margin: `${fs * 0.35}px 0`,
              ...(kind === 'prompt' ? {background: theme.paper, display: 'table', padding: '2px 10px', borderRadius: 4} : {})}}>
              {kind === 'prompt' ? '❯ ' : kind === 'tool' ? '● ' : '  '}
              {l.text.slice(0, chars)}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
