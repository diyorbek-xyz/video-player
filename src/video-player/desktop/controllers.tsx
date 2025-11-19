import React, { useRef, useState } from 'react';
import { CheckIcon, DownloadIcon, FullscreenExitIcon, FullscreenIcon, PauseIcon, PlayIcon, SettingIcon, VolumeIcon, VolumeOffIcon } from '../icons';
import style from './index.module.css';
import { usePlayerContext } from '../context';
import { cn, CueTextToImage, formatQuality, player_config, timeFormatter } from '../helpers';

const TimeRange = () => {
	const {
		source: { previewsData },
		controller,
		state,
	} = usePlayerContext();

	const barRef = useRef<HTMLDivElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);
	const [preview, setPreview] = useState<{ enabled: boolean; time: string; image?: { src: string; x: number; y: number; width: number; height: number }; position: string }>({ enabled: false, time: '', position: '' });
	const [hover, setHover] = useState<number>(0);

	const handleClick = (clientX: number) => {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		const newTime = Math.min(Math.max(((clientX - rect.left) / rect.width) * state.duration, 0), state.duration);
		controller.seek(newTime);
	};

	const handleDrag = (clientX: number, change: boolean) => {
		state.hls.pauseBuffering();
		const preview_width = previewRef.current!.getBoundingClientRect().width;
		const rect = barRef.current!.getBoundingClientRect();
		const timeAtCursor = ((clientX - rect.left) / rect.width) * state.duration;

		if (timeAtCursor >= state.duration) return;
		setHover(Math.max(Math.min((timeAtCursor * 100) / state.duration, 100), 0));

		const position = `${Math.max(Math.min(clientX - preview_width / 2, rect.width - rect.left - preview_width - 80), rect.left + 80)}px`;
		if (previewsData) {
			const cue = previewsData.find((c) => timeAtCursor >= c.startTime && timeAtCursor <= c.endTime);
			setPreview(cue ? { enabled: true, image: CueTextToImage(cue.text), position: position, time: timeFormatter(timeAtCursor) } : { ...preview, enabled: false });
		} else setPreview({ enabled: true, position: position, time: timeFormatter(timeAtCursor), image: undefined });
		if (change) handleClick(clientX);
	};
	const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => handleDrag(e.touches[0].clientX, true);
	const exitPreview = () => {
		state.hls.resumeBuffering();
		setPreview({ ...preview, enabled: false });
	};

	return (
		<>
			<div ref={barRef} className={style.time_range_bar} onClick={(e) => handleClick(e.clientX)} onTouchMove={handleTouch} onTouchEnd={() => exitPreview()} onMouseMove={(e) => handleDrag(e.clientX, e.buttons === 1)} onMouseUp={() => exitPreview()} onMouseLeave={() => exitPreview()}>
				<div className={style.time_range_range}>
					<div className={style.time_range_thumb} style={{ left: `${(state.time * 100) / state.duration}%` }} />
					<div className={style.time_range_fill} style={{ width: `${(state.time * 100) / state.duration}%` }} />
					<div className={style.time_range_hover} style={{ width: `${hover}%` }} />
					{state.buffered.map(({ start, end }, i) => (
						<div key={i} className={style.time_range_buffered} style={{ width: `${((end - start) * 100) / state.duration}%`, left: `${(start * 100) / state.duration}%` }} />
					))}
				</div>
				<div ref={previewRef} hidden={!preview.enabled} id='preview' className={style.time_range_preview} data-image={!!preview.image?.src} style={{ left: preview.position }}>
					{preview.image && <img className={style.time_range_preview_image} src={'/GGG/' + preview.image.src} style={{ width: preview.image.width, height: preview.image.height, objectPosition: `-${preview.image?.x}px -${preview.image?.y}px` }} />}
					<h1 className={style.time_range_preview_time}>{preview.time}</h1>
				</div>
			</div>
		</>
	);
};

const ResolutionsButton = (props: React.ComponentProps<'button'>) => {
	const { state } = usePlayerContext();
	return (
		<button className={cn(style.global_player_button, style.rendition_label)} {...props}>
			<SettingIcon />
			<span className={style.badge}>{formatQuality(state.resolutions[state.rendition ?? player_config.resolution]?.height, 'name')}</span>
		</button>
	);
};

