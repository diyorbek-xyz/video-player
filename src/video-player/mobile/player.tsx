import { Download, Fullscreen, Mute, RenditionButton, RenditionMenu, TimeRange, TimeView, VideoElement, VolumeRange } from './controllers';
import { Controls, ControlsBottom, ControlsTop, Overlay } from './sections';

function PlayerMobile() {
	return (
		<>
			<VideoElement />
			<RenditionMenu />
			<Overlay />
			<ControlsTop>
				<div>
					<Mute />
					<VolumeRange />
				</div>
				<div>
					<Download />
					<RenditionButton />
				</div>
			</ControlsTop>
			<ControlsBottom>
				<TimeRange />
				<Controls>
					<TimeView />
					<Fullscreen />
				</Controls>
			</ControlsBottom>
		</>
	);
}
export default PlayerMobile;
