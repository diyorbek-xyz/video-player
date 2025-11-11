import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import VideoPlayer from './video_player';
import './index.css'

const root: HTMLElement | null = document.getElementById('root');
if (root) {
	createRoot(root).render(
		<StrictMode>
			<VideoPlayer download='/animes/Naruto/1/1/Naruto_1_1.mp4' previews='/animes/Naruto/1/1/previews.vtt' video='/animes/Naruto/1/1/master.m3u8' baseUrl='' poster='/animes/Naruto/1/poster.jpg' />
		</StrictMode>
	);
}
