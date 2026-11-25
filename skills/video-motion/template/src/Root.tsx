import {Composition} from 'remotion';
import {Promo, promoFrames} from './Promo';
import {Thumb} from './Thumb';
import {promoFormat} from './promo-scenes';
import {Video} from './Video';
import meta from './data/meta.json';

// meta.json is written by scripts/prepare.py from the source video.
// Rendering at 30 fps keeps CPU renders fast; set FPS=60 for smoother motion.
const FPS = 30;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Video}
      durationInFrames={Math.ceil(meta.duration * FPS)}
      fps={FPS}
      width={meta.width}
      height={meta.height}
    />
    <Composition
      id="Promo"
      component={Promo}
      durationInFrames={promoFrames(FPS)}
      fps={FPS}
      width={promoFormat.width}
      height={promoFormat.height}
    />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={FPS} width={1280} height={720} />
  </>
);
