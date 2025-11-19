import { Barrier, Download, Fullscreen, PlayPause, Resolutions, Status, TimeRange, TimeView, VideoElement, VolumeControls } from './controllers';
import { ControlsBottom, ControlsTop, SectionOther, SectionOverlay, SectionVolume } from './sections';

function PlayerDesktop() {
	return (
		<>
			<VideoElement />
			<SectionOverlay>
				<Status />
				<Barrier />
			</SectionOverlay>
			<ControlsTop>
				<Resolutions />
				<Download />
				<Fullscreen />
			</ControlsTop>
			<ControlsBottom>
				<TimeRange />
				<SectionVolume>
					<PlayPause />
					<VolumeControls />
					<TimeView />
				</SectionVolume>
				<SectionOther>
					<Resolutions />
					<Download />
					<Fullscreen />
				</SectionOther>
			</ControlsBottom>
		</>
	);
}
export default PlayerDesktop;
