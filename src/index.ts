import Player from './video-player/autoResponsive';
import PlayerDesktop from './video-player/desktop/player';
import PlayerMobile from './video-player/mobile/player';

export { PlayerDesktop, PlayerMobile };
export { PlayerContextProvider, usePlayerContext } from './video-player/context';
export default Player;
