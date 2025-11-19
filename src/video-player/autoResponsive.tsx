import { useState } from 'react';
import PlayerDesktop from './desktop/player';
import PlayerMobile from './mobile/player';

/**
 * Auto responsive player component.
 *
 * If the width of the player is greater than or equal to 500px,
 * it will render the desktop player. Otherwise, it will render the mobile player.
 *
 * @example ## Example Usage
 * ```tsx
 *  import { PlayerContextProvider } from '@diyorbek-xyz/video-player';
 *  import Player from '@diyorbek-xyz/video-player';
 *  
 *  function App() {
 *      return (
 *          <PlayerContextProvider>
 *              <Player />
 *          </PlayerContextProvider>
 *      );
 *  }
 * ```
 */
function Player() {
    const [w, setw] = useState<number>(window.innerWidth)
    window.addEventListener('resize', () => setw(window.innerWidth))
	if (w >= 500) return <PlayerDesktop />;
	return <PlayerMobile />;
}
export default Player;
