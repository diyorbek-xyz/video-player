import { TimeRange, PlayPause, Mute, VolumeControls, Barrier, Status, TimeView, Download, Fullscreen, Resolutions, SkipMobile } from './video-player/controllers';
import Player, { PlayerContextProvider, usePlayerContext } from './video-player/player';
import { SectionControls, SectionOther, SectionVolume } from './video-player/player_sections';

export { PlayerContextProvider, usePlayerContext };
export { SectionControls, SectionOther, SectionVolume };
export { TimeRange, PlayPause, Mute, VolumeControls, Barrier, Status, TimeView, Download, Fullscreen, Resolutions, SkipMobile };
export default Player;