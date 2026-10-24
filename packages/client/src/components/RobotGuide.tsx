import { useEffect, useRef, useState, type ReactNode } from 'react';
import { COIN, GOAL, HERO } from '../game/sprites';
import { Sprite } from './Sprite';

interface Scene {
  title: string;
  text: string;
  art: ReactNode;
}

const Blocks = () => (
  <div className="rg-blocks">
    <span className="b start">когда старт</span>
    <span className="b loop">повторить 3</span>
    <span className="b move in">шаг вперёд</span>
    <span className="b coin in">взять монету</span>
  </div>
);

const SCENES: Scene[] = [
  {
    title: 'Привет!',
    text: 'Привет! Я робот Кидди. Сейчас покажу, как устроен Kidsland и что здесь можно делать.',
    art: <div className="rg-wave">👋</div>,
  },
  {
    title: 'Игры',
    text: 'В разделе «Играть» ты собираешь программу из цветных блоков, а ракета, подлодка или робот выполняют её. За решение получаешь звёзды, монеты и опыт.',
    art: (
      <div className="rg-row">
        <Blocks />
        <div className="rg-grid">
          <Sprite svg={HERO.space('right')} size={40} className="rg-run" />
          <Sprite svg={COIN} size={28} />
          <Sprite svg={GOAL.space} size={36} />
        </div>
      </div>
    ),
  },
  {
    title: 'Курсы',
    text: 'В разделе «Курсы» есть уроки по Scratch, Python, сайтам, созданию игр и логике. У каждого направления три уровня: начальный, средний и продвинутый.',
    art: (
      <div className="rg-levels">
        {['Начальный', 'Средний', 'Продвинутый'].map((l, i) => (
          <div key={l} className="rg-level" style={{ animationDelay: `${i * 0.25}s`, height: 60 + i * 30 }}>
            {l}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Задания и викторины',
    text: 'В каждом уроке сначала короткая теория, потом задания и викторина. Ответь правильно хотя бы на шестьдесят процентов вопросов, и урок пройден.',
    art: (
      <div className="rg-quiz">
        <b>Что выведет print(2 + 3)?</b>
        <span>23</span>
        <span className="ok">5 ✓</span>
        <span>Ошибку</span>
      </div>
    ),
  },
  {
    title: 'Наставники',
    text: 'Хочешь заниматься с учителем? Выбери наставника и время. На уроке есть видео, общая доска и чат. Первый урок бесплатный.',
    art: (
      <div className="rg-class">
        <div className="rg-cam">👩‍🏫</div>
        <div className="rg-board">
          <svg viewBox="0 0 120 70" aria-hidden>
            <path className="rg-draw" d="M10 55 L50 55 L50 15 L110 15" stroke="#ff6b3d" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="rg-bubble">Молодец!</div>
      </div>
    ),
  },
  {
    title: 'Для родителей',
    text: 'Родители видят в своём кабинете, какие уровни и уроки пройдены, какие темы уже освоены, и могут записать тебя на урок.',
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
    title: 'Безопасность',
    text: 'Важное правило: никогда не пиши в чатах свой телефон, адрес и почту и не отправляй свои фото. Такие сообщения сайт заблокирует. Если что-то непонятно, напиши в службу поддержки.',
    art: <div className="rg-shield">🛡</div>,
  },
  {
    title: 'Поехали!',
    text: 'Вот и всё! Нажми «Начать бесплатно», выбери себе аватар, и вперёд, к первому уровню!',
    art: <div className="rg-wave">🚀</div>,
  },
];

function russianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null;
}

/**
 * Animated "video" where the Kidsland robot tours the site. Scenes are drawn in the browser and
 * narrated with the browser's own speech synthesis when a Russian voice is available.
 */
export function RobotGuide() {
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
    const voice = canSpeak && sound ? russianVoice() : null;
    if (voice) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(s.text);
      u.voice = voice;
      u.lang = 'ru-RU';
      u.rate = 1.02;
      u.pitch = 1.25;
      u.onend = () => window.setTimeout(next, 500);
      window.speechSynthesis.speak(u);
    }
    timer.current = window.setInterval(() => {
      const t = (Date.now() - startedAt) / duration;
      setProgress((scene + Math.min(1, t)) / SCENES.length);
      // Without a voice the timer moves the scenes; with one it is only a safety net.
      if (t >= (voice ? 2.5 : 1)) next();
    }, 100);
    return () => {
      done = true;
      window.clearInterval(timer.current);
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, [playing, scene, sound, canSpeak]);

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
            <b>Робот Кидди расскажет о сайте</b>
            <span>2 минуты · со звуком</span>
          </button>
        )}
        {started && (
          <div className="rg-sub">
            <b>{s.title}.</b> {s.text}
          </div>
        )}
      </div>
      <div className="rg-controls">
        <button className="rg-btn" onClick={playing ? () => setPlaying(false) : play} aria-label={playing ? 'Пауза' : 'Смотреть'}>
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
              aria-label={`Сцена: ${x.title}`}
              onClick={() => {
                setStarted(true);
                setScene(i);
                setProgress(i / SCENES.length);
              }}
            />
          ))}
        </div>
        {canSpeak && (
          <button className="rg-btn" onClick={() => setSound(!sound)} aria-label={sound ? 'Выключить звук' : 'Включить звук'}>
            {sound ? '🔊' : '🔇'}
          </button>
        )}
      </div>
    </div>
  );
}
