import { useEffect, useRef, useReducer, useCallback } from 'react';
import Hls, { Level, type BufferTimeRange } from 'hls.js';

export type PlayerState = {
	playing: boolean;
	volume: number;
	muted: boolean;
	duration: number;
	currentTime: number;
	levels: Level[];
	currentLevel: number;
	buffering: boolean;
	buffers: BufferTimeRange[] | TimeRanges;
};

export function useVideoPlayer(url: string, type?: string) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const hlsRef = useRef<Hls | null>(null);
	const [state, dispatch] = useReducer((s: PlayerState, a: Partial<PlayerState>) => ({ ...s, ...a }), {
		playing: false,
		volume: 1,
		muted: false,
		duration: 0,
		currentTime: 0,
		levels: [],
		buffers: [],
		currentLevel: -1,
		buffering: false,
	});
	const togglePlay = useCallback(() => {
		if (!videoRef.current) return;
		if (videoRef.current.paused) videoRef.current.play();
		else videoRef.current.pause();
	}, []);
	const toggleMuted = useCallback(() => {
		if (!videoRef.current) return;
		dispatch({ muted: !videoRef.current.muted });
		videoRef.current.muted = !videoRef.current.muted;
	}, []);
	const changeVolume = useCallback((volume: number) => {
		if (!videoRef.current) return;
		dispatch({ volume });
		dispatch({ muted: volume == 0 });
		videoRef.current.volume = volume;
		videoRef.current.muted = volume == 0;
	}, []);
	const seek = useCallback((time: number) => {
		if (videoRef.current) {
			dispatch({ currentTime: time });
			videoRef.current.currentTime = time;
		}
	}, []);
	const skip = useCallback((step: number) => {
		if (videoRef.current) {
			const newTime = Math.max(Math.min(videoRef.current.currentTime + step, videoRef.current.duration), 0);
			videoRef.current.currentTime = newTime;
		}
	}, []);
	const changeLevel = useCallback((level: number) => {
		if (videoRef.current && hlsRef.current) {
			dispatch({ currentLevel: level });
			hlsRef.current.nextLevel = level;
			localStorage.setItem('resolution', level.toString());
		}
	}, []);
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (Hls.isSupported() && (url.endsWith('.m3u8') || type === 'hls-m3u8')) {
			const hls = new Hls({ enableWorker: true, maxBufferSize: 1 });
			hlsRef.current = hls;
			hls.loadSource(url);
			hls.attachMedia(video);

			hls.loadLevel = Number(localStorage.getItem('resolution') ?? '-1');
			dispatch({ currentLevel: Number(localStorage.getItem('resolution') ?? '-1') });
			hls.on(Hls.Events.MANIFEST_PARSED, () => dispatch({ levels: hls.levels }));
			hls.on(Hls.Events.BUFFER_APPENDED, () => dispatch({ buffers: hls.mainForwardBufferInfo?.buffered }));
		} else {
			video.addEventListener('timeupdate', () => dispatch({ buffers: video.buffered }));
			video.src = url;
		}

		const onTimeUpdate = () => dispatch({ currentTime: video.currentTime });
		const onLoadedMetadata = () => dispatch({ duration: video.duration });
		const onPlay = () => dispatch({ playing: true });
		const onPause = () => dispatch({ playing: false });
		const onWaiting = () => dispatch({ buffering: true });
		const onPlaying = () => dispatch({ buffering: false });

		video.addEventListener('timeupdate', onTimeUpdate);
		video.addEventListener('loadedmetadata', onLoadedMetadata);
		video.addEventListener('play', onPlay);
		video.addEventListener('pause', onPause);
		video.addEventListener('waiting', onWaiting);
		video.addEventListener('stalled', onWaiting);
		video.addEventListener('playing', onPlaying);
		video.addEventListener('canplay', onPlaying);

		return () => {
			video.removeEventListener('timeupdate', onTimeUpdate);
			hlsRef.current?.destroy();
		};
	}, [url, type]);

	return { videoRef, state, actions: { togglePlay, seek, changeLevel, dispatch, toggleMuted, changeVolume, skip } };
}
