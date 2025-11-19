export const player_config = JSON.parse(localStorage.getItem('player_config') || '0') as {
	muted: boolean;
	volume: number;
	resolution: number;
};
export function CueTextToImage(text: string) {
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
export async function loadPreviews(url: string) {
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
export function timeFormatter(params: number) {
	return Math.floor(params / 60) + ':' + ('0' + Math.floor(params % 60)).slice(-2);
}
export function parseTime(t: string) {
	const [hms, ms] = t.split('.');
	const [h, m, s] = hms.split(':').map(Number);
	return h * 3600 + m * 60 + s + (ms ? parseInt(ms) / 1000 : 0);
}
export function cn(...params: Array<string | undefined>) {
	return params?.join(' ');
}
export function formatQuality(height: number, type?: 'text' | 'name') {
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
		case 144:
			return '144p';
		case undefined:
			return 'Auto';
		default:
			return `${height}p`;
	}
}
