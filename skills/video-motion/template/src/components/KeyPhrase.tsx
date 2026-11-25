import {AbsoluteFill} from 'remotion';
import {Kinetic} from './promo/Kinetic';
import {promo} from './promo/kit';

/**
 * Discreet key phrase in the lower part of the frame, for long videos with captions off.
 * Accepts the same *italic* and ==highlight== marks as Kinetic.
 */
export const KeyPhrase: React.FC<{text: string; size?: number; bottom?: string; delay?: number}> = ({
  text, size = 3.4, bottom = '11%', delay = 2,
}) => (
  <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: bottom}}>
    <div style={{textShadow: '0 2px 18px rgba(0,0,0,.75), 0 1px 3px rgba(0,0,0,.9)', maxWidth: '80%'}}>
      <Kinetic lines={[text]} size={size} color={promo.white} markColor="rgba(0,0,0,.55)" align="center" delay={delay} stagger={3} />
    </div>
  </AbsoluteFill>
);
