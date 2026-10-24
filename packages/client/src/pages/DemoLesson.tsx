import { findUnsafeContent } from '@kidsland/shared';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Stroke } from '../api';
import type { ChatItem } from '../components/ChatBox';
import { Classroom } from '../components/Classroom';
import { Sprite } from '../components/Sprite';
import { TutorAvatar } from '../components/TutorAvatar';
import { avatarSvg } from '../game/sprites';

const TEACHER = 'Анна Смирнова';
type P = [number, number];

/** Points along a polyline, so the teacher's drawing appears gradually. */
function dense(path: P[], step = 0.01): P[] {
  const out: P[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}
const circle = (cx: number, cy: number, r: number): P[] =>
  Array.from({ length: 33 }, (_, i) => [cx + r * Math.cos((i / 32) * Math.PI * 2), cy + r * 1.6 * Math.sin((i / 32) * Math.PI * 2)]);
const star = (cx: number, cy: number, r: number): P[] =>
  Array.from({ length: 11 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return [cx + rr * Math.cos(a), cy + rr * 1.6 * Math.sin(a)];
  });

// Field: 4 columns × 3 rows. Cell centres.
const X0 = 0.2, Y0 = 0.14, CW = 0.15, CH = 0.24;
const cx = (c: number) => X0 + CW * c + CW / 2;
const cy = (r: number) => Y0 + CH * r + CH / 2;
const GRID: P[][] = [
  ...[0, 1, 2, 3].map((r): P[] => [[X0, Y0 + CH * r], [X0 + CW * 4, Y0 + CH * r]]),
  ...[0, 1, 2, 3, 4].map((c): P[] => [[X0 + CW * c, Y0], [X0 + CW * c, Y0 + CH * 3]]),
];

type Step =
  | { at: number; say: string }
  | { at: number; draw: P[]; color: string; width: number }
  | { at: number; wait: 'answer' | 'draw' };

const SCRIPT: Step[] = [
  { at: 600, say: 'Привет! Я Анна. Сегодня научим робота проходить лабиринт 👋' },
  { at: 2600, say: 'Смотри на доску: я рисую поле 4 на 3 клетки.' },
  ...GRID.map((g, i): Step => ({ at: 3200 + i * 350, draw: g, color: '#9b93c4', width: 3 })),
  { at: 6600, draw: circle(cx(0), cy(2), 0.035), color: '#4c97ff', width: 6 },
  { at: 7400, draw: star(cx(3), cy(0), 0.045), color: '#ffab19', width: 6 },
  { at: 8200, say: 'Синий кружок это робот, жёлтая звезда это цель. Робот смотрит вправо.' },
  { at: 10200, draw: [[cx(0) + 0.04, cy(2)], [cx(3), cy(2)], [cx(3), cy(0) + 0.08]], color: '#ff6b3d', width: 6 },
  { at: 12400, say: 'Вот путь. Как думаешь, сколько шагов вперёд роботу нужно сделать до поворота? Напиши число в чат.' },
  { at: 12500, wait: 'answer' },
];

export function DemoLesson() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [speaking, setSpeaking] = useState('');
  const [stage, setStage] = useState<'intro' | 'answer' | 'draw' | 'done'>('intro');
  const timers = useRef<number[]>([]);
  const ids = useRef(0);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const say = (body: string, mine = false) => {
    setChat((c) => [...c, { id: String(++ids.current), body, mine, author: mine ? 'Ты' : TEACHER, createdAt: new Date().toISOString() }]);
    if (!mine) setSpeaking(body);
  };
  const animate = (path: P[], color: string, width: number) => {
    const pts = dense(path);
    const s: Stroke = { color, width, tool: 'pen', points: [] };
    setStrokes((x) => [...x, s]);
    pts.forEach((p, i) =>
      later(i * 12, () => {
        s.points = pts.slice(0, i + 1);
        setStrokes((x) => [...x]);
      }),
    );
  };

  useEffect(() => {
    for (const step of SCRIPT) {
      if ('say' in step) later(step.at, () => say(step.say));
      else if ('draw' in step) later(step.at, () => animate(step.draw, step.color, step.width));
      else later(step.at, () => setStage(step.wait));
    }
    const ts = timers.current;
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSend = async (text: string) => {
    const unsafe = findUnsafeContent(text);
    if (unsafe) throw new Error(`${unsafe}. Сообщение не отправлено, модератор получил уведомление.`);
    say(text, true);
    if (stage === 'answer') {
      if (/(^|\D)3(\D|$)|(^|\s)три(\s|$|[.!])/i.test(text)) {
        later(900, () => say('Верно, 3 шага! Потом поворот налево и ещё 2 шага вверх.'));
        later(3200, () => say('Теперь твоя очередь: возьми карандаш и обведи на доске клетку, где робот повернёт.'));
        later(3300, () => setStage('draw'));
      } else {
        later(900, () => say('Почти! Посчитай клетки от робота до угла, где линия поворачивает вверх.'));
      }
    } else if (stage === 'done') {
      later(900, () => say('Хороший вопрос! На настоящем уроке разберём его подробно 😊'));
    } else {
      later(900, () => say('Секунду, сейчас дорисую и спрошу тебя 🙂'));
    }
  };

  const onStroke = (s: Stroke) => {
    setStrokes((x) => [...x, s]);
    if (stage === 'draw') {
      setStage('done');
      later(800, () => say('Отлично, именно там! Ты только что написал алгоритм: 3 шага, поворот налево, 2 шага.'));
      later(3000, () => say('На этом пробный урок окончен. На настоящем уроке я вижу тебя по видео, а ты меня 👋'));
    }
  };

  const video = (
    <div className="demo-video">
      <div className={`dv-tile teacher${speaking ? ' talking' : ''}`}>
        <TutorAvatar name={TEACHER} size={96} />
        <span className="dv-name">{TEACHER} · учитель</span>
        {speaking && <span className="dv-sub">{speaking}</span>}
      </div>
      <div className="dv-tile me">
        <Sprite svg={avatarSvg('monster-3')} size={64} />
        <span className="dv-name">Ты</span>
      </div>
    </div>
  );

  return (
    <main className="page lesson">
      <div className="lesson-head card">
        <TutorAvatar name={TEACHER} size={56} />
        <div className="lesson-info">
          <h1>Демо-урок: робот в лабиринте</h1>
          <span className="muted">Так выглядит онлайн-урок с наставником: видео, общая доска и чат. Это имитация, учитель здесь ненастоящий.</span>
        </div>
        <Link to="/tutors" className="btn btn-primary">
          Записаться на урок
        </Link>
      </div>
      {stage === 'draw' && <div className="demo-hint">✏️ Нарисуй что-нибудь на доске: обведи клетку, где робот поворачивает.</div>}
      {stage === 'answer' && <div className="demo-hint">💬 Ответь учителю в чате справа.</div>}
      <Classroom
        video={video}
        strokes={strokes}
        onStroke={onStroke}
        onClear={() => setStrokes([])}
        chat={chat}
        onSend={onSend}
        isTutor={false}
      />
    </main>
  );
}
