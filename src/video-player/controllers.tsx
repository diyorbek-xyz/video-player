import { useEffect, useRef, useState } from 'react';
import { CheckIcon, DownloadIcon, FullscreenExitIcon, FullscreenIcon, PauseIcon, PlayIcon, SettingIcon, VolumeIcon, VolumeOffIcon } from './icons';
import style from './index.module.css';
import { usePlayerContext } from './player';

const player_config = JSON.parse(localStorage.getItem('player_config') || '0') as {
	muted: boolean;
	volume: number;
	resolution: number;
};

async function loadPreviews(url: string) {
	const res = await fetch(url);
	const text = await res.text();

	const cues: Array<{ start: number; end: number; image: string }> = [];
	const cueBlocks = text.trim().split('\n\n');

	cueBlocks.forEach((block) => {
		const lines = block.split('\n');
		if (lines.length >= 2) {
			const time = lines[0].split(' --> ');
			const start = parseTime(time[0]);
			const end = parseTime(time[1]);
			const image = lines[1];
			cues.push({ start, end, image });
		}
	});

	return cues;
}
function timeFormatter(params: number) {
	return Math.floor(params / 60) + ':' + ('0' + Math.floor(params % 60)).slice(-2);
}
function parseTime(t: string) {
	const [hms, ms] = t.split('.');
	const [h, m, s] = hms.split(':').map(Number);
	return h * 3600 + m * 60 + s + (ms ? parseInt(ms) / 1000 : 0);
}
// let timeout: number;
// function auto_hide() {
// 	const controls = document.getElementById('player-controls');
// 	if (!controls) return;
// 	controls.hidden = false;
// 	clearTimeout(timeout);
// 	timeout = setTimeout(() => (controls.hidden = true), 1000);
// }

const TimeRange = () => {
	const {
		source: { previews },
		controller,
		state,
	} = usePlayerContext();

	const barRef = useRef<HTMLDivElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);
	const [preview, setPreview] = useState<{ enabled: boolean; time: string; image?: string; position: string }>({ enabled: false, time: '', position: '' });
	const [previewsData, setPreviewsData] = useState<Array<{ start: number; end: number; image?: string }>>();
	const [hover, setHover] = useState<number>(0);

	useEffect(() => {
		loadPreviews(previews!).then(setPreviewsData);
	}, [previews]);

	const handleClick = (clientX: number) => {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		const newTime = Math.min(Math.max(((clientX - rect.left) / rect.width) * state.duration, 0), state.duration);
		controller.seek(newTime);
	};

	const handleDrag = (clientX: number, change: boolean) => {
		const preview_width = previewRef.current!.getBoundingClientRect().width;
		const rect = barRef.current!.getBoundingClientRect();
		const timeAtCursor = ((clientX - rect.left) / rect.width) * state.duration;
		setHover(timeAtCursor);
		if (previewsData) {
			const cue = previewsData.find((c) => timeAtCursor >= c.start && timeAtCursor <= c.end);
			setPreview(cue ? { enabled: true, image: cue.image, position: `${Math.max(Math.min(clientX - preview_width / 2, rect.right - preview_width), 5)}px`, time: timeFormatter(timeAtCursor) } : { ...preview, enabled: false });
		} else setPreview({ enabled: true, position: `${Math.max(Math.min(clientX - preview_width / 2, rect.right - preview_width), 5)}px`, time: timeFormatter(timeAtCursor), image: '' });
		if (change) handleClick(clientX);
	};
	const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => handleDrag(e.touches[0].clientX, true);
	const exitPreview = () => setPreview({ ...preview, enabled: false });

	return (
		<>
			<div ref={barRef} className={style.time_range_bar} onClick={(e) => handleClick(e.clientX)} onTouchMove={handleTouch} onTouchEnd={() => exitPreview()} onMouseMove={(e) => handleDrag(e.clientX, e.buttons === 1)} onMouseUp={() => exitPreview()} onMouseLeave={() => exitPreview()}>
				<div className={style.time_range_range}>
					<div className={style.time_range_thumb} style={{ left: `${(state.time * 100) / state.duration}%` }} />
					<div className={style.time_range_fill} style={{ width: `${(state.time * 100) / state.duration}%` }} />
					<div className={style.time_range_hover} style={{ width: `${(hover * 100) / state.duration}%` }} />
					{state.buffered.map(({ start, end }, i) => (
						<div key={i} className={style.time_range_buffered} style={{ width: `${((end - start) * 100) / state.duration}%`, left: `${(start * 100) / state.duration}%` }} />
					))}
				</div>
			</div>
			<div ref={previewRef} hidden={!preview.enabled} id='preview' className={style.time_range_preview} data-image={!!preview.image} style={{ left: preview.position }}>
				{preview.image && <img className={style.time_range_preview_image} src={preview.image} />}
				<h1 className={style.time_range_preview_time}>{preview.time}</h1>
			</div>
		</>
	);
};

const Resolutions = () => {
	const { controller, state } = usePlayerContext();
	const [open, setOpen] = useState<boolean>(false);

	function changeResolution(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		if (state.resolutions) {
			localStorage.setItem('player_config', JSON.stringify({ ...player_config, resolution: Number(e.currentTarget.dataset.value) }));
			controller.rendition(Number(e.currentTarget.dataset.value ?? -1));
			setOpen(false);
		}
	}
	function formatQuality(height: number, type?: 'text' | 'name') {
		switch (height) {
			case 1080:
				if (type == 'name') return 'FHD';
				return '1080p';
			case 720:
				if (type == 'name') return 'HD';
				return '720p';
			case 480:
				if (type == 'name') return 'SD';
				return '480p';
			case 360:
				return '240p';
			case 240:
				return '240p';
			default:
				return 'Auto';
		}
	}
	return (
		<>
			<div className={style.rendition_root}>
				<button onClick={() => setOpen(!open)} className={style.global_player_button + ' ' + style.rendition_label}>
					<SettingIcon />
					<span className={style.badge}>{formatQuality(state.resolutions[state.rendition]?.height, 'name')}</span>
				</button>
				{open && (
					<div className={style.rendition_select}>
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
			<button className={style.global_player_button + ' ' + style.global_paused} onClick={() => play()}>
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
		<div onClick={() => play()} className={style.global_player_button + ' ' + style.play}>
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
	return (
		<div className={style.global_volume_controls}>
			<Mute />
			<VolumeRange />
		</div>
	);
};
const TimeView = () => {
	const state = usePlayerContext().state;

	return (
		<div className={style.global_time_view}>
			{timeFormatter(state.time)} / {timeFormatter(state.duration)}
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
			<div className={style.barrier_item + ' ' + style.left}></div>
			<div className={style.barrier_item + ' ' + style.top}></div>
			<div className={style.barrier_item + ' ' + style.right}></div>
		</div>
	);
}

function SkipMobile() {
	const { skip } = usePlayerContext().controller;
	let count = 0;
	let timeout = 0;
	function touch(step: number) {
		count++;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			count = 0;
		}, 200);
		if (count >= 2) skip(step);
	}
	return (
		<div className={style.skip_container}>
			<div onTouchStart={() => touch(-5)} onDoubleClick={() => skip(-5)} className={style.skip_item + ' ' + style.left}></div>
			<div onTouchStart={() => touch(5)} className={style.skip_item + ' ' + style.right}></div>
		</div>
	);
}

export { TimeRange, PlayPause, Mute, VolumeControls, Barrier, Status, TimeView, Download, Fullscreen, Resolutions, SkipMobile };
