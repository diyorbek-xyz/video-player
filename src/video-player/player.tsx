import Hls, { Level, type BufferTimeRange } from 'hls.js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import style from './index.module.css';
import { Barrier, Download, Fullscreen, PlayPause, Resolutions, SkipMobile, Status, TimeRange, TimeView, VolumeControls } from './controllers';
import { SectionControls, SectionOther, SectionVolume } from './player_sections';

interface PlayerProps {
	id: string;
	video: string;
	poster: string;
	previews?: string;
	download?: string;
	baseUrl?: string;
	type: 'dash' | 'hls-m3u8' | 'basic-mp4';
}
interface ContextType {
	source: {
		id: string;
		video: string;
		poster: string;
		previews?: string;
		download?: string;
		baseUrl?: string;
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
		resolutions: Level[];
	};
	controller: {
		play: () => void;
		mute: () => void;
		fullscreen: () => void;
		volume: (value: number) => void;
		seek: (time: number) => void;
		skip: (step: number) => void;
		rendition: (param: number | -1) => void;
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
 * interface ContextType {
 *		source: {
 *			id: string;
 *			video: string;
 *			poster: string;
 *			previews?: string;
 *			download?: string;
 *			baseUrl?: string;
 *		};
 *		state: {
 *			playing: boolean;
 *			time: number;
 *			volume: number;
 *			muted: boolean;
 *			rendition: number;
 *			buffered: BufferTimeRange[];
 *			buffering: boolean;
 *			duration: number;
 *			hls: Hls;
 *			fullscreen: boolean;
 *			resolutions: Level[];
 *		};
 *		controller: {
 *			play: () => void;
 *			mute: () => void;
 *			fullscreen: () => void;
 *			volume: (value: number) => void;
 *			seek: (time: number) => void;
 *			skip: (step: number) => void;
 *			rendition: (param: number | -1) => void;
 *		};
 *	}
 *	```
 * @returns {ContextType | undefined}
 */
function usePlayerContext() {
	const context = useContext(playerContext);
	if (!context) throw new Error('usePlayerContext() must be used within a <PlayerContextProvider/>');
	return context;
}
function VideoElement({ ...props }: React.ComponentProps<'video'>) {
	const {
		source: { poster, baseUrl, id },
		controller: { play },
	} = usePlayerContext();
	return <video id={id} poster={baseUrl + poster} onClick={() => play()} {...props} />;
}
function PlayerContextProvider({ video, poster, previews, baseUrl, download, type, id, ...props }: React.ComponentProps<'div'> & PlayerProps) {
	const [playing, setPlaying] = useState<boolean>(false);
	const [muted, setMuted] = useState<boolean>(false);
	const [volume, setVolume] = useState<number>(1);
	const [time, setTime] = useState<number>(0);
	const [rendition, setRendition] = useState<number>(-1);
	const [duration, setDuration] = useState<number>(0);
	const [buffered, setBuffered] = useState<BufferTimeRange[]>([]);
	const [buffering, setBuffering] = useState<boolean>(true);
	const [resolutions, setResolutions] = useState<Level[]>([]);
	const [playerTag, setPlayerTag] = useState<HTMLVideoElement>();
	const [fullscreen, setFullscreen] = useState<boolean>(false);
	const hls = useRef<Hls>(new Hls());

	useEffect(() => {
		const video_tag = document.getElementById(id) as HTMLVideoElement;
		setPlayerTag(video_tag);
		if (!video_tag) return;
		if (type == 'hls-m3u8') {
			if (Hls.isSupported()) {
				hls.current.loadSource(video);
				hls.current.attachMedia(video_tag!);
			} else if (video_tag.canPlayType('application/vnd.apple.mpegurl')) {
				video_tag.src = baseUrl + video;
			}
		} else if (type == 'basic-mp4') {
			video_tag.src = baseUrl + video;
		}
	}, [hls.current]);

	function skip(step: number) {
		changeTime(time + step);
		const video_player = document.getElementById(style.video_player);
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

	useEffect(() => {
		const video_tag = document.getElementById(id) as HTMLVideoElement;

		function keyboard_shortcut(e: KeyboardEvent) {
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
			setBuffering(() => {
				if (!hls.current.mainForwardBufferInfo) return true;
				return hls.current.mainForwardBufferInfo.start >= time || time >= hls.current.mainForwardBufferInfo.end;
			});
		}

		window.addEventListener('keydown', keyboard_shortcut);
		video_tag.addEventListener('loadedmetadata', loadDuration);
		video_tag.addEventListener('timeupdate', handleChange);
		return () => {
			video_tag.removeEventListener('loadedmetadata', loadDuration);
			video_tag.removeEventListener('timeupdate', handleChange);
			window.removeEventListener('keydown', keyboard_shortcut);
		};
	}, [duration, time, muted, fullscreen, playing, volume, hls.current.mainForwardBufferInfo, hls.current.mainForwardBufferInfo?.buffered, hls.current.mainForwardBufferInfo?.end, hls.current.mainForwardBufferInfo?.start]);

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
		const container = document.getElementById(style.video_player) as HTMLElement;
		if (!container) return;
		if (document.fullscreenElement?.id == style.video_player) {
			setFullscreen(false);
			document.exitFullscreen();
		} else {
			setFullscreen(true);
			container.requestFullscreen();
		}
	}
	const contextValue = useMemo(
		() =>
			({
				source: {
					id: id,
					video: video,
					poster: poster,
					previews: previews,
					baseUrl: baseUrl,
					download: download,
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
				},
				controller: {
					play: () => changePlaying(!playing),
					mute: () => changeMuted(!muted),
					volume: (value: number) => changeVolume(value),
					seek: (time: number) => changeTime(time),
					skip: (step: number) => skip(step),
					rendition: (param: number) => changeRendition(param),
					fullscreen: () => changeFullscreen(),
				},
			} as ContextType),
		[playing, volume, time, muted, rendition, duration, playerTag, document.fullscreenElement, playerTag?.currentTime, playerTag?.muted, playerTag?.duration, playerTag?.paused]
	);

	return (
		<playerContext.Provider value={contextValue}>
			<div id={style.video_player} {...props} />
		</playerContext.Provider>
	);
}
function Player() {
	return (
		<>
			<VideoElement />
			<Status />
			<Barrier />
			<SkipMobile />
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
		</>
	);
}

export { PlayerContextProvider, usePlayerContext };
export default Player;
