import type React from 'react';
import { usePlayerContext } from '../context';
import { cn } from '../helpers';
import style from './index.module.css';

function ControlsTop({ className, ...props }: React.ComponentProps<'div'>) {
	const width = usePlayerContext().state.width;
	if (width < 500) return <div id='controls-top' className={cn(style.controls_top, className)} {...props} />;
}
function ControlsBottom({ className, ...props }: React.ComponentProps<'div'>) {
	return <div id='player-controls' hidden={false} className={cn(style.controls_bottom, className)} {...props} />;
}
function SectionOverlay({ className, ...props }: React.ComponentProps<'div'>) {
	return <div id='player-overlay' className={cn(style.sections_overlay, className)} {...props} />;
}
function SectionVolume({ className, ...props }: React.ComponentProps<'div'>) {
	return <div id='player-volumes' className={cn(style.sections_volume, className)} {...props} />;
}
function SectionOther({ className, ...props }: React.ComponentProps<'div'>) {
	const width = usePlayerContext().state.width;
	if (width >= 500) return <div id='player-other' className={cn(style.sections_others, className)} {...props} />;
}
export { SectionOther, SectionVolume, ControlsBottom, ControlsTop, SectionOverlay };
