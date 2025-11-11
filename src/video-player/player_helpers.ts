import type { RequiredControllerProps } from "./types";

const player_config = JSON.parse(localStorage.getItem('player_config') || '0') as {
	muted: boolean;
	volume: number;
	resolution: number;
};

function skip({ step, videoControls, videoState }: { step: number } & RequiredControllerProps) {
	videoControls.seek(videoState.time + step);

	const skip_view = document.createElement('div');
	skip_view.classList.add('player-skip-view');
	if (step < 0) {
		skip_view.classList.add('left');
	} else {
		skip_view.classList.add('right');
		skip_view.innerText += '+';
	}
	skip_view.innerText += step;
	document.getElementById('video-player')?.appendChild(skip_view);
	setTimeout(() => (skip_view.style.opacity = '1'), 50);
	setTimeout(() => (skip_view.style.opacity = '0'), 1700);
	setTimeout(() => document.getElementById('video-player')?.removeChild(skip_view), 2000);
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
function timeFormatter(params: number) {
	return Math.floor(params / 60) + ':' + ('0' + Math.floor(params % 60)).slice(-2);
}
function parseTime(t: string) {
	const [hms, ms] = t.split('.');
	const [h, m, s] = hms.split(':').map(Number);
	return h * 3600 + m * 60 + s + (ms ? parseInt(ms) / 1000 : 0);
}

function play({ videoControls, videoState }: RequiredControllerProps) {
	if (videoState.paused) videoControls.play();
	else videoControls.pause();
}
function fullscreen() {
	if (!document.fullscreenElement) document.getElementById('video-player')?.requestFullscreen();
	else document.exitFullscreen();
}
function keyboard_shortcut({ videoState, videoControls }: RequiredControllerProps, e: KeyboardEvent) {
	if (e.key == ' ') e.preventDefault();
	if (e.key == 'ArrowRight') skip({ step: 5, videoControls, videoState });
	if (e.key == 'ArrowLeft') skip({ step: -5, videoControls, videoState });
	if (e.key == ' ') play({ videoState, videoControls });
	if (e.key == 'f') fullscreen();
	if (e.key == 'm') mute({ videoControls, videoState });
}
let timeout: number;
function auto_hide() {
	const controls = document.getElementById('player-controls');
	if (!controls) return;
	controls.hidden = false;
	clearTimeout(timeout);
	timeout = setTimeout(() => (controls.hidden = true), 5000);
}
function mute({ videoControls, videoState }: RequiredControllerProps) {
	if (videoState.muted) videoControls.unmute();
	else videoControls.mute();
}

export { skip, loadPreviews, parseTime, timeFormatter, player_config, play, fullscreen, keyboard_shortcut, mute, auto_hide };
