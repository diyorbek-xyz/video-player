import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import VideoPlayer from './player';

const root: HTMLElement | null = document.getElementById('root');
if (root) {
	createRoot(root).render(
		<StrictMode>
			<div style={{ width: 800 }}>
				<VideoPlayer src='/video.mp4' poster='/poster.png' />
			</div>
		</StrictMode>
	);
}
