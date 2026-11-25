import {loadFont as loadDisplay} from '@remotion/google-fonts/Manrope';
import {loadFont as loadItalic} from '@remotion/google-fonts/InstrumentSerif';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const display = loadDisplay('normal', {weights: ['500', '700', '800'], subsets: ['latin']}).fontFamily;
export const italic = loadItalic('italic', {weights: ['400'], subsets: ['latin']}).fontFamily;

// Restyle a whole ad here: swap these for the client's brand colours.
export const promo = {
  ink: '#1d1b26',
  muted: '#8d8a99',
  lime: '#a4e62d',
  limeDeep: '#8fd61f',
  white: '#ffffff',
  lilac: '#e3d6f7',
  peach: '#fbdcc7',
  sky: '#dbe6fb',
  paper: '#f7f4f8',
  red: '#ef5a4c',
};

/** Size unit: 1u = 1% of the longest side, so every layout scales with the format. */
export const useU = () => {
  const {width, height} = useVideoConfig();
  return Math.max(width, height) / 100;
};

export const usePortrait = () => {
  const {width, height} = useVideoConfig();
  return height > width;
};

/** 0→1 eased progress starting at a local frame. */
export const useRise = (delay: number, frames = 12) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + frames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
};
