// YouTube thumbnail (1280x720). Render with: npx remotion still Thumb out/thumb.png
export const thumb = {
  /** Photo or frame in public/ (e.g. 'thumb.jpg'), or null for a plain background while testing. */
  photo: null as string | null,
  /** Up to 3 words, one per line. Never repeat the video title. */
  words: ['só', 'eu'],
  /** Index of the word painted in the accent colour, or -1 for none. */
  accent: 1,
  /** Side of the frame where the text sits; keep the face or object on the other side. */
  side: 'left' as 'left' | 'right',
  /** Photo framing: zoom 1 = fit, x/y 0-100 choose what stays in frame. */
  zoom: 1,
  x: 50,
  y: 50,
  /** 0-1: how much the text side is darkened to make the words readable. */
  darken: 0.55,
  color: '#ffffff',
  accentColor: '#ffd84d',
  /** Word size as a fraction of the height. */
  size: 0.26,
};
