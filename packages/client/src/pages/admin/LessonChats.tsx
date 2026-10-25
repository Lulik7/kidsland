import { useEffect, useState } from 'react';
import { api, type LessonChat, type RoomMessage } from '../../api';
import { fmtDateTime } from '../../format';

/** Read-only view of lesson chats between tutors and families, for occasional checks. */
export function LessonChats() {
  const [chats, setChats] = useState<LessonChat[] | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);

  useEffect(() => {
    api.lessonChats().then((r) => setChats(r.chats)).catch(() => setChats([]));
  }, []);
  useEffect(() => {
    if (!current) return;
    setMessages([]);
    api.lessonChat(current).then((r) => setMessages(r.messages)).catch(() => {});
  }, [current]);

  const chat = chats?.find((c) => c.bookingId === current);
  return (
    <div className="admin-layout">
      <div className="card thread-list">
        {!chats ? (
          <p className="muted">Загружаем…</p>
        ) : chats.length === 0 ? (
          <p className="muted">В чатах уроков пока нет сообщений.</p>
        ) : (
          chats.map((c) => (
            <button key={c.bookingId} className={`thread-row${c.bookingId === current ? ' on' : ''}`} onClick={() => setCurrent(c.bookingId)}>
              <b>
                {c.tutorName} · {c.childName ?? 'ученик'}
              </b>
              <span className="muted small">
                урок {fmtDateTime(c.startsAt)} · {c.messages} сообщ.
              </span>
            </button>
          ))
        )}
      </div>
      <div className="card">
        {chat ? (
          <>
            <h2 className="card-title">
              {chat.tutorName} и {chat.childName ?? 'ученик'}
            </h2>
            <p className="muted small">Только чтение. Нарушения правил безопасности блокируются автоматически и видны во вкладке «Безопасность».</p>
            <div className="chat">
              <div className="chat-list">
                {messages.map((m) => (
                  <div key={m.id} className={m.isTutor ? 'msg mine' : 'msg'}>
                    <span className="msg-author">{m.isTutor ? 'Наставник' : 'Ученик'}</span>
                    <div className="msg-body">{m.body}</div>
                    <span className="msg-time">{fmtDateTime(m.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="muted center">Выберите урок слева.</p>
        )}
      </div>
    </div>
  );
}
