import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Player, { PlayerContextProvider } from './player';

const root: HTMLElement | null = document.getElementById('root');
if (root) {
	createRoot(root).render(
		<StrictMode>
			<PlayerContextProvider id='player' download='/animes/TESTTTT/1/1/TESTTTT_1_1.mp4' previews='/animes/TESTTTT/1/1/previews.vtt' video='/animes/TESTTTT/1/1/TESTTTT_1_1.mp4' baseUrl='' poster='/animes/TESTTTT/1/poster.png'>
				<Player />
			</PlayerContextProvider>
			<PlayerContextProvider id='player2' download='/animes/TESTTTT/1/1/TESTTTT_1_1.mp4' previews='/animes/TESTTTT/1/1/previews.vtt' video='/animes/TESTTTT/1/1/master.m3u8' baseUrl='' poster='/animes/TESTTTT/1/poster.png'>
				<Player />
			</PlayerContextProvider>
		</StrictMode>
	);
}
