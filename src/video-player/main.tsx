import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerContextProvider } from './context';
import Player from './autoResponsive';

const root: HTMLElement | null = document.getElementById('root');
if (root) {
	createRoot(root).render(
		<StrictMode>
			<div style={{width:800}}>
				<PlayerContextProvider id='player2' download='/public/GGG/download_1.mp4' previews='/public/GGG/sprite.vtt' video='/public/GGG/master.m3u8' baseUrl='' poster='/public/GGG/sprite.jpg'>
					<Player />
				</PlayerContextProvider>
			</div>
		</StrictMode>
	);
}
