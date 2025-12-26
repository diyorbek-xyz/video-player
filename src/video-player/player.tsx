import { useEffect, useState } from 'react';
import Rendition from './components/rendition';
import TimeSlider from './components/timeslider';
import { useVideoPlayer } from './hook';
import { DownloadIcon, FullscreenExitIcon, FullscreenIcon, PauseIcon, PlayIcon } from './icons';
import style from './index.module.css';
import { cn, timeFormatter } from './helpers';
import VolumeSlider from './components/volumeslider';

export default function VideoPlayer({ src, poster, download }: { src: string; poster: string; download?: string }) {
	const { videoRef, state, actions } = useVideoPlayer(src);
	const [fullscreen, setFullscreen] = useState<boolean>(false);
	useEffect(() => {
		window.addEventListener('keydown', keyboard);
		const player = document.getElementById('player');
		const root = document.getElementById('player-root');
		if (player&&root) {
			let timeout: number;
			player.addEventListener('mousemove', () => {
				root.classList.remove(style.hidden);
				clearTimeout(timeout);
				timeout = setTimeout(() => root.classList.add(style.hidden), 2000);
			});
		}
		return () => {
			window.removeEventListener('keydown', keyboard);
		};
	}, [state]);

	function toggleFullscreen() {
		const video_player = document.getElementById('video-player');
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
		const video_player = document.getElementById('video-player');
		if (!video_player) return console.error('video-player not found');

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
	function keyboard(e: KeyboardEvent) {
		const allowed = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'f', ' '];
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
				<div id='player-overlay' className={style.sections_overlay}></div>
				<div id='player-controls' hidden={false} className={style.controls_bottom}>
					<TimeSlider buffers={state.buffers} duration={state.duration} currentTime={state.currentTime} changeTime={(currentTime: number) => actions.seek(currentTime)} />
					<div id='player-volumes' className={style.sections_volume}>
						<div onClick={() => actions.togglePlay()} className={cn(style.button, style.play)}>
							{state.playing ? <PauseIcon /> : <PlayIcon />}
						</div>
						<VolumeSlider changeVolume={actions.changeVolume} toggleMute={actions.toggleMuted} volume={state.volume} muted={state.muted} />
						<div className={style.time_display}>
							{timeFormatter(state.currentTime)} / {timeFormatter(state.duration)}
						</div>
					</div>
					<div id='player-other' className={style.sections_others}>
						<a className={style.button} href={download ?? src}>
							<DownloadIcon />
						</a>
						<Rendition levels={state.levels} changeLevel={actions.changeLevel} level={state.currentLevel} />
						<div className={style.button} onClick={toggleFullscreen}>
							{fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
