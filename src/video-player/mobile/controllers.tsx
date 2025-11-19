import { useRef, useState } from 'react';
import { usePlayerContext } from '../context';
import style from './index.module.css';
import { cn, formatQuality, player_config, timeFormatter } from '../helpers';
import { CheckIcon, DownloadIcon, FullscreenExitIcon, FullscreenIcon, PauseIcon, PlayIcon, SettingIcon, VolumeIcon, VolumeOffIcon } from '../icons';

function RenditionButton() {
	const { controller, state } = usePlayerContext();
	if (!state.resolutions[0]) return;

	return (
		<button className={cn(style.rendition_button, style.player_button, style.ghost)} onClick={() => controller.openRenditionMenu()}>
			<SettingIcon />
			<span className={style.badge}>{formatQuality(state.resolutions[state.rendition ?? player_config.resolution]?.height, 'name')}</span>
		</button>
	);
}

function RenditionMenu() {
	const { controller, state } = usePlayerContext();
	function changeResolution(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		if (state.resolutions) {
			localStorage.setItem('player_config', JSON.stringify({ ...player_config, resolution: Number(e.currentTarget.dataset.value ?? -1) }));
			controller.rendition(Number(e.currentTarget.dataset.value ?? -1));
			controller.openRenditionMenu(false);
		}
	}

	if (state.renditionMenu) {
		return (
			<>
				<div className={style.rendition_select}>
					<h1 className={style.rendition_label}>Quality</h1>
					<button className={style.rendition_option} onClick={(e) => changeResolution(e)} title='auto' data-current={-1 === state.rendition} data-value={-1}>
						Auto
						{-1 === state.rendition && <CheckIcon />}
					</button>
					{state.resolutions?.map((l, i) => (
						<button className={style.rendition_option} onClick={(e) => changeResolution(e)} title={l.height.toString()} data-current={i === state.rendition} data-value={i} key={i}>
							{formatQuality(l.height)}
							{i === state.rendition && <CheckIcon />}
						</button>
					))}
				</div>
				{state.renditionMenu && <div style={{ position: 'fixed', pointerEvents: 'visibleStroke', inset: '0', zIndex: '998', backgroundColor: '#00000099' }} onClick={() => controller.openRenditionMenu(false)} />}
			</>
		);
	}
}
function VideoElement({ ...props }: React.ComponentProps<'video'>) {
	const { poster, baseUrl, id } = usePlayerContext().source;
	return <video id={'video-' + id} poster={baseUrl + poster} {...props} />;
}

function TimeRange() {
	const {
		source: { previewsData },
		controller,
		state,
	} = usePlayerContext();

	const barRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<number>(0);

	const handleClick = (clientX: number) => {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		const newTime = Math.min(Math.max(((clientX - rect.left) / rect.width) * state.duration, 0), state.duration);
		controller.seek(newTime);
	};

	const handleDrag = (clientX: number, change: boolean) => {
		state.hls.pauseBuffering();
		const rect = barRef.current!.getBoundingClientRect();
		const timeAtCursor = Math.min(Math.max(((clientX - rect.left) / rect.width) * state.duration, 0), state.duration);

		if (timeAtCursor >= state.duration) return;
		setHover(Math.max(Math.min((timeAtCursor * 100) / state.duration, 100), 0));
		if (previewsData) {
			const cue = previewsData.find((c) => timeAtCursor >= c.start && timeAtCursor <= c.end);
			controller.previewing(cue ? { enabled: true, image: cue.image, time: timeFormatter(timeAtCursor) } : { ...state.preview, enabled: false });
		} else controller.previewing({ enabled: true, time: timeFormatter(timeAtCursor), image: undefined });
		if (change) handleClick(clientX);
	};
	const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => handleDrag(e.touches[0].clientX, true);
	const exitPreview = () => {
		state.hls.resumeBuffering();
		controller.previewing({ ...state.preview, enabled: false });
	};

	return (
		<div ref={barRef} className={style.time_range_bar} onClick={(e) => handleClick(e.clientX)} onTouchMove={handleTouch} onTouchEnd={() => exitPreview()} onMouseMove={(e) => handleDrag(e.clientX, e.buttons === 1)} onMouseUp={() => exitPreview()} onMouseLeave={() => exitPreview()}>
			<div className={style.range}>
				<div className={style.thumb} style={{ left: `${(state.time * 100) / state.duration}%` }} />
				<div className={style.fill} style={{ width: `${(state.time * 100) / state.duration}%` }} />
				<div className={style.hover} style={{ width: `${hover}%` }} />
				{state.buffered.map(({ start, end }, i) => (
					<div key={i} className={style.buffered} style={{ width: `${((end - start) * 100) / state.duration}%`, left: `${(start * 100) / state.duration}%` }} />
				))}
			</div>
		</div>
	);
}
function PreviewData() {
	const { preview } = usePlayerContext().state;

	return (
		<div hidden={!preview?.enabled} id='preview' className={style.preview}>
			<img className={style.image} src={preview?.image} />
			<h1 className={style.time}>{preview?.time}</h1>
		</div>
	);
}

