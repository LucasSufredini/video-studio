import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Kinetic} from './components/promo/Kinetic';
import {Center, Chat, Count, CTA, DotReveal, Logo, Phone, Receipt, Split, Stack, Sticker} from './components/promo/Pieces';

export type PromoScene = {name: string; seconds: number; bg?: 'soft' | 'lime' | 'ink'; el: React.ReactNode};

// 1920x1080 for horizontal, 1080x1920 for Reels and Shorts.
export const promoFormat = {width: 1920, height: 1080};

// File in public/ with the voice-over or music, or null for a silent ad.
export const promoAudio: string | null = null;

// Example: a fictional product. Rewrite this list for each ad.
export const promoScenes: PromoScene[] = [
  {
    name: 'hook', seconds: 2.6, bg: 'lime',
    el: <Split
      left={<Kinetic lines={['$14.99', 'for an app you *forgot.*']} sizes={[11, 4.2]} />}
      right={<Receipt title="CARD CHARGED" rows={[['merchant', 'FitStream+'], ['last opened', 'March'], ['plan', 'monthly']]} totalLabel="TOTAL" total="$14.99" />}
    />,
  },
  {
    name: 'promise', seconds: 2.8,
    el: <Split
      left={<Kinetic lines={['you *said:*', "I'll cancel", 'after the trial.']} sizes={[3.6, 6, 6]} />}
      right={<Chat name="You" message="just trying it for a week, promise" time="09:41" />}
    />,
  },
  {
    name: 'days', seconds: 2.6,
    el: <Split
      left={<div><Kinetic lines={['that was']} size={3.6} /><Count to={212} delay={8} size={14} suffix=" days" /><Kinetic lines={['ago.']} size={3.6} delay={30} /></div>}
      right={<Sticker name="spiral_calendar" size={17} delay={6} />}
    />,
  },
  {
    name: 'total', seconds: 2.8,
    el: <Split
      left={<div><Kinetic lines={['add them all up:']} size={3.6} /><Count to={1284} prefix="$" delay={10} size={13} /><Kinetic lines={['a year, on ==nothing.==']} size={3.6} delay={32} /></div>}
      right={<Sticker name="money_with_wings" size={17} delay={8} />}
    />,
  },
  {
    name: 'turn', seconds: 1.5,
    el: <AbsoluteFill><Center><div style={{transform: 'translateY(-110px)'}}><Kinetic lines={['so we built']} size={2.8} align="center" /></div></Center><DotReveal delay={22} frames={15} /></AbsoluteFill>,
  },
  {
    name: 'logo', seconds: 1.6, bg: 'lime',
    el: <Center><Logo name="Renewo" sticker="bell" size={7} /></Center>,
  },
  {
    name: 'product', seconds: 3.6,
    el: <Split
      left={<Kinetic lines={['it knows', 'what renews', '*next.*']} size={6.2} stagger={6} />}
      right={<Phone app="Renewo" heroLabel="Renewing this month" hero="$107" button="Cancel in one tap" rows={[
        {name: 'FitStream+', sub: 'tomorrow', value: '$14.99', color: '#ef5a4c'},
        {name: 'CloudBox', sub: 'in 3 days', value: '$9.99', color: '#7a5af0'},
        {name: 'Notely Pro', sub: 'in 6 days', value: '$8.00', color: '#2f9e8f'},
        {name: 'Musiq', sub: 'in 9 days', value: '$11.99', color: '#e8912d'},
      ]} />}
    />,
  },
  {
    name: 'slogan', seconds: 2.2, bg: 'lime',
    el: <Split left={<Kinetic lines={['Spot it.', 'Stop it.']} size={9} stagger={12} />} right={<Sticker name="check_mark_button" size={15} delay={22} />} />,
  },
  {
    name: 'card', seconds: 2.4,
    el: <Center><Stack delay={16}><div style={{background: '#a4e62d', borderRadius: 32, padding: '60px 110px'}}><Logo name="Renewo" sticker="bell" size={6} tagline="never pay for a forgotten app again" /></div></Stack></Center>,
  },
  {
    name: 'cta', seconds: 2.4, bg: 'lime',
    el: <Center><Logo name="Renewo" size={9} /><div style={{height: 50}} /><CTA label="Try it free" delay={12} /></Center>,
  },
];
