import { useEffect, useRef, useState } from 'react';
import { Pic } from '../pics';
import { useT } from '../i18n';
import { playSounds } from './natureSounds';

/** The picture of a lesson card that plays the animal and nature sounds the card talks about. */
export function SoundButton({ code, sounds }: { code: string; sounds: string[] }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  const toggle = () => {
    if (playing) {
      stop.current?.();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    stop.current = playSounds(sounds, () => setPlaying(false));
  };
  return (
    <button type="button" className={`tc-pic tc-sound${playing ? ' playing' : ''}`} onClick={toggle} aria-label={playing ? t('Стоп') : t('Послушать звуки')}>
      <Pic code={code} size={72} />
      <span className="tc-sound-label">{playing ? '■ ' + t('Стоп') : '▶ ' + t('Послушать')}</span>
    </button>
  );
}
