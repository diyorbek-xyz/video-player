import { useEffect, useRef, useState } from 'react';
import { useVideoPlayer } from './hook';
import { CheckIcon, DownloadIcon, FullscreenExitIcon, FullscreenIcon, PauseIcon, PlayIcon, SettingIcon, VolumeIcon, VolumeOffIcon } from './icons';
import style from './index.module.css';
import { cn, formatQuality, player_config, timeFormatter } from './helpers';
import type { Level } from 'hls.js';
import rendition from './components/rendition.module.css';
import timeslider from './components/timeslider.module.css';
import volumeslider from './components/volumeslider.module.css';

/**
 * @params {string} src - Source link for video file. Example: video.m3u8 . Supported formats: hls - m3u8, normal - mp4
 * @params {string} poster - Source link for poster file that thumbnail of video. Example: poster.png
 * @params {string} preview - Source link for previews file for specific frames. Example: previews.vtt
 * @params {string} download - Source link for download file. Example: download.mp4
 * @example
 * import VideoPlayer from "video-player";
 *
 * <VideoPlayer src="video.m3u8" poster="poster.png" preview="previews.vtt" download="download.mp4">;
 */
function VideoPlayer({ src, poster, download }: { src: string; poster: string; download?: string }) {
	const { videoRef, state, actions } = useVideoPlayer(src);
	const [fullscreen, setFullscreen] = useState<boolean>(false);
	useEffect(() => {
		window.addEventListener('keydown', keyboard);
		const player = document.getElementById('player');
		const root = document.getElementById('player-root');
		if (player && root) {
			let timeout: number = setTimeout(() => root.classList.add(style.hidden), 3000);
			player.addEventListener('mousemove', () => {
				root.classList.remove(style.hidden);
				clearTimeout(timeout);
				if (state.playing) timeout = setTimeout(() => root.classList.add(style.hidden), 3000);
			});
		}
		return () => {
			window.removeEventListener('keydown', keyboard);
		};
	}, [state]);
	function toggleFullscreen() {
		const video_player = document.getElementById('player');
		if (document.fullscreenElement == video_player) {
			document.exitFullscreen();
			setFullscreen(false);
		} else {
			video_player?.requestFullscreen();
			setFullscreen(true);
		}
	}
	function skip(step: number) {
		actions.skip(step);
		const video_player = document.getElementById('player');
		if (!video_player) return console.error('video-player not found');

		const skip_view = document.createElement('div');
		skip_view.classList.add(style.skip_view);
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
	function keyboard(e: KeyboardEvent) {
		const allowed = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'f', 'm', ' '];
		if (!allowed.includes(e.key)) return;
		e.preventDefault();
		switch (e.key) {
			case 'ArrowRight':
				skip(5);
				break;
			case 'ArrowLeft':
				skip(-5);
				break;
			case 'ArrowUp':
				actions.changeVolume(Math.min(state.volume + 0.1, 1));
				break;
			case 'ArrowDown':
				actions.changeVolume(Math.max(state.volume - 0.1, 0));
				break;
			case 'f':
				toggleFullscreen();
				break;
			case 'm':
				actions.toggleMuted();
				break;
			case ' ':
				actions.togglePlay();
				break;
			default:
				break;
		}
	}
	return (
		<div id='player' className={style.video_player}>
			<video poster={poster} onClick={() => actions.togglePlay()} ref={videoRef}>
				{/* <track label='previews' kind='metadata' srcLang='en' src={previews} default /> */}
			</video>
			<div id='player-root' className={style.root}>
				<div id='player-infos' className={style.infos}>
					<h3>Blender Coorporation. Example animation</h3>
				</div>
				<div id='player-overlay' className={style.overlay}>
					<div onClick={() => actions.togglePlay()} className={cn(style.button, style.paused)} data-paused={!state.playing}>
						{state.playing ? <PauseIcon /> : <PlayIcon />}
					</div>
					<div className={style.buffering} hidden={!state.buffering}></div>
				</div>
				<div id='player-controls' className={style.controls}>
					<TimeSlider buffers={state.buffers} duration={state.duration} currentTime={state.currentTime} changeTime={(currentTime: number) => actions.seek(currentTime)} />
					<div id='player-volumes' className={style.volume}>
						<div className={cn(style.button, style.play)} data-tooltip='Play/Pause [Space]' onClick={() => actions.togglePlay()}>
							{state.playing ? <PauseIcon /> : <PlayIcon />}
						</div>
						<VolumeSlider changeVolume={actions.changeVolume} toggleMute={actions.toggleMuted} volume={state.volume} muted={state.muted} />
						<div className={style.time_display} data-tooltip='Time Display'>
							{timeFormatter(state.currentTime)} / {timeFormatter(state.duration)}
						</div>
					</div>
					<div id='player-other' className={style.others}>
						<a className={style.button} data-tooltip='Download' href={download ?? src}>
							<DownloadIcon />
						</a>
						<Rendition levels={state.levels} changeLevel={actions.changeLevel} level={state.currentLevel} />
						<div className={style.button} data-tooltip='Fullscreen [f]' onClick={toggleFullscreen}>
							{fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
function Rendition({ levels, level, changeLevel }: { levels: Level[]; level: number; changeLevel: (level: number) => void }) {
	const [open, setOpen] = useState<boolean>(false);
	console.log('aa');

	function changeResolution(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		if (levels?.[0]) {
			changeLevel(Number(e.currentTarget.dataset.value));
			setOpen(false);
		}
	}
	if (levels[0]) {
		return (
			<>
				<div className={rendition.rendition}>
					<button className={rendition.label} data-tooltip='Resolutions' onClick={() => setOpen(!open)}>
						<SettingIcon />
						<span className={rendition.badge}>{formatQuality(levels[level ?? player_config.resolution]?.height, 'name')}</span>
					</button>
					{open && (
						<div className={rendition.menu}>
							<div className={rendition.title}>
								<h3>Sifatni Tanlang</h3>
							</div>
							<div className={rendition.levels}>
								{levels.map((l, i) => (
									<button className={rendition.level} onClick={changeResolution} title={l.height.toString()} data-value={i} key={i}>
										{formatQuality(l.height)}
										{i === level && <CheckIcon />}
									</button>
								))}
								<button className={rendition.level} onClick={changeResolution} title='auto' data-value={-1}>
									Auto
									{-1 === level && <CheckIcon />}
								</button>
							</div>
						</div>
					)}
				</div>
				{open && <div style={{ position: 'fixed', inset: '0', zIndex: '11' }} onClick={() => setOpen(false)} />}
			</>
		);
	}
}
function TimeSlider({ changeTime, currentTime, duration, buffers }: { changeTime: (props: number) => void; previews?: string; duration: number; currentTime: number; buffers?: any }) {
	const timebarRef = useRef<HTMLDivElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);
	const [timePreview, setTimePreview] = useState<{ enabled: boolean; time: string; image?: string; position: number }>({ enabled: false, time: '', position: 0 });

	const handleClick = (clientX: number) => {
		if (!timebarRef.current) return;
		const rect = timebarRef.current.getBoundingClientRect();
		const newTime = Math.min(Math.max(((clientX - rect.left) / rect.width) * duration, 0), duration);
		changeTime(newTime);
	};
	const handleTimeDrag = (clientX: number, change: boolean) => {
		const preview_width = previewRef.current!.getBoundingClientRect().width;
		const rect = timebarRef.current!.getBoundingClientRect();
		const timeAtCursor = ((clientX - rect.left) / rect.width) * duration;

		if (timeAtCursor >= duration) return;
		if (timebarRef.current) {
			const hover = timebarRef.current.getElementsByClassName(timeslider.hover)?.item(0) as HTMLElement;
			hover.style.width = Math.max(Math.min((timeAtCursor * 100) / duration, duration), 0) + '%';
		}

		const position = Math.max(Math.min(clientX - 15 - preview_width / 2, rect.width - rect.left - preview_width), rect.left);

		setTimePreview({ enabled: true, position: position, time: timeFormatter(timeAtCursor), image: undefined });
		if (change) handleClick(clientX);
	};
	const handleTimeTouch = (e: React.TouchEvent<HTMLDivElement>) => handleTimeDrag(e.touches[0].clientX, true);
	const exitTimePreview = () => setTimePreview({ ...timePreview, enabled: false });

	return (
		<div
			ref={timebarRef}
			id='player-timerange'
			className={timeslider.time_bar}
			data-tooltip='Skip 5 [ArrowLeft/ArowRight]'
			onClick={(e) => handleClick(e.clientX)}
			onTouchMove={handleTimeTouch}
			onMouseLeave={exitTimePreview}
			onMouseUp={exitTimePreview}
			onMouseMove={(e) => handleTimeDrag(e.clientX, e.buttons === 1)}>
			<div className={timeslider.range}>
				<div className={timeslider.thumb} style={{ left: `${(currentTime * 100) / duration}%` }} />
				<div className={timeslider.fill} style={{ width: `${(currentTime * 100) / duration}%` }} />
				<div className={timeslider.hover} />
				{buffers && (
					<div className={timeslider.buffers}>
						{buffers?.[0] ? (
							buffers?.map(({ start, end }: any, i: number) => <div key={i} className={timeslider.buffered} style={{ width: `${((end - start) * 100) / duration}%`, left: `${(start * 100) / duration}%` }} />)
						) : (
							<div className={timeslider.buffered} style={{ width: `${((buffers.end - buffers.start) * 100) / duration}%`, left: `${(buffers.start * 100) / duration}%` }} />
						)}
					</div>
				)}
			</div>
			<div ref={previewRef} className={timeslider.preview_root} style={{ left: timePreview.position }}>
				<div id='preview' hidden={!timePreview.enabled} className={timeslider.preview} data-image={!timePreview.image}>
					{!timePreview.image && <img className={timeslider.preview_image} src='/poster.png' />}
					<h1 className={timeslider.preview_time}>{timePreview.time}</h1>
				</div>
			</div>
		</div>
	);
}
function VolumeSlider({ toggleMute, changeVolume, muted, volume }: { toggleMute: () => void; changeVolume: (volume: number) => void; muted: boolean; volume: number }) {
	const barRef = useRef<HTMLDivElement>(null);

	function handle(e: React.MouseEvent<HTMLDivElement>) {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		console.log(Number(((e.clientX - rect.left) / rect.width).toFixed(1)));

		changeVolume(Math.min(Math.max(Number(((e.clientX - rect.left) / rect.width).toFixed(1)), 0), 1));
	}
	return (
		<div className={volumeslider.volume}>
			<div onClick={() => toggleMute()} className={volumeslider.button} data-tooltip='Volume [m]'>
				{muted || volume === 0 ? <VolumeOffIcon /> : <VolumeIcon />}
			</div>

			<div
				ref={barRef}
				className={volumeslider.range}
				onClick={handle}
				data-tooltip='Volume [ArowDown/ArrowUp]'
				onMouseMove={(e) => {
					if (e.buttons === 1) handle(e);
				}}>
				<div className={volumeslider.track} />
				<div className={volumeslider.fill} style={{ width: `${volume * 100}%` }} />
				<div className={volumeslider.thumb} style={{ left: `${volume * 100}%` }} />
			</div>
		</div>
	);
}
export default VideoPlayer;