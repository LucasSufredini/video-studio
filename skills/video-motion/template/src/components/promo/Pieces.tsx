import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {mono} from '../../theme';
import {display, italic, promo, usePortrait, useRise, useU} from './kit';

/** Scene background. `soft` drifts slowly, `lime` is the loud brand moment, `ink` is the dark option. */
export const Backdrop: React.FC<{variant?: 'soft' | 'lime' | 'ink'}> = ({variant = 'soft'}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 6;
  if (variant === 'lime') {
    return <AbsoluteFill style={{background: `radial-gradient(circle at ${40 + drift}% 45%, ${promo.lime}, ${promo.limeDeep})`}} />;
  }
  if (variant === 'ink') {
    return <AbsoluteFill style={{background: `radial-gradient(circle at ${30 + drift}% 30%, #34304a, ${promo.ink})`}} />;
  }
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at ${15 + drift}% 15%, ${promo.lilac}, transparent 55%),
        radial-gradient(circle at ${88 - drift}% 88%, ${promo.peach}, transparent 55%), ${promo.paper}`,
    }} />
  );
};

/** Text on one side, visual on the other. Stacks vertically in 9:16. */
export const Split: React.FC<{left: React.ReactNode; right?: React.ReactNode; gap?: number}> = ({left, right, gap = 4}) => {
  const u = useU();
  const portrait = usePortrait();
  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center',
      gap: gap * u, padding: `${portrait ? 8 * u : 4 * u}px ${portrait ? 5 * u : 8 * u}px`,
    }}>
      <div style={{flex: portrait ? '0 0 auto' : 1, width: portrait ? '100%' : undefined}}>{left}</div>
      {right && <div style={{flex: '0 0 auto', display: 'flex', justifyContent: 'center'}}>{right}</div>}
    </AbsoluteFill>
  );
};

export const Center: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>{children}</AbsoluteFill>
);

/** 3D sticker from public/stickers: pops in, then floats. The PNGs are 256 px, so keep size at or below 18u in 1080p. */
export const Sticker: React.FC<{name: string; size?: number; delay?: number; x?: number; y?: number; tilt?: number}> = ({
  name, size = 16, delay = 4, x = 0, y = 0, tilt = -6,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useU();
  const p = spring({frame: frame - delay, fps, config: {damping: 9, stiffness: 130}});
  const bob = Math.sin((frame - delay) / 11) * 0.55 * u;
  const sway = Math.sin((frame - delay) / 17) * 3;
  return (
    <Img src={staticFile(`stickers/${name}.png`)} style={{
      width: size * u, height: size * u, objectFit: 'contain', opacity: Math.min(1, p * 2),
      transform: `translate(${x * u}px, ${y * u + bob}px) rotate(${tilt + sway}deg) scale(${p})`,
      filter: `drop-shadow(0 ${1.2 * u}px ${1.4 * u}px rgba(40,25,70,.22))`,
    }} />
  );
};

/** Big number that counts up. */
export const Count: React.FC<{
  to: number; from?: number; prefix?: string; suffix?: string; size?: number; delay?: number; frames?: number;
  locale?: string; decimals?: number; color?: string;
}> = ({to, from = 0, prefix = '', suffix = '', size = 11, delay = 4, frames = 26, locale = 'en-US', decimals = 0, color = promo.ink}) => {
  const frame = useCurrentFrame();
  const u = useU();
  const t = interpolate(frame, [delay, delay + frames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
  const shown = (from + (to - from) * t).toLocaleString(locale, {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  const moving = t > 0 && t < 1;
  return (
    <div style={{
      fontFamily: display, fontWeight: 800, fontSize: size * u, letterSpacing: '-0.04em', lineHeight: 1.05, color,
      fontVariantNumeric: 'tabular-nums', opacity: t > 0 ? 1 : 0, filter: moving ? `blur(${(1 - t) * 3}px)` : undefined,
    }}>{prefix}{shown}{suffix}</div>
  );
};

/** One chat message card. */
export const Chat: React.FC<{name: string; message: string; time?: string; color?: string; delay?: number; width?: number}> = ({
  name, message, time, color = promo.red, delay = 6, width = 29,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useU();
  const p = spring({frame: frame - delay, fps, config: {damping: 13}});
  return (
    <div style={{width: width * u, fontFamily: display, opacity: p, transform: `translateY(${(1 - p) * 3 * u}px) scale(${0.9 + p * 0.1})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 0.8 * u, marginBottom: 0.8 * u}}>
        <div style={{width: 2.6 * u, height: 2.6 * u, borderRadius: '50%', background: color, color: promo.white, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 1.2 * u}}>{name[0]}</div>
        <div style={{fontWeight: 700, fontSize: 1.3 * u, color: promo.ink}}>{name}</div>
      </div>
      <div style={{background: promo.white, borderRadius: 1.6 * u, padding: `${1.4 * u}px ${1.8 * u}px`, boxShadow: `0 ${1.2 * u}px ${3 * u}px rgba(50,30,90,.14)`}}>
        <div style={{fontWeight: 500, fontSize: 2.8 * u, lineHeight: 1.25, color: promo.ink}}>{message}</div>
        {time && <div style={{textAlign: 'right', color: promo.muted, fontSize: 1 * u, marginTop: 0.4 * u}}>{time}</div>}
      </div>
    </div>
  );
};

