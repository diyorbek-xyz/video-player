import type React from 'react';
import style from './index.module.css'

function SectionControls({ className, ...props }: React.ComponentProps<'div'>) {
	return <div id='player-controls' hidden={false} className={style.sections_controls} {...props}></div>;
}
function SectionVolume(props: React.ComponentProps<'div'>) {
	return <div id='player-volumes' className={style.sections_volume} {...props}></div>;
}
function SectionOther(props: React.ComponentProps<'div'>) {
	return <div id='player-other' className={style.sections_others} {...props}></div>;
}
export { SectionOther, SectionVolume, SectionControls };
