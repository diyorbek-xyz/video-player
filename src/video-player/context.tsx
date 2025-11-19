import Hls, { Level, type BufferTimeRange } from 'hls.js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import style from './global.module.css';
import { loadPreviews } from './helpers';

interface PlayerProps {
	id: string;
	video: string;
	poster: string;
	previews?: string;
	download?: string;
	baseUrl?: string;
	type?: 'dash' | 'hls-m3u8' | 'basic-mp4';
}
interface PreviewCue extends TextTrackCue {
	text: string;
}
interface ContextType {
	source: {
		id: string;
		video: string;
		poster: string;
		previews?: string;
		download?: string;
		baseUrl?: string;
		previewsData?: PreviewCue[];
	};
	state: {
		playing: boolean;
		time: number;
		volume: number;
		muted: boolean;
		rendition: number;
		buffered: BufferTimeRange[];
		buffering: boolean;
		duration: number;
		hls: Hls;
		fullscreen: boolean;
		width: number;
		resolutions: Level[];
		renditionMenu?: boolean;
		hidden: boolean;
		preview: { enabled: boolean; time: string; image?: string; position?: string };
	};
	controller: {
		play: () => void;
		mute: () => void;
		fullscreen: () => void;
		volume: (value: number) => void;
		seek: (time: number) => void;
		skip: (step: number) => void;
		rendition: (param: number | -1) => void;
		openRenditionMenu: (param?: boolean) => void;
		hide: () => void;
		previewing: (param: { enabled: boolean; time: string; image?: string; position?: string }) => void;
	};
}

const playerContext = createContext<ContextType | undefined>(undefined);

/**
 * Returns the current player context.
 *
 * This hook must be used within a <{@link PlayerContextProvider}/> component.
 *
 * Return Type
 * @example
 * ```tsx
 * 	interface ContextType {
 * 		source: {
 * 			id: string;
 * 			video: string;
 * 			poster: string;
 * 			previews?: string;
 * 			download?: string;
 * 			baseUrl?: string;
 * 		};
 * 		state: {
 * 			playing: boolean;
 * 			time: number;
 * 			volume: number;
 * 			muted: boolean;
 * 			rendition: number;
 * 			buffered: BufferTimeRange[];
 * 			buffering: boolean;
 * 			duration: number;
 * 			hls: Hls;
 * 			fullscreen: boolean;
 * 			width: number;
 * 			resolutions: Level[];
 * 			renditionMenu?: boolean;
 * 			hidden: boolean;
 * 			preview: { enabled: boolean; time: string; image?: string; position?: string };
 * 		};
 * 		controller: {
 * 			play: () => void;
 * 			mute: () => void;
 * 			fullscreen: () => void;
 * 			volume: (value: number) => void;
 * 			seek: (time: number) => void;
 * 			skip: (step: number) => void;
 * 			rendition: (param: number | -1) => void;
 * 			openRenditionMenu: (param?: boolean) => void;
 * 			hide: () => void;
 * 			previewing: (param: { enabled: boolean; time: string; image?: string; position?: string }) => void;
 *		};
 *	}
 *	```
 * @returns {ContextType | undefined}
 */
function usePlayerContext(): ContextType {
	const context = useContext(playerContext);
	if (!context) throw new Error('usePlayerContext() must be used within a <PlayerContextProvider/>');
	return context;
}

