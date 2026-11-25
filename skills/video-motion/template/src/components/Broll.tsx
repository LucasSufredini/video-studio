import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Full-frame cutaway over the speech (use with `fullscreen: true`): a clip or a photo from public/broll/.
 * `from` skips the first seconds of the clip. `zoom` is a slow push-in over 6 s (0 turns it off).
 * `x`/`y` (0-100) choose which part stays in frame when the shape does not match.
 */
export const Broll: React.FC<{src: string; from?: number; zoom?: number; x?: number; y?: number}> = ({
  src, from = 0, zoom = 0.06, x = 50, y = 50,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = 1 + zoom * Math.min(1, frame / (fps * 6));
  const style: React.CSSProperties = {
    width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${x}% ${y}%`,
    transform: `scale(${scale})`, transformOrigin: `${x}% ${y}%`,
  };
  const isPhoto = /\.(jpe?g|png|webp)$/i.test(src);
  return (
    <AbsoluteFill style={{background: 'black', overflow: 'hidden'}}>
      {isPhoto
        ? <Img src={staticFile(src)} style={style} />
        : <OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(from * fps)} style={style} />}
    </AbsoluteFill>
  );
};
