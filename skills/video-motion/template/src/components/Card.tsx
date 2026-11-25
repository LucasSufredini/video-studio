import {useVideoConfig} from 'remotion';
import {usePop} from '../lib';
import {mono, sans, theme} from '../theme';

/** Dark card that springs in. Use several with different `delay` for a stacked look. */
export const Card: React.FC<{label?: string; title: string; subtitle?: string; delay?: number; rotate?: number; x?: number; y?: number}> = ({
  label, title, subtitle, delay = 0, rotate = -4, x = 0, y = 0,
}) => {
  const {width} = useVideoConfig();
  const p = usePop(delay);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', width: width * 0.62,
      transform: `translate(-50%,-50%) translate(${x}px, ${y + (1 - p) * 80}px) rotate(${rotate}deg) scale(${0.8 + 0.2 * p})`,
      opacity: p, background: theme.panel, borderRadius: 18, padding: width * 0.04,
      boxShadow: '0 30px 60px rgba(0,0,0,.35)', border: '1px solid #2c2824',
    }}>
      {label && <div style={{fontFamily: mono, fontSize: width * 0.022, color: theme.accent, letterSpacing: 2, textTransform: 'uppercase'}}>{label}</div>}
      <div style={{fontFamily: sans, fontWeight: 700, fontSize: width * 0.05, color: theme.text, marginTop: 6}}>{title}</div>
      {subtitle && <div style={{fontFamily: sans, fontSize: width * 0.032, color: theme.muted, marginTop: 6}}>{subtitle}</div>}
    </div>
  );
};
