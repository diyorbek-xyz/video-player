const player_config = JSON.parse(localStorage.getItem('player_config') || '{}') as {
	muted: boolean;
	volume: number;
	resolution: number;
};
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
function timeFormatter(params: number) {
	return Math.floor(params / 60) + ':' + ('0' + Math.floor(params % 60)).slice(-2);
}
function parseTime(t: string) {
	const [hms, ms] = t.split('.');
	const [h, m, s] = hms.split(':').map(Number);
	return h * 3600 + m * 60 + s + (ms ? parseInt(ms) / 1000 : 0);
}
function cn(...params: Array<string | undefined>) {
	return params?.join(' ');
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
		case 144:
			return '144p';
		case undefined:
			return 'Auto';
		default:
			return `${height}p`;
	}
}
export { player_config, CueTextToImage, timeFormatter, parseTime, cn, formatQuality };