/** Paper receipt that slides down, row by row. */
export const Receipt: React.FC<{title: string; rows: [string, string][]; totalLabel: string; total: string; delay?: number; width?: number}> = ({
  title, rows, totalLabel, total, delay = 6, width = 23,
}) => {
  const u = useU();
  const p = useRise(delay, 16);
  return (
    <div style={{
      width: width * u, background: promo.white, padding: 2 * u, fontFamily: mono, color: promo.ink,
      transform: `translateY(${(1 - p) * -22 * u}px)`, opacity: Math.min(1, p * 3), boxShadow: `0 ${1.5 * u}px ${4 * u}px rgba(0,0,0,.16)`,
    }}>
      <div style={{fontSize: 1.2 * u, fontWeight: 700, letterSpacing: 1, marginBottom: 1.4 * u}}>{title}</div>
      {rows.map(([k, v]) => (
        <div key={k} style={{display: 'flex', justifyContent: 'space-between', fontSize: 1.15 * u, padding: `${0.4 * u}px 0`}}>
          <span style={{color: promo.muted}}>{k}</span><span>{v}</span>
        </div>
      ))}
      <div style={{borderTop: `2px dashed ${promo.muted}`, marginTop: 1 * u, paddingTop: 1 * u, display: 'flex', justifyContent: 'space-between', fontSize: 1.5 * u, fontWeight: 700}}>
        <span>{totalLabel}</span><span>{total}</span>
      </div>
    </div>
  );
};

export type PhoneRow = {name: string; sub?: string; value: string; color?: string};

/** Phone mockup with a hero value, a list that fills in and a call-to-action button. */
export const Phone: React.FC<{
  app: string; heroLabel?: string; hero: string; rows: PhoneRow[]; button?: string; delay?: number; rowEvery?: number;
}> = ({app, heroLabel, hero, rows, button, delay = 2, rowEvery = 7}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useU();
  const p = spring({frame: frame - delay, fps, config: {damping: 15}});
  return (
    <div style={{
      width: 24 * u, height: 47 * u, boxSizing: 'border-box', background: promo.white, border: `${0.45 * u}px solid ${promo.ink}`, borderRadius: 4 * u,
      padding: 1.8 * u, fontFamily: display, color: promo.ink, display: 'flex', flexDirection: 'column',
      transform: `translateY(${(1 - p) * 40 * u}px)`, boxShadow: `0 ${2 * u}px ${5 * u}px rgba(50,30,90,.25)`,
    }}>
      <div style={{fontWeight: 800, fontSize: 1.7 * u, marginBottom: 1.2 * u}}>{app}</div>
      <div style={{background: promo.lime, borderRadius: 1.4 * u, padding: 1.4 * u, marginBottom: 1.2 * u}}>
        {heroLabel && <div style={{fontSize: 1.05 * u, fontWeight: 700}}>{heroLabel}</div>}
        <div style={{fontSize: 3.6 * u, fontWeight: 800, letterSpacing: '-0.03em'}}>{hero}</div>
      </div>
      <div style={{flex: 1}}>
        {rows.map((r, i) => {
          const rp = interpolate(frame, [delay + 12 + i * rowEvery, delay + 20 + i * rowEvery], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={r.name} style={{display: 'flex', alignItems: 'center', gap: 1 * u, padding: `${0.8 * u}px 0`, opacity: rp, transform: `translateX(${(1 - rp) * 2 * u}px)`}}>
              <div style={{width: 3 * u, height: 3 * u, borderRadius: '50%', background: r.color ?? promo.red, color: promo.white, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 1.3 * u}}>{r.name[0]}</div>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 700, fontSize: 1.45 * u}}>{r.name}</div>
                {r.sub && <div style={{fontSize: 1.05 * u, color: promo.muted}}>{r.sub}</div>}
              </div>
              <div style={{fontWeight: 700, fontSize: 1.45 * u}}>{r.value}</div>
            </div>
          );
        })}
      </div>
      {button && <div style={{background: promo.ink, color: promo.lime, borderRadius: 3 * u, textAlign: 'center', fontWeight: 800, fontSize: 1.4 * u, padding: 1.1 * u}}>{button}</div>}
    </div>
  );
};

