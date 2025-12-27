import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import VideoPlayer from './player';

const root: HTMLElement | null = document.getElementById('root');
if (root) {
	createRoot(root).render(
		<StrictMode>
			<div style={{ width: 800 }}>
				<VideoPlayer src='https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' poster='/poster.png' />
			</div>
		</StrictMode>
	);
}
