import { CHILD_SAFETY_TIPS, TUTOR_SAFETY_RULES } from '@kidsland/shared';
import { useState, type ReactNode } from 'react';
import type { Stroke } from '../api';
import { ChatBox, type ChatItem } from './ChatBox';
import { Whiteboard } from './Whiteboard';

/** Lesson room layout: video and whiteboard on the left, chat with the teacher on the right. */
export function Classroom({
  video,
  strokes,
  onStroke,
  onClear,
  chat,
  onSend,
  isTutor,
  onReport,
}: {
  video: ReactNode;
  strokes: Stroke[];
  onStroke?: (s: Stroke) => void;
  onClear?: () => void;
  chat: ChatItem[];
  onSend: (text: string) => Promise<void>;
  isTutor: boolean;
  onReport?: () => void;
}) {
  const [pane, setPane] = useState<'board' | 'video'>('board');
  const rules = isTutor ? TUTOR_SAFETY_RULES : CHILD_SAFETY_TIPS;
  return (
    <div className="classroom">
      <div className="cr-switch tabs">
        <button className={pane === 'board' ? 'tab on' : 'tab'} onClick={() => setPane('board')}>
          Доска
        </button>
        <button className={pane === 'video' ? 'tab on' : 'tab'} onClick={() => setPane('video')}>
          Видео
        </button>
      </div>
      <section className={`cr-video${pane === 'video' ? ' show' : ''}`}>{video}</section>
      <section className={`cr-board${pane === 'board' ? ' show' : ''}`}>
        <Whiteboard strokes={strokes} onStroke={onStroke} onClear={onClear} label="Доска урока" />
      </section>
      <aside className="cr-chat card">
        <h2 className="card-title">Чат с {isTutor ? 'учеником' : 'учителем'}</h2>
        <ChatBox
          items={chat}
          onSend={onSend}
          placeholder={isTutor ? 'Сообщение ученику…' : 'Напиши учителю…'}
          empty="Здесь можно задать вопрос или прислать ответ на задание."
          note={<span>🛡 {isTutor ? 'Телефоны, почта, адреса и просьбы о фото блокируются.' : 'Не пиши свой телефон, адрес и почту.'}</span>}
        />
        <details className="cr-rules">
          <summary>Правила безопасности</summary>
          <ul>
            {rules.map((r) => <li key={r}>{r}</li>)}
          </ul>
          {onReport && (
            <button className="btn btn-light" onClick={onReport}>
              Пожаловаться
            </button>
          )}
        </details>
      </aside>
    </div>
  );
}
