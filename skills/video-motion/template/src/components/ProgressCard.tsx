import {AbsoluteFill, Easing, Img, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {usePop, useSec} from '../lib';
import {mono, sans, theme} from '../theme';

type Props = {
  title: string;
  label?: string;
  caption?: string;
  /** Percentages, 0–100. The number counts from `from` to `to`. */
  from?: number;
  to: number;
  /** Seconds the count takes. */
  duration?: number;
  /** Local frames to wait before the count starts. */
  delay?: number;
  /** Image file in public/. Only used in the fullscreen variant. */
  image?: string;
  variant?: 'fullscreen' | 'overlay';
  /** Overlay only: where the card sits, away from the face. */
  position?: 'top' | 'bottom';
  segments?: number;
};

const useProgress = (from: number, to: number, duration: number, delay: number) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  return interpolate(frame, [delay, delay + Math.max(1, sec(duration))], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
};

const levelColor = (value: number) =>
  interpolateColors(value, [0, 45, 100], [theme.accent, theme.gold, theme.green]);

const Bar: React.FC<{value: number; segments: number; height: number}> = ({value, segments, height}) => {
  const lit = (value / 100) * segments;
  const color = levelColor(value);
  return (
    <div style={{display: 'flex', gap: height * 0.22, width: '100%'}}>
      {Array.from({length: segments}, (_, i) => {
        const fill = Math.max(0, Math.min(1, lit - i));
        return (
          <div key={i} style={{flex: 1, height, borderRadius: height * 0.18, background: 'rgba(239,233,223,.12)', overflow: 'hidden'}}>
            <div style={{width: `${fill * 100}%`, height: '100%', background: color}} />
          </div>
        );
      })}
    </div>
  );
};

/**
 * "How far along are we?" card: a number counts up while a segmented bar fills and
 * changes colour. Repeat it through a video to turn the talk into a journey.
 */
export const ProgressCard: React.FC<Props> = ({
  title, label, caption, from = 0, to, duration = 1.4, delay = 6, image, variant = 'fullscreen', position = 'bottom', segments = 20,
}) => {
  const {width, height} = useVideoConfig();
  const base = Math.min(width, height);
  const pop = usePop(0, 16);
  const value = useProgress(from, to, duration, delay);
  const color = levelColor(value);
  const percent = `${Math.round(value)}%`;

  if (variant === 'overlay') {
    return (
      <AbsoluteFill>
        <div style={{
          position: 'absolute', left: '8%', right: '8%', [position]: '5%',
          display: 'flex', alignItems: 'center', gap: base * 0.05,
          padding: base * 0.045, borderRadius: base * 0.035,
          background: 'rgba(20,18,16,.92)', border: '1px solid rgba(239,233,223,.14)',
          transform: `translateY(${(1 - pop) * base * (position === 'top' ? -0.12 : 0.12)}px)`, opacity: pop,
        }}>
          <div style={{fontFamily: mono, fontWeight: 700, fontSize: base * 0.13, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums', minWidth: base * 0.32}}>
            {percent}
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontFamily: sans, fontWeight: 800, fontSize: base * 0.05, color: theme.text, marginBottom: base * 0.022}}>{title}</div>
            <Bar value={value} segments={segments} height={base * 0.026} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  const wide = width > height;
  return (
    <AbsoluteFill style={{
      background: theme.bg, alignItems: 'center', justifyContent: 'center',
      flexDirection: wide ? 'row' : 'column', gap: base * 0.07, padding: base * 0.09,
    }}>
      {image && (
        <Img src={staticFile(image)} style={{
          width: wide ? '42%' : '100%', height: wide ? '72%' : '34%', objectFit: 'cover',
          borderRadius: base * 0.03, opacity: pop, transform: `scale(${0.94 + 0.06 * pop})`,
        }} />
      )}
      <div style={{flex: image && wide ? 1 : undefined, width: image && wide ? undefined : '100%', opacity: pop, transform: `translateY(${(1 - pop) * base * 0.05}px)`}}>
        {label && <div style={{fontFamily: mono, fontSize: base * 0.032, color: theme.muted, letterSpacing: 3, textTransform: 'uppercase'}}>{label}</div>}
        <div style={{fontFamily: sans, fontWeight: 800, fontSize: base * 0.082, lineHeight: 1.1, color: theme.text, marginTop: base * 0.015}}>{title}</div>
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: base * 0.3, lineHeight: 1.15, color, fontVariantNumeric: 'tabular-nums', margin: `${base * 0.02}px 0`}}>
          {percent}
        </div>
        <Bar value={value} segments={segments} height={base * 0.05} />
        {caption && <div style={{fontFamily: sans, fontSize: base * 0.042, color: theme.muted, marginTop: base * 0.035}}>{caption}</div>}
      </div>
    </AbsoluteFill>
  );
};
