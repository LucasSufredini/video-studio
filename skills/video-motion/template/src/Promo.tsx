import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop} from './components/promo/Pieces';
import {promoAudio, promoScenes} from './promo-scenes';

const Enter: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: t, transform: `scale(${1.03 - t * 0.03})`}}>{children}</AbsoluteFill>;
};

export const promoFrames = (fps: number) => promoScenes.reduce((sum, s) => sum + Math.round(s.seconds * fps), 0);

/** Animation-only composition: no recorded video. Scenes run one after another from promo-scenes.tsx. */
export const Promo: React.FC = () => {
  const {fps} = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill>
      {promoScenes.map((s) => {
        const frames = Math.round(s.seconds * fps);
        const start = from;
        from += frames;
        return (
          <Sequence key={s.name} from={start} durationInFrames={frames} name={s.name}>
            <Backdrop variant={s.bg} />
            <Enter>{s.el}</Enter>
          </Sequence>
        );
      })}
      {promoAudio && <Audio src={staticFile(promoAudio)} />}
    </AbsoluteFill>
  );
};
