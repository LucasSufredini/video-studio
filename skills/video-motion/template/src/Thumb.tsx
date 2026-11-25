import {AbsoluteFill, Img, staticFile} from 'remotion';
import {display} from './components/promo/kit';
import {thumb} from './thumb-config';

/** Still thumbnail: photo, darkened side and up to 3 heavy words with a strong outline. */
export const Thumb: React.FC = () => {
  const t = thumb;
  const left = t.side === 'left';
  const fs = 720 * t.size;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 70% 40%, #3a3550, #0f0e14)', overflow: 'hidden'}}>
      {t.photo && (
        <Img src={staticFile(t.photo)} style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${t.x}% ${t.y}%`,
          transform: `scale(${t.zoom})`, transformOrigin: `${t.x}% ${t.y}%`,
        }} />
      )}
      <AbsoluteFill style={{
        background: `linear-gradient(${left ? 90 : 270}deg, rgba(0,0,0,${t.darken}) 0%, rgba(0,0,0,${t.darken * 0.6}) 38%, transparent 62%)`,
      }} />
      <AbsoluteFill style={{
        justifyContent: 'center', alignItems: left ? 'flex-start' : 'flex-end', padding: '0 70px',
        fontFamily: display, fontWeight: 800, fontSize: fs, lineHeight: 0.92, letterSpacing: '-0.035em', textTransform: 'uppercase',
      }}>
        {t.words.slice(0, 3).map((w, i) => (
          <div key={i} style={{
            color: i === t.accent ? t.accentColor : t.color,
            WebkitTextStroke: `${fs * 0.035}px rgba(0,0,0,.85)`, paintOrder: 'stroke fill',
            textShadow: `0 ${fs * 0.04}px ${fs * 0.12}px rgba(0,0,0,.6)`,
          }}>{w}</div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
