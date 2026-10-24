import { SECTIONS, SUBJECTS } from '@kidsland/shared';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { COIN, GOAL, HERO } from '../game/sprites';
import { useLang, type T } from '../i18n';
import { Sprite } from './Sprite';
import { SubjectIcon } from './SubjectIcon';

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

/** A section slide: the section's coloured tile with its icon and a few topics popping in. */
export const SectionArt = ({ t, id }: { t: T; id: string }) => {
  const sec = SECTIONS.find((x) => x.id === id)!;
  const icon = SUBJECTS.find((x) => x.section === id)?.id ?? 'spirit';
  return (
    <div className="rg-section" style={{ ['--c' as string]: sec.color }}>
      <span className="rg-sec-icon">
        <SubjectIcon subject={icon} size={64} />
      </span>
      <div className="rg-topics">
        {sec.topics.slice(0, 6).map((tp, i) => (
          <span key={tp.id} style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
            {t(tp.name)}
          </span>
        ))}
      </div>
    </div>
  );
};

const makeScenes = (t: T): Scene[] => [
  {
    title: t('Привет!'),
    text: t('Привет! Я робот Кидди. Kidsland — это страна науки и творчества. Сейчас покажу, какие здесь есть разделы и что можно делать.'),
    art: <div className="rg-wave">👋</div>,
  },
  {
    title: t('Разделы'),
    text: t('В Kidsland девять разделов: программирование, наука и опыты, шахматы, музыка, рисование, досуг, иностранные языки, животные и духовное развитие.'),
    art: (
      <div className="rg-tiles">
        {SECTIONS.map((sec, i) => (
          <span key={sec.id} style={{ ['--c' as string]: sec.color, animationDelay: `${i * 0.15}s` }}>
            <SubjectIcon subject={SUBJECTS.find((x) => x.section === sec.id)?.id ?? 'spirit'} size={30} />
          </span>
        ))}
      </div>
    ),
  },
  {
    title: t('Программирование'),
    text: t('В программировании ты собираешь программу из цветных блоков, а ракета, подлодка или робот выполняют её. А ещё есть курсы по Scratch, Roblox, Python, Unity и сайтам.'),
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
    title: t('Наука и опыты'),
    text: t('В разделе «Наука и опыты» изучаем звёзды и планеты, узнаём законы физики, ставим безопасные опыты дома вместе со взрослыми и показываем фокусы.'),
    art: <SectionArt t={t} id="science" />,
  },
  {
    title: t('Шахматы'),
    text: t('В шахматах учимся ходить всеми фигурами, ставить мат и думать на несколько ходов вперёд.'),
    art: <SectionArt t={t} id="chess" />,
  },
  {
    title: t('Музыка'),
    text: t('В музыке девять инструментов и вокал: гитара, фортепиано, скрипка, барабаны и другие. По семь уроков на каждый.'),
    art: <SectionArt t={t} id="music" />,
  },
  {
    title: t('Рисование и досуг'),
    text: t('Рисуем карандашом и красками, а в досуге лепим, плетём, вяжем, шьём и готовим простые блюда.'),
    art: <SectionArt t={t} id="leisure" />,
  },
  {
    title: t('Иностранные языки'),
    text: t('Одиннадцать языков мира: от английского и китайского до греческого и иврита. Учим первые слова и фразы.'),
    art: <SectionArt t={t} id="languages" />,
  },
  {
    title: t('Животные'),
    text: t('В разделе «Животные» узнаём, как ухаживать за питомцами, понимать их язык и дрессировать собаку добрыми методами.'),
    art: <SectionArt t={t} id="animals" />,
  },
  {
    title: t('Духовное развитие'),
    text: t('В духовном развитии читаем статьи о чувствах, доброте, благодарности и семейных традициях, а ещё занимаемся детской йогой.'),
    art: <SectionArt t={t} id="spirit" />,
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
    title: t('Побудь админом'),
    text: t('В разделе «Побудь админом» можно написать свой пост. Его проверит настоящий администратор, и после одобрения пост увидят все.'),
    art: <div className="rg-wave">📝</div>,
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
    text: t('Вот и всё! Нажми «Начать бесплатно», выбери раздел, и вперёд, к первому уроку!'),
    art: <div className="rg-wave">🚀</div>,
  },
];

