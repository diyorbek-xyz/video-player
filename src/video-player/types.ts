import type Hls from 'hls.js';
import type { HTMLMediaProps, HTMLMediaState } from 'react-use/lib/factory/createHTMLMediaHook';

type Classes = {
	time_range: {
		bar: string;
		range: string;
		fill: string;
		buffered: string;
		thumb: string;
		preview: string;
		preview_image: string;
		preview_time: string;
	};
	volume_range: {
		bar: string;
		fill: string;
		thumb: string;
	};
	global: {
		player_button: string;
		time_view: string;
		volume_controls: string;
		buffering: string;
		paused: string;
	};
	sections: {
		volume: string;
		others: string;
		controls: string;
	};
	rendition: {
		root: string;
		label: string;
		select: string;
		option: string;
	};
};

interface EpisodeType {
	title?: string;
	episode?: number;
	poster: string;
	previews?: string;
	video: string;
	download: string;
}
interface SeasonType {
	title: string;
	season: number;
	episodes: Array<EpisodeType>;
}
interface AnimeType {
	_id: string;
	anime: string;
	poster: string;
	studio: string;
	seasons: Array<SeasonType>;
}
interface CreateNewAnimeType {
	name: string;
	poster?: File;
	studio: string;
	link: string;
	season: number;
	episode: number;
	file?: File;
}

interface ContextType {
	video: {
		element: React.ReactElement<
			HTMLMediaProps & {
				ref?: React.MutableRefObject<HTMLVideoElement | null> | undefined;
			},
			string | ((props: any) => React.ReactElement<any, any> | null) | (new (props: any) => React.Component<any, any, any>)
		>;
		current: HTMLVideoElement | null;
		hls: Hls | null;
		player_config: {
			muted: boolean;
			volume: number;
			resolution: number;
		};
		state: {
			buffered: any[];
			duration: number;
			paused: boolean;
			muted: boolean;
			time: number;
			volume: number;
			playing: boolean;
			buffering: boolean;
		};
		fullscreen: boolean;
		controls: {
			play: () => Promise<void> | undefined;
			pause: () => void;
			seek: (time: number) => void;
			volume: (volume: number) => void;
			mute: () => void;
			unmute: () => void;
		};
	};
	controllers: {
		skip: (step: number) => void;
		load_previews: (source: string) => Promise<
			{
				start: number;
				end: number;
				image: string;
			}[]
		>;
		parse_time: (text: string) => number;
		time_formatter: (time: number) => string;
		play: () => void;
		fullscreen: () => void;
		keyboard_shortcut: (e: KeyboardEvent) => void;
		mute: () => void;
		auto_hide: () => void;
		set_buffering: (prop: boolean) => void;
	};
	sources: {
		video: string;
		previews?: string;
		download?: string;
		poster: string;
		baseUrl?: string;
	};
}

interface RequiredControllerProps {
	videoState: HTMLMediaState;
	videoControls: {
		play: () => Promise<void> | void;
		pause: () => void;
		seek: (time: number) => void;
		volume: (volume: number) => void;
		mute: () => void;
		unmute: () => void;
	};
}

export type { EpisodeType, SeasonType, AnimeType, CreateNewAnimeType, ContextType, Classes, RequiredControllerProps };
