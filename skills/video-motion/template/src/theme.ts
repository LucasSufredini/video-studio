import {loadFont as loadSerif} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

export const serif = loadSerif().fontFamily;
export const sans = loadSans().fontFamily;
export const mono = loadMono().fontFamily;

// Edit these to restyle every scene at once.
export const theme = {
  bg: '#141210',
  panel: '#1d1a17',
  paper: '#efe9df',
  ink: '#1b1712',
  text: '#efe9df',
  muted: '#8a8276',
  accent: '#d97757',
  gold: '#d9b24c',
  green: '#7fc8a9',
};
