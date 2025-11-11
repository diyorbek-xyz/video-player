import { Download, Fullscreen, PlayPause, Resolutions, Status, TimeRange, TimeView, VolumeControls } from './player_controllers';
import { SectionControls, SectionOther, SectionVolume } from './player_sections';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auto_hide, fullscreen, keyboard_shortcut, loadPreviews, mute, parseTime, play, player_config, skip, timeFormatter } from './player_helpers';
import { useVideo } from 'react-use';
import Hls from 'hls.js';
import type { ContextType, EpisodeType } from './types';
import style from './index.module.css';

const VideoPlayerContext = createContext<ContextType | undefined>(undefined);
const VideoPlayerContextProvider = VideoPlayerContext.Provider;

function useVideoPlayerContext() {
	const context = useContext(VideoPlayerContext);
	if (!context) throw new Error('useVideoPlayerContext() must be used within a VideoPlayerContextProvider');
	return context;
}

export default function VideoPlayer({ video, poster, previews, baseUrl, download }: EpisodeType & { baseUrl?: string }) {
	const hls = useRef<Hls | null>(null);
	const [videoElement, videoState, videoControls, { current }] = useVideo(<video id={style.video} poster={baseUrl + poster} />);
	const [isBuffering, setIsBuffering] = useState(false);

	const contextValue = useMemo(() => {
		return {
			video: {
				element: videoElement,
				state: { buffering: isBuffering, ...videoState },
				controls: videoControls,
				current: current,
				hls: hls.current,
				player_config: player_config,
				menu: open,
				fullscreen: !!document.fullscreenElement,
			},
			controllers: {
				skip: (step: number) => skip({ step, videoControls, videoState }),
				load_previews: (source: string) => loadPreviews(source),
				parse_time: (text: string) => parseTime(text),
				time_formatter: (time: number) => timeFormatter(time),
				play: () => play({ videoControls, videoState }),
				fullscreen: () => fullscreen(),
				keyboard_shortcut: (e: KeyboardEvent) => keyboard_shortcut({ videoState, videoControls }, e),
				mute: () => mute({ videoControls, videoState }),
				auto_hide: () => auto_hide(),
				set_buffering: (prop: boolean) => setIsBuffering(prop),
			},
			sources: { video, previews, download, poster, baseUrl },
		};
	}, [videoState, videoControls, current, hls, isBuffering, previews, download, document.fullscreenElement, poster, baseUrl, open]);

	useEffect(() => {
		if (!current) return;
		if (Hls.isSupported()) {
			hls.current = new Hls();
			hls.current.loadSource(baseUrl + video);
			hls.current.attachMedia(current);
		} else if (current.canPlayType('application/vnd.apple.mpegurl')) {
			current.src = baseUrl + video;
		}
		return () => hls.current?.destroy();
	}, [current]);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => contextValue.controllers.keyboard_shortcut(e);
		const handleClick = () => contextValue.controllers.play();
		const handleMouse = () => auto_hide();

		current?.addEventListener('click', handleClick);
		current?.addEventListener('mousemove', handleMouse);
		window.addEventListener('keydown', handleKey);

		return () => {
			current?.removeEventListener('click', handleClick);
			current?.removeEventListener('mousemove', handleMouse);
			window.removeEventListener('keydown', handleKey);
		};
	}, [videoState]);

	useEffect(() => {
		if (hls.current && player_config) {
			videoControls.volume(player_config.volume);
			if (player_config.muted) videoControls.mute();
			else videoControls.unmute();
			hls.current.currentLevel = player_config.resolution;
		}
	}, [hls.current]);

	return (
		<VideoPlayerContextProvider value={contextValue}>
			<div id={style.video_player}>
				{videoElement}
				<Status />
				<SectionControls>
					<TimeRange />
					<SectionVolume>
						<PlayPause />
						<VolumeControls />
						<TimeView />
					</SectionVolume>
					<SectionOther>
						<Resolutions />
						<Download />
						<Fullscreen />
					</SectionOther>
				</SectionControls>
			</div>
		</VideoPlayerContextProvider>
	);
}

export { useVideoPlayerContext, VideoPlayer, VideoPlayerContext, VideoPlayerContextProvider };
