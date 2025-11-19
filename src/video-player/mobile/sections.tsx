import type React from 'react';
import style from './index.module.css';
import { cn } from '../helpers';
import { usePlayerContext } from '../context';
import { PreviewData, SkipMobile, Status } from './controllers';

function ControlsTop({ className, ...props }: React.ComponentProps<'div'>) {
	const { preview, hidden } = usePlayerContext().state;

	if (!preview.enabled && !hidden) {
		return <div id='controls-top' className={cn(style.controls_top, className)} {...props} />;
	}
}
function ControlsBottom({ className, ...props }: React.ComponentProps<'div'>) {
	const { hidden } = usePlayerContext().state;
	if (!hidden) {
		return <div id='player-controls' className={cn(style.controls_bottom, className)} {...props} />;
	}
}
function Controls({ className, ...props }: React.ComponentProps<'div'>) {
	const { enabled } = usePlayerContext().state.preview;

	if (!enabled) return <div id='controls' className={cn(style.sections_controls, className)} {...props} />;
}
function Overlay({ className, ...props }: React.ComponentProps<'div'>) {
	const { enabled } = usePlayerContext().state.preview;

	if (enabled) {
		return <PreviewData />;
	} else {
		return (
			<div id='player-overlay' className={cn(style.sections_overlay, className)} {...props}>
				<SkipMobile />
				<Status />
			</div>
		);
	}
}
export { ControlsBottom, ControlsTop, Overlay, Controls };