const Resolutions = () => {
	const { controller, state } = usePlayerContext();
	const [open, setOpen] = useState<boolean>(false);
	if (!state.resolutions[0]) return;
	function changeResolution(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		if (state.resolutions) {
			localStorage.setItem('player_config', JSON.stringify({ ...player_config, resolution: Number(e.currentTarget.dataset.value ?? -1) }));
			controller.rendition(Number(e.currentTarget.dataset.value ?? -1));
			setOpen(false);
		}
	}

	return (
		<>
			<div className={style.rendition_root}>
				<ResolutionsButton onClick={() => setOpen(!open)} />
				{open && (
					<div data-mobile={state.width < 500} className={style.rendition_select}>
						<button className={style.rendition_option} onClick={(e) => changeResolution(e)} title='auto' data-value={-1}>
							Auto
						</button>
						{state.resolutions?.map((l, i) => (
							<button className={style.rendition_option} onClick={(e) => changeResolution(e)} title={l.height.toString()} data-value={i} key={i}>
								{formatQuality(l.height)}
								{i === state.rendition && <CheckIcon />}
							</button>
						))}
					</div>
				)}
			</div>
			{open && <div style={{ position: 'absolute', inset: '0', zIndex: '1' }} onClick={() => setOpen(false)} />}
		</>
	);
};

const VolumeRange = () => {
	const {
		state,
		controller: { volume },
	} = usePlayerContext();

	const barRef = useRef<HTMLDivElement>(null);
	const handle = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		volume((e.clientX - rect.left) / rect.width);
	};
	return (
		<div
			ref={barRef}
			className={style.volume_range_bar}
			onClick={handle}
			onMouseMove={(e) => {
				if (e.buttons === 1) handle(e);
			}}>
			<div className={style.volume_range_track} />
			<div className={style.volume_range_fill} style={{ width: `${state.volume * 100}%` }} />
			<div className={style.volume_range_thumb} style={{ left: `${state.volume * 100}%` }} />
		</div>
	);
};
const Status = () => {
	const {
		controller: { play },
		state,
	} = usePlayerContext();

	if (state.playing) {
		return (
			<button className={cn(style.global_player_button, style.global_paused)} onClick={() => play()}>
				<PlayIcon />
			</button>
		);
	} else if (state.buffering) {
		return (
			<div className={style.buffering_container}>
				<div className={style.cube}>
					<div className={style.cube__inner}></div>
				</div>
				<div className={style.cube}>
					<div className={style.cube__inner}></div>
				</div>
				<div className={style.cube}>
					<div className={style.cube__inner}></div>
				</div>
			</div>
		);
	}
	return null;
};
const PlayPause = () => {
	const {
		controller: { play },
		state,
	} = usePlayerContext();

	return (
		<div onClick={() => play()} className={cn(style.global_player_button, style.play)}>
			{state.playing ? <PlayIcon /> : <PauseIcon />}
		</div>
	);
};
const Mute = () => {
	const {
		controller: { mute },
		state,
	} = usePlayerContext();

	return (
		<div onClick={() => mute()} className={style.global_player_button}>
			{state.muted || state.volume === 0 ? <VolumeOffIcon /> : <VolumeIcon />}
		</div>
	);
};
const VolumeControls = () => {
	const width = usePlayerContext().state.width;
	if (width >= 460)
		return (
			<div className={style.global_volume_controls}>
				<Mute />
				<VolumeRange />
			</div>
		);
};
const TimeView = () => {
	const { time, duration } = usePlayerContext().state;
	return (
		<div className={style.global_time_view}>
			{timeFormatter(time)} / {timeFormatter(duration)}
		</div>
	);
};
const Download = () => {
	const { baseUrl, download } = usePlayerContext().source;
	if (!download) return null;
	return (
		<a className={style.global_player_button} href={baseUrl + download}>
			<DownloadIcon />
		</a>
	);
};
const Fullscreen = () => {
	const { controller, state } = usePlayerContext();
	return (
		<div className={style.global_player_button} onClick={controller.fullscreen}>
			{state.fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
		</div>
	);
};

function Barrier() {
	return (
		<div className={style.barrier_container}>
			<div className={cn(style.barrier_item, style.left)}></div>
			<div className={cn(style.barrier_item, style.top)}></div>
			<div className={cn(style.barrier_item, style.right)}></div>
		</div>
	);
}
function VideoElement({ ...props }: React.ComponentProps<'video'>) {
	const {
		source: { poster, baseUrl, id, previews },
		controller: { play },
	} = usePlayerContext();
	return (
		<video id={'video-' + id} poster={baseUrl + poster} onClick={() => play()} {...props}>
			<track label='previews' kind='metadata' srcLang='en' src={previews} default />
		</video>
	);
}

export { VideoElement, ResolutionsButton, TimeRange, PlayPause, Mute, VolumeControls, Barrier, Status, TimeView, Download, Fullscreen, Resolutions };
