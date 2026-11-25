import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {usePop} from '../lib';
import {serif, theme} from '../theme';

/** Full-screen giant serif word (e.g. "DETALHES", "GATE") with a drawn circle or stripe. */
export const HeroWord: React.FC<{text: string; bg?: string; color?: string; decoration?: 'circle' | 'stripe' | 'none'}> = ({
  text,
  bg = theme.paper,
  color = theme.ink,
  decoration = 'circle',
}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const pop = usePop(0, 12);
  const draw = interpolate(frame, [6, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const size = width * Math.min(0.2, 1.6 / text.length);
  const r = width * 0.22;
  const circ = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center'}}>
      {decoration === 'circle' && (
        <svg width={r * 2 + 8} height={r * 2 + 8} style={{position: 'absolute'}}>
          <circle cx={r + 4} cy={r + 4} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - draw)} transform={`rotate(-90 ${r + 4} ${r + 4})`} />
        </svg>
      )}
      <div style={{fontFamily: serif, fontWeight: 900, fontSize: size, color, transform: `scale(${0.85 + 0.15 * pop})`, opacity: pop, letterSpacing: '-0.02em'}}>
        {text}
      </div>
      {decoration === 'stripe' && (
        <div style={{position: 'absolute', top: '58%', width: width * 0.8 * draw, height: width * 0.03, borderRadius: 99,
          background: `repeating-linear-gradient(135deg, ${color} 0 14px, transparent 14px 28px)`}} />
      )}
    </AbsoluteFill>
  );
};
