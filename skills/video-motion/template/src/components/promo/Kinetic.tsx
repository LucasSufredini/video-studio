import React from 'react';
import {display, italic, promo, useRise, useU} from './kit';

type Part = {text: string; kind: 'plain' | 'italic' | 'mark'; tail: string};

const parse = (line: string): Part[] => {
  const out: Part[] = [];
  for (const m of line.matchAll(/\*([^*]+)\*(\S*)|==([^=]+)==(\S*)|(\S+)/g)) {
    if (m[1] !== undefined) out.push({text: m[1], kind: 'italic', tail: m[2]});
    else if (m[3] !== undefined) out.push({text: m[3], kind: 'mark', tail: m[4]});
    else out.push({text: m[5], kind: 'plain', tail: ''});
  }
  return out;
};

const Piece: React.FC<{part: Part; delay: number; color: string; markColor: string}> = ({part, delay, color, markColor}) => {
  const p = useRise(delay, 10);
  const bar = useRise(delay + 7, 8);
  return (
    <span style={{
      display: 'inline-block', position: 'relative', marginRight: '0.26em', color,
      opacity: p, transform: `translateY(${(1 - p) * 0.45}em)`, filter: `blur(${(1 - p) * 9}px)`,
    }}>
      {part.kind === 'mark' && (
        <span style={{
          position: 'absolute', left: '-0.08em', right: '-0.08em', top: '0.1em', bottom: '0.06em',
          background: markColor, borderRadius: '0.1em', transformOrigin: 'left', transform: `scaleX(${bar})`,
        }} />
      )}
      <span style={{
        position: 'relative',
        fontFamily: part.kind === 'italic' ? italic : display,
        fontStyle: part.kind === 'italic' ? 'italic' : 'normal',
        fontWeight: part.kind === 'italic' ? 400 : 800,
      }}>{part.text}</span>
      <span style={{position: 'relative', fontWeight: 800}}>{part.tail}</span>
    </span>
  );
};

/**
 * Text that arrives word by word. In `lines`, write *word* for serif italic and ==word== for a marker highlight.
 * `sizes` optionally sets each line's size in u; a line can be dimmed with `dim` (line indexes).
 */
export const Kinetic: React.FC<{
  lines: string[];
  size?: number;
  sizes?: number[];
  dim?: number[];
  delay?: number;
  stagger?: number;
  color?: string;
  markColor?: string;
  align?: 'left' | 'center';
}> = ({lines, size = 6.4, sizes, dim = [], delay = 2, stagger = 4, color = promo.ink, markColor = promo.lime, align = 'left'}) => {
  const u = useU();
  let n = 0;
  return (
    <div style={{fontFamily: display, letterSpacing: '-0.025em', lineHeight: 1.12, textAlign: align}}>
      {lines.map((line, i) => (
        <div key={i} style={{fontSize: (sizes?.[i] ?? size) * u}}>
          {parse(line).map((part, j) => (
            <Piece key={j} part={part} delay={delay + stagger * n++} color={dim.includes(i) ? promo.muted : color} markColor={markColor} />
          ))}
        </div>
      ))}
    </div>
  );
};
