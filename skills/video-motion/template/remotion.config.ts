import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// CPU-friendly defaults; raise if the machine has headroom.
Config.setConcurrency(4);
