import Hls, { Level } from 'hls.js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import style from './index.module.css';

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
		buffered: number;
		duration: number;
	};
	controller: {
		play: (param: boolean) => void;
		mute: (param: boolean) => void;
		volume: (value: number) => void;
		seek: (time: number) => void;
		skip: (step: number) => void;
		rendition: (param: number) => void;
		buffering: (param: number) => void;
	};
}

const playerContext = createContext<ContextType | undefined>(undefined);
function usePlayerContext() {
	const context = useContext(playerContext);
	if (!context) throw new Error('usePlayerContext() must be used within a <PlayerContextProvider/>');
	return context;
}
function VideoElement({ ...props }: React.ComponentProps<'video'>) {
	const { poster, baseUrl, id } = usePlayerContext().source;
	return <video id={id} poster={baseUrl + poster} controls {...props} />;
}
function PlayerContextProvider({ video, poster, previews, baseUrl, download, type, id, ...props }: React.ComponentProps<'article'> & PlayerProps) {
	const [playing, setPlaying] = useState<boolean>(false);
	const [muted, setMuted] = useState<boolean>(false);
	const [volume, setVolume] = useState<number>(1);
	const [time, setTime] = useState<number>(0);
	const [rendition, setRendition] = useState<number>(-1);
	const [duration, setDuration] = useState<number>(0);
	const [buffered, setBuffer] = useState<number>(0);
	const [resolutions, setResolutions] = useState<Level[]>([]);
	const hls = useRef<Hls>(new Hls());

	useEffect(() => {
		const video_tag = document.getElementById(id) as HTMLVideoElement;
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
		function loadDuration() {
			setDuration(hls.current.media?.duration ?? 0);
			setResolutions(hls.current.levels);
		}

		video_tag.addEventListener('loadedmetadata', loadDuration);
		return () => {
			video_tag.removeEventListener('loadedmetadata', loadDuration);
		};
	}, [hls.current]);

	function changePlaying(param: boolean) {
		setPlaying(param);
	}
	function changeMuted(param: boolean) {
		setMuted(param === null ? !muted : param);
	}
	function changeVolume(value: number) {
		setVolume(Math.min(Math.max(value, 0), 1));
	}
	function changeTime(value: number) {
		setTime(Math.min(Math.max(value, 0), duration));
	}
	function changeRendition(param: number) {
		setRendition(param);
	}

	const contextValue = useMemo(
		() => ({
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
				rendition: rendition,
				resolutions: resolutions,
				duration: duration,
			},
			controller: {
				play: (param: boolean) => changePlaying(param),
				mute: (param: boolean) => changeMuted(param),
				volume: (value: number) => changeVolume(value),
				seek: (time: number) => changeTime(time),
				skip: (step: number) => changeTime(time + step),
				rendition: (param: number) => changeRendition(param),
				buffering: (param: number) => setBuffer(param),
			},
		}),
		[playing, volume, time, muted, rendition, duration]
	);
	console.log(contextValue);
	return (
		<playerContext.Provider value={contextValue}>
			<article id={style.video_player} {...props} />
		</playerContext.Provider>
	);
}
function Player() {
	return (
		<div>
			<VideoElement />
		</div>
	);
}

export { PlayerContextProvider, usePlayerContext };
export default Player;
