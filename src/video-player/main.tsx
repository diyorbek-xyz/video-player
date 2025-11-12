import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Player, { PlayerContextProvider } from './player';
import VideoPlayer from './video_player';

const root: HTMLElement | null = document.getElementById('root');
if (root) {
	createRoot(root).render(
		<StrictMode>
			<PlayerContextProvider id='player' type='hls-m3u8' download='/animes/Naruto/1/1/Naruto_1_1.mp4' previews='/animes/Naruto/1/1/previews.vtt' video='/animes/Naruto/1/1/master.m3u8' baseUrl='' poster='/animes/Naruto/1/poster.jpg'>
				<Player />
			</PlayerContextProvider>
			<VideoPlayer download='/animes/Naruto/1/1/Naruto_1_1.mp4' previews='/animes/Naruto/1/1/previews.vtt' video='/animes/Naruto/1/1/master.m3u8' baseUrl='' poster='/animes/Naruto/1/poster.jpg' />
		</StrictMode>
	);
}
