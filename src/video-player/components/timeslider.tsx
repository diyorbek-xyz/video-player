import { useRef, useState } from 'react';
import style from './timeslider.module.css';

function CueTextToImage(text: string) {
	const [src, parameter] = text.split('#');
	const [positionX, positionY, width, height] = parameter.split('=')[1].split(',');

	return {
		src,
		x: parseInt(positionX),
		y: parseInt(positionY),
		width: parseInt(width),
		height: parseInt(height),
	};
}
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
function parseTime(t: string) {
	const [hms, ms] = t.split('.');
	const [h, m, s] = hms.split(':').map(Number);
	return h * 3600 + m * 60 + s + (ms ? parseInt(ms) / 1000 : 0);
}

function timeFormatter(params: number) {
	return Math.floor(params / 60) + ':' + ('0' + Math.floor(params % 60)).slice(-2);
}
export default function TimeSlider({ changeTime, currentTime, duration, previews, buffers }: { changeTime: (props: number) => void; previews?: string; duration: number; currentTime: number; buffers?: any }) {
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
			const hover = timebarRef.current.getElementsByClassName(style.hover)?.item(0) as HTMLElement;
			hover.style.width = Math.max(Math.min((timeAtCursor * 100) / duration, duration), 0) + '%';
		}

		const position = Math.max(Math.min(clientX - 15 - preview_width / 2, rect.width - rect.left - preview_width), rect.left);

		setTimePreview({ enabled: true, position: position, time: timeFormatter(timeAtCursor), image: undefined });
		if (change) handleClick(clientX);
	};
	const handleTimeTouch = (e: React.TouchEvent<HTMLDivElement>) => handleTimeDrag(e.touches[0].clientX, true);
	const exitTimePreview = () => setTimePreview({ ...timePreview, enabled: false });

	return (
		<div ref={timebarRef} className={style.time_bar} onClick={(e) => handleClick(e.clientX)} onTouchMove={handleTimeTouch} onMouseLeave={exitTimePreview} onMouseUp={exitTimePreview} onMouseMove={(e) => handleTimeDrag(e.clientX, e.buttons === 1)}>
			<div className={style.range}>
				<div className={style.thumb} style={{ left: `${(currentTime * 100) / duration}%` }} />
				<div className={style.fill} style={{ width: `${(currentTime * 100) / duration}%` }} />
				<div className={style.hover} />
				{buffers && (
					<div className={style.buffers}>
						{buffers?.[0] ? (
							buffers?.map(({ start, end }: any, i: number) => <div key={i} className={style.buffered} style={{ width: `${((end - start) * 100) / duration}%`, left: `${(start * 100) / duration}%` }} />)
						) : (
							<div className={style.buffered} style={{ width: `${((buffers.end - buffers.start) * 100) / duration}%`, left: `${(buffers.start * 100) / duration}%` }} />
						)}
					</div>
				)}
			</div>
			<div ref={previewRef} className={style.preview_root} style={{ left: timePreview.position }}>
				<div id='preview' hidden={!timePreview.enabled} className={style.preview} data-image={!timePreview.image}>
					{!timePreview.image && <img className={style.preview_image} src='/poster.png' />}
					<h1 className={style.preview_time}>{timePreview.time}</h1>
				</div>
			</div>
		</div>
	);
}

/*
 * hls.loadSource('path/to/your/manifest.m3u8');
 * hls.attachMedia(videoElement);
 * hls.on(HLS.Events.MANIFEST_PARSED, () => hls.addTrack(HLS.Types.THUMBNAILS, 'path/to/thumbnails.vtt'));
 */