function TimeView() {
	const { time, duration } = usePlayerContext().state;
	return (
		<div className={style.time_view}>
			{timeFormatter(time)} / {timeFormatter(duration)}
		</div>
	);
}

function Download() {
	const { baseUrl, download } = usePlayerContext().source;
	if (!download) return null;
	return (
		<a className={cn(style.player_button, style.ghost)} href={baseUrl + download}>
			<DownloadIcon />
		</a>
	);
}
function Fullscreen() {
	const { controller, state } = usePlayerContext();
	return (
		<div className={style.player_button} onClick={controller.fullscreen}>
			{state.fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
		</div>
	);
}
const Status = () => {
	const {
		controller: { play },
		state,
	} = usePlayerContext();
	if (state.buffering) {
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
	if (state.hidden) return;
	return (
		<button className={cn(style.player_button, style.paused)} onClick={() => play()}>
			{state.playing ? <PlayIcon /> : <PauseIcon />}
		</button>
	);
};

function Mute() {
	const {
		controller: { mute },
		state,
	} = usePlayerContext();

	return (
		<div onClick={() => mute()} className={cn(style.player_button, style.ghost)}>
			{state.muted || state.volume === 0 ? <VolumeOffIcon /> : <VolumeIcon />}
		</div>
	);
}
function VolumeRange() {
	const {
		state,
		controller: { volume },
	} = usePlayerContext();

	const barRef = useRef<HTMLDivElement>(null);
	const handle = (e: React.TouchEvent<HTMLDivElement>) => {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		volume((e.touches[0].clientX - rect.left) / rect.width);
	};
	return (
		<div ref={barRef} className={style.volume_range} onTouchMove={(e) => handle(e)}>
			<div className={style.volume_range_track} />
			<div className={style.volume_range_fill} style={{ width: `${state.volume * 100}%` }} />
			<div className={style.volume_range_thumb} style={{ left: `${state.volume * 100}%` }} />
		</div>
	);
}
function SkipMobile() {
	const { skip, hide } = usePlayerContext().controller;
	const [count, setCount] = useState<number>(0);
	const [time, setTime] = useState<number>();
	function touch(step: number) {
		setCount(count + 1);
		clearTimeout(time);
		setTime(setTimeout(() => setCount(0), 250));
		if (count >= 1) {
			skip(step);
		} else hide();
	}

	return (
		<div className={style.skip_container}>
			<div onTouchStart={() => touch(-5)} onDoubleClick={() => skip(-5)} className={cn(style.skip_item, style.left)}></div>
			<div onTouchStart={() => touch(5)} className={cn(style.skip_item, style.right)}></div>
		</div>
	);
}
export { SkipMobile, VideoElement, RenditionButton, RenditionMenu, TimeRange, PreviewData, TimeView, Fullscreen, Download, Status, Mute, VolumeRange };
