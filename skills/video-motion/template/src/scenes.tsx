import {AbsoluteFill} from 'remotion';
import {Card} from './components/Card';
import {HeroWord} from './components/HeroWord';
import {Terminal} from './components/Terminal';
import {wordAt} from './lib';

export type Scene = {
  name: string;
  start: number; // seconds in the source video
  end: number;
  /** true = covers the camera (audio keeps playing, captions hidden). false = drawn on top of the camera. */
  fullscreen?: boolean;
  el: React.ReactNode;
};

/*
 * THIS FILE IS REWRITTEN FOR EACH VIDEO, from the approved scene plan.
 * Anchor every scene to the transcript: start = wordAt('palavra') (or a literal time from transcript.json).
 * The example below works with the placeholder transcript in data/transcript.json.
 */
const t0 = wordAt('Exemplo');

/** Word-by-word captions. Turn off in long videos and use KeyPhrase for the key lines. */
export const captions = true;

export const scenes: Scene[] = [
  {name: 'hero', start: t0, end: t0 + 1.5, fullscreen: true, el: <HeroWord text="EXEMPLO" />},
  {
    name: 'terminal', start: t0 + 1.5, end: t0 + 3.5, fullscreen: true,
    el: <Terminal lines={[{at: 0, text: 'transcreve com o tempo de cada palavra', kind: 'prompt'}, {at: 1.2, text: 'Whisper(video.mp4)', kind: 'tool'}]} />,
  },
  {
    name: 'card', start: t0 + 3.5, end: t0 + 5, fullscreen: false,
    el: <AbsoluteFill><Card label="dica" title="Card por cima da câmera" subtitle="overlay" /></AbsoluteFill>,
  },
];