/** Brand reveal: optional sticker plus wordmark. */
export const Logo: React.FC<{name: string; sticker?: string; size?: number; delay?: number; tagline?: string; color?: string}> = ({
  name, sticker, size = 8, delay = 3, tagline, color = promo.ink,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useU();
  const p = spring({frame: frame - delay, fps, config: {damping: 12}});
  const tag = useRise(delay + 12, 12);
  return (
    <div style={{textAlign: 'center', fontFamily: display, color}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 * u, opacity: Math.min(1, p * 2), transform: `scale(${0.75 + p * 0.25})`, filter: `blur(${(1 - Math.min(1, p)) * 10}px)`}}>
        {sticker && <Sticker name={sticker} size={size * 1.5} delay={delay + 4} />}
        <div style={{fontSize: size * u, fontWeight: 800, letterSpacing: '-0.04em'}}>{name}</div>
      </div>
      {tagline && <div style={{fontFamily: italic, fontStyle: 'italic', fontSize: size * 0.42 * u, marginTop: 0.6 * u, opacity: tag, transform: `translateY(${(1 - tag) * u}px)`}}>{tagline}</div>}
    </div>
  );
};

/** A dot that grows until it covers the frame. Put it over a scene to hand over to the next one. */
export const DotReveal: React.FC<{delay?: number; frames?: number; color?: string}> = ({delay = 18, frames = 14, color = promo.lime}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const appear = interpolate(frame, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const grow = interpolate(frame, [delay, delay + frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const base = Math.max(width, height) * 0.05;
  const full = (Math.hypot(width, height) / base) * 1.1;
  return (
    <AbsoluteFill style={{display: 'grid', placeItems: 'center'}}>
      <div style={{width: base, height: base, borderRadius: '50%', background: color, transform: `scale(${appear * (1 + grow * full)})`}} />
    </AbsoluteFill>
  );
};

/** Copies of a card fanning out behind the original. */
export const Stack: React.FC<{children: React.ReactNode; copies?: number; delay?: number}> = ({children, copies = 3, delay = 10}) => {
  const u = useU();
  const p = useRise(delay, 16);
  return (
    <div style={{position: 'relative'}}>
      {Array.from({length: copies}).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0, opacity: 0.55 - i * 0.14,
          transform: `translate(${p * (i + 1) * 1.4 * u}px, ${-p * (i + 1) * 2 * u}px) rotate(${p * (i + 1) * 2.4}deg)`,
        }}>{children}</div>
      ))}
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

/** Pill call to action with a slow pulse. */
export const CTA: React.FC<{label: string; delay?: number; size?: number; background?: string; color?: string}> = ({
  label, delay = 16, size = 3, background = promo.ink, color = promo.lime,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useU();
  const p = spring({frame: frame - delay, fps, config: {damping: 11}});
  const pulse = 1 + Math.max(0, Math.sin((frame - delay) / 9)) * 0.025;
  return (
    <div style={{
      background, color, fontFamily: display, fontWeight: 800, fontSize: size * u, borderRadius: 5 * u,
      padding: `${size * 0.42 * u}px ${size * 1.1 * u}px`, opacity: Math.min(1, p * 2), transform: `scale(${p * pulse})`, display: 'inline-block',
    }}>{label}</div>
  );
};
