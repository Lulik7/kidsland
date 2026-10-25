import { useEffect, useRef, useState } from 'react';
import { useLang, useT } from '../i18n';
import { canSpeak, say, stopSpeaking } from '../speech';
import { SpeedSwitch } from './LessonExtras';

const VOICE: Record<string, string> = { ru: 'ru-RU', en: 'en-GB', el: 'el-GR', he: 'he-IL' };

/** Reads a whole text aloud, part by part, in the language of the site; `onPart` tells which part sounds now. */
export function ListenText({ parts, onPart }: { parts: string[]; onPart?: (i: number) => void }) {
  const t = useT();
  const { lang } = useLang();
  const [on, setOn] = useState(false);
  const run = useRef(0);
  useEffect(() => () => {
    run.current++;
    stopSpeaking();
  }, []);
  if (!canSpeak() || parts.length === 0) return null;
  const stop = () => {
    run.current++;
    stopSpeaking();
    setOn(false);
    onPart?.(-1);
  };
  const play = async () => {
    const id = ++run.current;
    setOn(true);
    for (let i = 0; i < parts.length; i++) {
      if (run.current !== id) return;
      onPart?.(i);
      await say(parts[i], VOICE[lang] ?? 'ru-RU', 0, 1);
    }
    if (run.current === id) stop();
  };
  return (
    <div className="listen-text">
      <button type="button" className={`btn ${on ? 'btn-light' : 'btn-go'} btn-small`} onClick={on ? stop : play}>
        {on ? `■ ${t('Стоп')}` : `🔊 ${t('Прослушать текст')}`}
      </button>
      <SpeedSwitch />
    </div>
  );
}
