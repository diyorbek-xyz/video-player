import { useState } from 'react';
import style from './rendition.module.css';
import { formatQuality, player_config } from '../helpers';
import { CheckIcon, SettingIcon } from '../icons';
import type { Level } from 'hls.js';

export default function Rendition({ levels, level, changeLevel }: { levels: Level[]; level: number; changeLevel: (level: number) => void }) {
	const [open, setOpen] = useState<boolean>(false);

	function changeResolution(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		if (levels?.[0]) {
			changeLevel(Number(e.currentTarget.dataset.value));
			setOpen(false);
		}
	}
	if (levels[0]) {
		return (
			<>
				<div className={style.rendition}>
					<button className={style.label} onClick={() => setOpen(!open)}>
						<SettingIcon />
						<span className={style.badge}>{formatQuality(levels[level ?? player_config.resolution]?.height, 'name')}</span>
					</button>
					{open && (
						<div className={style.levels}>
							<button className={style.level} onClick={changeResolution} title='auto' data-value={-1}>
								Auto
								{-1 === level && <CheckIcon />}
							</button>
							{levels.map((l, i) => (
								<button className={style.level} onClick={changeResolution} title={l.height.toString()} data-value={i} key={i}>
									{formatQuality(l.height)}
									{i === level && <CheckIcon />}
								</button>
							))}
						</div>
					)}
				</div>
				{open && <div style={{ position: 'absolute', inset: '0', zIndex: '1' }} onClick={() => setOpen(false)} />}
			</>
		);
	}
}