function voicesFor(lang: string): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const NAMES: Record<string, RegExp> = { ru: /russian|русск/i, en: /english/i, el: /greek|ελλην/i, he: /hebrew|עברית/i };
  const byLang = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang));
  return byLang.length ? byLang : voices.filter((v) => NAMES[lang]?.test(v.name));
}

// Voice names that tell a man's voice from a woman's (Windows, Edge, Chrome, macOS).
const MALE = /david|mark|george|guy|james|ryan|christopher|eric|roger|daniel|fred|pavel|dmitr|yuri|maxim|stefanos|nestoras|asaf|avri|\bmale\b/i;
const FEMALE = /zira|hazel|susan|aria|jenny|libby|sonia|samantha|karen|victoria|irina|svetlana|dariya|ekaterina|milena|katya|athina|melina|hila|carmit|female|google/i;
const gender = (v: SpeechSynthesisVoice) => (MALE.test(v.name) ? 'm' : FEMALE.test(v.name) ? 'f' : null);

/**
 * Picks the narrator voice. The English voice is the reference: in other languages the guide looks for a voice
 * of the same kind, so the robot sounds alike in every language. When only a woman's voice exists and the
 * English one is a man's, the pitch goes down to bring the timbre closer.
 */
function voiceFor(lang: string): { voice: SpeechSynthesisVoice; pitch: number } | null {
  const list = voicesFor(lang);
  if (!list.length) return null;
  const ref = voicesFor('en')[0];
  const want = ref ? gender(ref) : null;
  const voice = (want && list.find((v) => gender(v) === want)) || list[0];
  return { voice, pitch: want === 'm' && gender(voice) === 'f' ? 1.05 : 1.75 };
}

// Recorded narration for languages that computers often have no voice for (Chrome on Windows has no Greek).
const RECORDED = new Set(['el']);

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
function robotSay(text: string, { voice, pitch }: { voice: SpeechSynthesisVoice; pitch: number }, onEnd: () => void): () => void {
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
      u.pitch = pitch + Math.random() * 0.25;
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

/** Plays a recorded narration file after a beep-boop. Returns a function that stops it. */
function playRecorded(src: string, onEnd: () => void): () => void {
  const a = new Audio(src);
  let ended = false;
  const end = () => {
    if (!ended) {
      ended = true;
      onEnd();
    }
  };
  a.onended = end;
  a.onerror = end;
  const wait = window.setTimeout(() => void a.play().catch(end), beepBoop());
  return () => {
    ended = true;
    window.clearTimeout(wait);
    a.pause();
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

  const [voiceCount, setVoiceCount] = useState(0);

  // Chrome loads the voice list lazily; ask early so it is ready by the time Play is pressed.
  useEffect(() => {
    if (!canSpeak) return;
    const update = () => setVoiceCount(window.speechSynthesis.getVoices().length);
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, [canSpeak]);
  // The computer has voices, but none for the interface language: tell the viewer why it is silent.
  const noVoice = canSpeak && sound && voiceCount > 0 && !voiceFor(lang) && !RECORDED.has(lang);

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
    const recorded = sound && !voice && RECORDED.has(lang);
    const onEnd = () => window.setTimeout(next, 500);
    const stop = voice ? robotSay(s.text, voice, onEnd) : recorded ? playRecorded(`/voice/${lang}/${scene}.mp3`, onEnd) : undefined;
    timer.current = window.setInterval(() => {
      const k = (Date.now() - startedAt) / duration;
      setProgress((scene + Math.min(1, k)) / SCENES.length);
      // Without a voice the timer moves the scenes; with one it is only a safety net.
      if (k >= (voice || recorded ? 2.5 : 1)) next();
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
            <span>{t('3 минуты · со звуком')}</span>
          </button>
        )}
        {started && noVoice && <div className="rg-novoice">{t('На этом компьютере нет голоса для этого языка, поэтому робот показывает текст. Голос можно добавить в настройках Windows: «Время и язык» → «Речь», или открыть сайт в браузере Microsoft Edge.')}</div>}
        {started && (
          <div className="rg-sub">
            {s.text}
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
