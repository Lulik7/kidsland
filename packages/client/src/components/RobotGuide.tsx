import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { COIN, GOAL, HERO } from '../game/sprites';
import { useLang, type T } from '../i18n';
import { Sprite } from './Sprite';

interface Scene {
  title: string;
  text: string;
  art: ReactNode;
}

const Blocks = ({ t }: { t: T }) => (
  <div className="rg-blocks">
    <span className="b start">{t('когда старт')}</span>
    <span className="b loop">{t('повторить 3')}</span>
    <span className="b move in">{t('шаг вперёд')}</span>
    <span className="b coin in">{t('взять монету')}</span>
  </div>
);

const makeScenes = (t: T): Scene[] => [
  {
    title: t('Привет!'),
    text: t('Привет! Я робот Кидди. Сейчас покажу, как устроен Kidsland и что здесь можно делать.'),
    art: <div className="rg-wave">👋</div>,
  },
  {
    title: t('Игры'),
    text: t('В разделе «Играть» ты собираешь программу из цветных блоков, а ракета, подлодка или робот выполняют её. За решение получаешь звёзды, монеты и опыт.'),
    art: (
      <div className="rg-row">
        <Blocks t={t} />
        <div className="rg-grid">
          <Sprite svg={HERO.space('right')} size={40} className="rg-run" />
          <Sprite svg={COIN} size={28} />
          <Sprite svg={GOAL.space} size={36} />
        </div>
      </div>
    ),
  },
  {
    title: t('Курсы'),
    text: t('В разделе «Курсы» есть уроки по Scratch, Roblox, Python, Unity, сайтам, компьютерной грамотности, созданию игр и логике. У каждого направления три уровня: начальный, средний и продвинутый.'),
    art: (
      <div className="rg-levels">
        {[t('Начальный'), t('Средний'), t('Продвинутый')].map((l, i) => (
          <div key={l} className="rg-level" style={{ animationDelay: `${i * 0.25}s`, height: 60 + i * 30 }}>
            {l}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: t('Задания и викторины'),
    text: t('В каждом уроке сначала теория. Прочитал, и урок засчитан. А задания и викторину можно открыть по желанию и получить за них опыт и монеты.'),
    art: (
      <div className="rg-quiz">
        <b>{t('Что выведет print(2 + 3)?')}</b>
        <span>23</span>
        <span className="ok">5 ✓</span>
        <span>{t('Ошибку')}</span>
      </div>
    ),
  },
  {
    title: t('Наставники'),
    text: t('Хочешь заниматься с учителем? Выбери наставника и время. На уроке есть видео, общая доска и чат. Первый урок бесплатный.'),
    art: (
      <div className="rg-class">
        <div className="rg-cam">👩‍🏫</div>
        <div className="rg-board">
          <svg viewBox="0 0 120 70" aria-hidden>
            <path className="rg-draw" d="M10 55 L50 55 L50 15 L110 15" stroke="#ff6b3d" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="rg-bubble">{t('Молодец!')}</div>
      </div>
    ),
  },
  {
    title: t('Для родителей'),
    text: t('Родители видят в своём кабинете, какие уровни и уроки пройдены, какие темы уже освоены, и могут записать тебя на урок.'),
    art: (
      <div className="rg-bars">
        {[90, 65, 40].map((v, i) => (
          <div key={i}>
            <i style={{ width: `${v}%`, animationDelay: `${i * 0.2}s` }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: t('Безопасность'),
    text: t('Важное правило: никогда не пиши в чатах свой телефон, адрес и почту и не отправляй свои фото. Такие сообщения сайт заблокирует. Если что-то непонятно, напиши в службу поддержки.'),
    art: <div className="rg-shield">🛡</div>,
  },
  {
    title: t('Поехали!'),
    text: t('Вот и всё! Нажми «Начать бесплатно», выбери себе аватар, и вперёд, к первому уровню!'),
    art: <div className="rg-wave">🚀</div>,
  },
];

function voiceFor(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

let audio: AudioContext | null = null;

/** A short robot "beep-boop": two or three square-wave chirps at random pitches. */
function beepBoop(): number {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    const ctx = audio;
    const notes = 2 + Math.floor(Math.random() * 2);
    let at = ctx.currentTime + 0.02;
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const f = 500 + Math.random() * 900;
      osc.frequency.setValueAtTime(f, at);
      osc.frequency.exponentialRampToValueAtTime(f * (Math.random() > 0.5 ? 1.6 : 0.6), at + 0.09);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.07, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.11);
      at += 0.12;
    }
    return notes * 120 + 60;
  } catch {
    return 0;
  }
}

/** Splits narration into short phrases, so each one gets its own funny intonation and a beep. */
const phrases = (text: string) => text.match(/[^.!?…:]+[.!?…:]*/g)?.map((p) => p.trim()).filter(Boolean) ?? [text];

/**
 * Speaks text in a funny robot voice: very high and quick, with the pitch hopping from phrase to phrase
 * and a beep-boop in front of each phrase. Returns a function that stops it.
 */
function robotSay(text: string, voice: SpeechSynthesisVoice, onEnd: () => void): () => void {
  let stopped = false;
  let wait: number | undefined;
  const list = phrases(text);
  const step = (i: number) => {
    if (stopped) return;
    if (i >= list.length) return onEnd();
    wait = window.setTimeout(() => {
      if (stopped) return;
      const u = new SpeechSynthesisUtterance(list[i]);
      u.voice = voice;
      u.lang = voice.lang;
      u.pitch = 1.75 + Math.random() * 0.25;
      u.rate = 1.12 + Math.random() * 0.15;
      u.onend = () => step(i + 1);
      u.onerror = () => step(i + 1);
      window.speechSynthesis.speak(u);
    }, beepBoop());
  };
  window.speechSynthesis.cancel();
  step(0);
  return () => {
    stopped = true;
    window.clearTimeout(wait);
    window.speechSynthesis.cancel();
  };
}

/**
 * Animated "video" where the Kidsland robot tours the site. Scenes are drawn in the browser and
 * narrated with the browser's own speech synthesis when a Russian voice is available.
 */
export function RobotGuide() {
  const { lang, t } = useLang();
  const SCENES = useMemo(() => makeScenes(t), [t]);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [scene, setScene] = useState(0);
  const [sound, setSound] = useState(true);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Chrome loads the voice list lazily; ask early so it is ready by the time Play is pressed.
  useEffect(() => {
    if (canSpeak) window.speechSynthesis.getVoices();
  }, [canSpeak]);

  useEffect(() => {
    if (!playing) return;
    const s = SCENES[scene];
    const duration = Math.max(5000, s.text.length * 70);
    const startedAt = Date.now();
    let done = false;
    const next = () => {
      if (done) return;
      done = true;
      if (scene < SCENES.length - 1) setScene(scene + 1);
      else {
        setPlaying(false);
        setProgress(1);
      }
    };
    const voice = canSpeak && sound ? voiceFor(lang) : null;
    const stop = voice ? robotSay(s.text, voice, () => window.setTimeout(next, 500)) : undefined;
    timer.current = window.setInterval(() => {
      const k = (Date.now() - startedAt) / duration;
      setProgress((scene + Math.min(1, k)) / SCENES.length);
      // Without a voice the timer moves the scenes; with one it is only a safety net.
      if (k >= (voice ? 2.5 : 1)) next();
    }, 100);
    return () => {
      done = true;
      window.clearInterval(timer.current);
      stop?.();
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, [playing, scene, sound, canSpeak, lang, SCENES]);

  const play = () => {
    if (!started || (!playing && scene === SCENES.length - 1 && progress >= 1)) setScene(0);
    setStarted(true);
    setPlaying(true);
  };

  const s = SCENES[scene];
  return (
    <div className="robot-guide">
      <div className="rg-screen">
        <div className="rg-stars" aria-hidden />
        {started ? (
          <div key={scene} className="rg-scene">
            <div className="rg-robot">
              <Sprite svg={HERO.robot('down')} size={130} className={playing ? 'rg-talk' : ''} />
            </div>
            <div className="rg-art">{s.art}</div>
          </div>
        ) : (
          <button className="rg-poster" onClick={play}>
            <Sprite svg={HERO.robot('down')} size={150} className="float" />
            <span className="rg-play" aria-hidden>
              ▶
            </span>
            <b>{t('Робот Кидди расскажет о сайте')}</b>
            <span>{t('2 минуты · со звуком')}</span>
          </button>
        )}
        {started && (
          <div className="rg-sub">
            <b>{s.title}.</b> {s.text}
          </div>
        )}
      </div>
      <div className="rg-controls">
        <button className="rg-btn" onClick={playing ? () => setPlaying(false) : play} aria-label={playing ? t('Пауза') : t('Смотреть')}>
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="rg-track" aria-hidden>
          <i style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="rg-dots">
          {SCENES.map((x, i) => (
            <button
              key={x.title}
              className={i === scene && started ? 'on' : ''}
              title={x.title}
              aria-label={`${t('Сцена')}: ${x.title}`}
              onClick={() => {
                setStarted(true);
                setScene(i);
                setProgress(i / SCENES.length);
              }}
            />
          ))}
        </div>
        {canSpeak && (
          <button className="rg-btn" onClick={() => setSound(!sound)} aria-label={sound ? t('Выключить звук') : t('Включить звук')}>
            {sound ? '🔊' : '🔇'}
          </button>
        )}
      </div>
    </div>
  );
}
