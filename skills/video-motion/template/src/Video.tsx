import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Captions} from './components/Captions';
import meta from './data/meta.json';
import {captions, scenes} from './scenes';

/**
 * Layering: source video (always plays, so its audio is the soundtrack)
 * → overlay/fullscreen scenes from scenes.tsx → word captions (hidden during fullscreen scenes).
 */
export const Video: React.FC = () => {
  const {fps} = useVideoConfig();
  const fullscreen = scenes.filter((s) => s.fullscreen).map((s) => [s.start, s.end] as [number, number]);
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <OffthreadVideo src={staticFile(meta.video)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {scenes.map((s, i) => (
        <Sequence key={i} from={Math.round(s.start * fps)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * fps))} name={s.name}>
          {s.el}
        </Sequence>
      ))}
      {captions && <Captions hideBetween={fullscreen} />}
    </AbsoluteFill>
  );
};
