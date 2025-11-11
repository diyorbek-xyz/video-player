import { useEffect, useRef, useState } from 'react';
import { loadPreviews, timeFormatter, auto_hide } from './player_helpers';
import { CheckIcon, DownloadIcon, FullscreenExitIcon, FullscreenIcon, PauseIcon, PlayIcon, SettingIcon, VolumeIcon, VolumeOffIcon } from './icons';
import { useVideoPlayerContext } from './video_player';
import style from './index.module.css';

const TimeRange = () => {
	const {
		video: { state, controls, hls },
		sources: { previews },
	} = useVideoPlayerContext();

	const barRef = useRef<HTMLDivElement>(null);
	const [preview, setPreview] = useState({ enabled: false, time: '', image: '', position: '' });
	const [previewsData, setPreviewsData] = useState<Array<{ start: number; end: number; image: string }>>();
	const [time, setTime] = useState(state.time);

	useEffect(() => {
		if (previews) loadPreviews(previews).then(setPreviewsData);
	}, [previews]);
	useEffect(() => setTime(state.time), [state]);

	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		const newTime = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * state.duration, 0), state.duration);
		setTime(newTime);
		controls.seek(newTime);
	};

	const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = barRef.current!.getBoundingClientRect();
		const timeAtCursor = ((e.clientX - rect.left) / rect.width) * state.duration;
		if (previewsData) {
			const cue = previewsData.find((c) => timeAtCursor >= c.start && timeAtCursor <= c.end);

			setPreview(cue ? { enabled: true, image: cue.image, position: `${Math.max(Math.min(e.clientX - 130, rect.right - 260), 5)}px`, time: timeFormatter(timeAtCursor) } : { ...preview, enabled: false });
		} else {
			setPreview({ enabled: true, position: `${Math.max(Math.min(e.clientX - 130, rect.right - 260), 5)}px`, time: timeFormatter(timeAtCursor), image: '' });
		}
		auto_hide();
		if (e.buttons === 1) handleClick(e);
	};

	return (
		<>
			<div ref={barRef} className={style.time_range_bar} onClick={handleClick} onMouseMove={handleDrag} onMouseUp={() => setPreview({ ...preview, enabled: false })} onMouseLeave={() => setPreview({ ...preview, enabled: false })}>
				<div className={style.time_range_range}>
					<div className={style.time_range_thumb} style={{ left: `${(time * 100) / state.duration}%` }} />
					<div className={style.time_range_fill} style={{ width: `${(time * 100) / state.duration}%` }} />
					{hls?.mainForwardBufferInfo && <div className={style.time_range_buffered} style={{ width: `${(hls.mainForwardBufferInfo.end * 100) / state.duration}%` }} />}
				</div>
			</div>
			{preview.enabled && (
				<div className={style.time_range_preview} style={{ left: preview.position }}>
					{previews && <img className={style.time_range_preview_image} src={preview.image} />}
					<h1 className={style.time_range_preview_time}>{preview.time}</h1>
				</div>
			)}
		</>
	);
};

const PlayPause = () => {
	const {
		controllers: { play },
		video: { state },
	} = useVideoPlayerContext();

	return (
		<div onClick={() => play()} className={style.global_player_button + ' ' + style.play}>
			{state.paused ? <PlayIcon /> : <PauseIcon />}
		</div>
	);
};
const Mute = () => {
	const {
		controllers: { mute },
		video: { state },
	} = useVideoPlayerContext();

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
const VolumeRange = () => {
	const { state, controls } = useVideoPlayerContext().video;

	const barRef = useRef<HTMLDivElement>(null);
	const handle = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		controls.volume(Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1));
	};
	return (
		<div
			ref={barRef}
			className={style.volume_range_bar}
			onClick={handle}
			onMouseMove={(e) => {
				if (e.buttons === 1) handle(e);
			}}>
			<div className={style.volume_range_fill} style={{ width: `${state.volume * 100}%` }} />
			<div className={style.volume_range_thumb} style={{ left: `${state.volume * 100}%` }} />
		</div>
	);
};
const Status = () => {
	const {
		controllers: { play },
		video: { state },
	} = useVideoPlayerContext();

	if (state.paused) {
		return (
			<button className={style.global_player_button + ' ' + style.global_paused} onClick={() => play()}>
				<PlayIcon />
			</button>
		);
	} else if (state.buffering) {
		return <div className={style.global_buffering}>Buffering...</div>;
	}
	return null;
};
const TimeView = () => {
	const state = useVideoPlayerContext().video.state;

	return (
		<div className={style.global_time_view}>
			{timeFormatter(state.time)} / {timeFormatter(state.duration)}
		</div>
	);
};
const Download = () => {
	const { baseUrl, download } = useVideoPlayerContext().sources;
	if (!download) return null;
	return (
		<a className={style.global_player_button} href={baseUrl + download}>
			<DownloadIcon />
		</a>
	);
};
const Fullscreen = () => {
	const { controllers, video } = useVideoPlayerContext();
	return (
		<div className={style.global_player_button} onClick={controllers.fullscreen}>
			{video.fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
		</div>
	);
};
const Resolutions = () => {
	const { hls, player_config, controls, state } = useVideoPlayerContext().video;
	const [level, setLevel] = useState<number>();
	const [open, setOpen] = useState<boolean>(false);

	if (!hls) return null;
	function changeResolution(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
		if (hls?.levels) {
			localStorage.setItem('player_config', JSON.stringify({ ...player_config, resolution: Number(e.currentTarget.dataset.value) }));
			setLevel(Number(e.currentTarget.title));
			hls.currentLevel = Number(e.currentTarget.dataset.value);
			controls.seek(state.time);
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
				<div onClick={() => setOpen(!open)} className={style.global_player_button + ' ' + style.rendition_label}>
					<SettingIcon />
					<span className={style.badge}>{formatQuality(level ?? hls.levels[hls.currentLevel]?.height, 'name')}</span>
				</div>
				{open && (
					<div className={style.rendition_select}>
						<div className={style.rendition_option} onClick={(e) => changeResolution(e)} title='auto' data-value={-1}>
							Auto
						</div>
						{hls.levels.map((l, i) => (
							<div className={style.rendition_option} onClick={(e) => changeResolution(e)} title={l.height.toString()} data-value={i} key={i}>
								{formatQuality(l.height)}
								{i === hls.currentLevel && <CheckIcon />}
							</div>
						))}
					</div>
				)}
			</div>
			{open && <div style={{ position: 'absolute', inset: '0', zIndex: '1' }} onClick={() => setOpen(false)} />}
		</>
	);
};

export { TimeRange, PlayPause, Mute, VolumeControls, Status, TimeView, Download, Fullscreen, Resolutions };
