import { useRef } from 'react';
import { VolumeIcon, VolumeOffIcon } from '../icons';
import style from './volumeslider.module.css';
export default function VolumeSlider({ toggleMute, changeVolume, muted, volume }: { toggleMute: () => void; changeVolume: (volume: number) => void; muted: boolean; volume: number }) {
	const barRef = useRef<HTMLDivElement>(null);

	function handle(e: React.MouseEvent<HTMLDivElement>) {
		if (!barRef.current) return;
		const rect = barRef.current.getBoundingClientRect();
		console.log(Number(((e.clientX - rect.left) / rect.width).toFixed(1)));

		changeVolume(Math.min(Math.max(Number(((e.clientX - rect.left) / rect.width).toFixed(1)), 0), 1));
	}
	return (
		<div className={style.volume}>
			<div onClick={() => toggleMute()} className={style.button}>
				{muted || volume === 0 ? <VolumeOffIcon /> : <VolumeIcon />}
			</div>

			<div
				ref={barRef}
				className={style.range}
				onClick={handle}
				onMouseMove={(e) => {
					if (e.buttons === 1) handle(e);
				}}>
				<div className={style.track} />
				<div className={style.fill} style={{ width: `${volume * 100}%` }} />
				<div className={style.thumb} style={{ left: `${volume * 100}%` }} />
			</div>
		</div>
	);
}