function PlayerContextProvider({ video, poster, previews, baseUrl, download, type, id, ...props }: React.ComponentProps<'div'> & PlayerProps) {
	const [playing, setPlaying] = useState<boolean>(false);
	const [muted, setMuted] = useState<boolean>(false);
	const [volume, setVolume] = useState<number>(1);
	const [time, setTime] = useState<number>(0);
	const [rendition, setRendition] = useState<number>(-1);
	const [duration, setDuration] = useState<number>(0);
	const [buffered, setBuffered] = useState<BufferTimeRange[]>([]);
	const [buffering, setBuffering] = useState<boolean>(false);
	const [resolutions, setResolutions] = useState<Level[]>([]);
	const [playerTag, setPlayerTag] = useState<HTMLVideoElement>();
	const [fullscreen, setFullscreen] = useState<boolean>(false);
	const [preview, setPreview] = useState<{ enabled: boolean; time: string; image?: string; position?: string }>({ enabled: false, time: '' });
	const [width, setWidth] = useState<number>(0);
	const [renditionMenu, openRenditionMenu] = useState<boolean>(false);
	const [previewsData, setPreviewsData] = useState<PreviewCue[]>();
	const [hidden, setHidden] = useState<boolean>(false);

	const hls = useRef<Hls>(new Hls());
	useEffect(() => {
		const video_tag = document.getElementById('video-' + id) as HTMLVideoElement;

		function keyboard_shortcut(e: KeyboardEvent) {
			const conts = document.getElementsByClassName(style.video_player);
			if (conts.length != 1) return console.warn(`There are ${conts.length} players`);

			if (e.key == ' ') e.preventDefault();
			if (e.key == 'ArrowRight') skip(5);
			if (e.key == 'ArrowLeft') skip(-5);
			if (e.key == 'ArrowDown') changeVolume(volume - 0.1);
			if (e.key == 'ArrowUp') changeVolume(volume + 0.1);
			if (e.key == ' ') changePlaying(!playing);
			if (e.key == 'f') changeFullscreen();
			if (e.key == 'm') changeMuted(!muted);
			handleChange();
		}
		function loadDuration() {
			setDuration(video_tag.duration);
			setResolutions(hls.current.levels);
		}
		function handleChange() {
			setRendition(hls.current.currentLevel);
			setDuration(() => video_tag.duration);
			setMuted(() => video_tag.muted);
			setTime(() => video_tag.currentTime);
			setPlaying(() => !!video_tag.paused);
			setBuffered(hls.current.mainForwardBufferInfo?.buffered ?? []);
			setWidth(video_tag.getBoundingClientRect().width);
		}
		setBuffering(() => {
			if (!hls.current.media) return false;
			if (!hls.current.mainForwardBufferInfo?.buffered) return false;
			if (video_tag.paused) return false;
			return !hls.current.mainForwardBufferInfo?.buffered?.find((e) => time <= e.end && time >= e.start);
		});

		window.addEventListener('keydown', keyboard_shortcut);
		window.addEventListener('resize', () => setWidth(() => video_tag.getBoundingClientRect().width));
		video_tag.addEventListener('loadedmetadata', loadDuration);
		video_tag.addEventListener('timeupdate', handleChange);
		return () => {
			window.removeEventListener('resize', () => setWidth(() => video_tag.getBoundingClientRect().width));
			video_tag.removeEventListener('loadedmetadata', loadDuration);
			video_tag.removeEventListener('timeupdate', handleChange);
			window.removeEventListener('keydown', keyboard_shortcut);
		};
	}, [duration, time, muted, hidden, fullscreen, playing, volume, buffered, buffering, hls.current.mainForwardBufferInfo, hls.current.mainForwardBufferInfo?.buffered, hls.current.mainForwardBufferInfo?.end, hls.current.mainForwardBufferInfo?.start]);

	useEffect(() => {
		const video_tag = document.getElementById('video-' + id) as HTMLVideoElement;
		setPlayerTag(video_tag);

		if (!video_tag) return;
		if (video.endsWith('.m3u8') || type == 'hls-m3u8') {
			if (Hls.isSupported()) {
				hls.current.loadSource(video);
				hls.current.attachMedia(video_tag!);
			} else if (video_tag.canPlayType('application/vnd.apple.mpegurl')) {
				video_tag.src = baseUrl + video;
			}
		} else if (video.endsWith('.mp4') || type == 'basic-mp4') {
			setBuffering(false);
			video_tag.src = baseUrl + video;
		}
		const track = video_tag.textTracks[0];

		track.addEventListener('cuechange', () => {
			const cues: PreviewCue[] = [];
			for (const cue of track.cues!) {
				cues.push(cue as PreviewCue);
			}
			setPreviewsData(cues);
		});

		track.addEventListener('load', () => {
			const cues: PreviewCue[] = [];
			for (const cue of track.cues!) {
				cues.push(cue as PreviewCue);
			}
			setPreviewsData(cues);
		});
	}, [hls.current]);
	function skip(step: number) {
		changeTime(time + step);
		const video_player = document.getElementById(id);
		if (!video_player) return console.error('video_player not found');

		const skip_view = document.createElement('div');
		skip_view.classList.add(style.player_skip_view);
		if (step < 0) {
			skip_view.classList.add(style.left);
		} else {
			skip_view.classList.add(style.right);
			skip_view.innerText += '+';
		}
		skip_view.innerText += step;
		video_player.appendChild(skip_view);

		setTimeout(() => (skip_view.style.opacity = '1'), 50);
		setTimeout(() => (skip_view.style.opacity = '0'), 1700);
		setTimeout(() => video_player.removeChild(skip_view), 2000);
	}
	function changePlaying(param: boolean) {
		if (!playerTag) return;
		if (param) {
			playerTag.pause();
			hls.current.pauseBuffering();
		} else {
			hls.current.resumeBuffering();
			const wait = playerTag.play();
			wait.then(() => setPlaying(param));
		}
	}
	function changeMuted(param: boolean) {
		if (!playerTag) return;
		if (param) playerTag.muted = true;
		else playerTag.muted = false;
		setMuted(param === null ? !muted : param);
	}
	function changeVolume(value: number) {
		if (!playerTag) return;
		playerTag.volume = Math.min(Math.max(value, 0), 1);
		setVolume(Math.min(Math.max(value, 0), 1));
	}
	function changeTime(value: number) {
		if (!playerTag) return;
		playerTag.currentTime = Math.min(Math.max(value, 0), duration);
		setTime(Math.min(Math.max(value, 0), duration));
	}
	function changeRendition(param: number) {
		if (!hls.current.levels) return;
		hls.current.pauseBuffering();
		hls.current.nextLevel = param;
		hls.current.resumeBuffering();
		setRendition(param);
	}
	function changeFullscreen() {
		const container = document.getElementById(id) as HTMLElement;
		if (!container) return;
		if (document.fullscreenElement?.id == id) {
			setFullscreen(false);
			document.exitFullscreen();
		} else {
			setFullscreen(true);
			container.requestFullscreen().then(async () => (await (screen.orientation as any).lock('landscape')).catch(() => alert("Can't rotate your window")));
		}
	}

	const contextValue = useMemo(() => {
		return {
			source: {
				id: id,
				video: video,
				poster: poster,
				previews: previews,
				baseUrl: baseUrl,
				download: download,
				previewsData: previewsData,
			},
			state: {
				playing: playing,
				time: time,
				volume: volume,
				muted: muted,
				buffered: buffered,
				buffering: buffering,
				rendition: rendition,
				resolutions: resolutions,
				duration: duration,
				hls: hls.current,
				fullscreen: fullscreen,
				width: width,
				preview: preview,
				renditionMenu: renditionMenu,
				hidden: hidden,
			},
			controller: {
				play: () => changePlaying(!playing),
				mute: () => changeMuted(!muted),
				volume: (value: number) => changeVolume(value),
				seek: (time: number) => changeTime(time),
				skip: (step: number) => skip(step),
				rendition: (param: number) => changeRendition(param),
				fullscreen: () => changeFullscreen(),
				previewing: (data: typeof preview) => setPreview(data),
				openRenditionMenu: (param) => openRenditionMenu(() => (param != undefined ? param : !renditionMenu)),
				hide: () => setHidden(!hidden),
			},
		} as ContextType;
	}, [
		id,
		hidden,
		video,
		poster,
		previews,
		baseUrl,
		download,
		playing,
		volume,
		time,
		preview,
		muted,
		buffered,
		buffering,
		resolutions,
		renditionMenu,
		rendition,
		duration,
		width,
		fullscreen,
		hls.current,
		playerTag,
		document.fullscreenElement,
		playerTag?.currentTime,
		playerTag?.muted,
		playerTag?.duration,
		playerTag?.paused,
	]);

	return (
		<playerContext.Provider value={contextValue}>
			<div id={id} className={style.video_player} {...props} />
		</playerContext.Provider>
	);
}
export { PlayerContextProvider, usePlayerContext };
