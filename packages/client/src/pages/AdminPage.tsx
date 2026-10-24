import { useState } from 'react';
import { api, type SafetyFlag, type SupportMessage, type SupportThread } from '../api';
import { ChatBox, usePolling } from '../components/ChatBox';
import { fmtDateTime } from '../format';

const roleName = { parent: 'родитель', tutor: 'наставник', admin: 'админ' } as const;

export function AdminPage() {
  const [tab, setTab] = useState<'support' | 'safety'>('support');
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [flags, setFlags] = useState<SafetyFlag[]>([]);
  const [error, setError] = useState<string | null>(null);

  usePolling(() => {
    api.adminThreads().then((r) => setThreads(r.threads)).catch((e) => setError(e.message));
    api.safetyFlags().then((r) => setFlags(r.flags)).catch(() => {});
  }, 10_000, []);

  usePolling(
    () => {
      if (!current) return;
      api.adminThread(current).then((r) => {
        setThread(r.thread);
        setMessages(r.messages);
      });
    },
    5_000,
    [current],
  );

  const unread = threads.filter((t) => t.staffUnread).length;

  return (
    <main className="page admin-page">
      <div className="dash-head">
        <h1 className="page-title left">Панель администратора</h1>
        <div className="tabs">
          <button className={tab === 'support' ? 'tab on' : 'tab'} onClick={() => setTab('support')}>
            Обращения {unread > 0 && <span className="badge">{unread}</span>}
          </button>
          <button className={tab === 'safety' ? 'tab on' : 'tab'} onClick={() => setTab('safety')}>
            Безопасность {flags.length > 0 && <span className="badge">{flags.length}</span>}
          </button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}

      {tab === 'support' ? (
        <div className="admin-layout">
          <div className="card thread-list">
            {threads.length === 0 && <p className="muted">Обращений пока нет.</p>}
            {threads.map((t) => (
              <button key={t.id} className={`thread-row${t.id === current ? ' on' : ''}${t.staffUnread ? ' unread' : ''}`} onClick={() => setCurrent(t.id)}>
                <b>{t.user?.email}</b>
                <span className="muted small">
                  {t.user && roleName[t.user.role]} · {fmtDateTime(t.updatedAt)} {t.status === 'closed' && '· закрыто'}
                </span>
                <span className="thread-last">{t.lastMessage}</span>
              </button>
            ))}
          </div>
          <div className="card">
            {thread ? (
              <>
                <div className="thread-head">
                  <div>
                    <h2 className="card-title">{thread.user?.email}</h2>
                    <span className="muted small">{thread.status === 'open' ? 'Открыто' : 'Закрыто'}</span>
                  </div>
                  <button
                    className="btn btn-light"
                    onClick={async () => {
                      const r = await api.adminSetStatus(thread.id, thread.status === 'open' ? 'closed' : 'open');
                      setThread({ ...thread, status: r.thread.status });
                      setThreads((ts) => ts.map((t) => (t.id === thread.id ? { ...t, status: r.thread.status } : t)));
                    }}
                  >
                    {thread.status === 'open' ? 'Закрыть обращение' : 'Открыть снова'}
                  </button>
                </div>
                <ChatBox
                  items={messages.map((m) => ({
                    id: m.id,
                    body: m.body,
                    mine: m.isStaff,
                    author: m.isStaff ? 'Поддержка' : 'Пользователь',
                    createdAt: m.createdAt,
                  }))}
                  onSend={async (body) => setMessages((await api.adminReply(thread.id, body)).messages)}
                  placeholder="Ответ пользователю…"
                />
              </>
            ) : (
              <p className="muted center">Выберите обращение слева.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">Заблокированные сообщения</h2>
          <p className="muted small">
            Сюда попадают сообщения, в которых просили или передавали телефон, почту, адрес, контакты в мессенджерах или фото.
          </p>
          {flags.length === 0 ? (
            <p className="muted">Нарушений нет.</p>
          ) : (
            <div className="flag-list">
              {flags.map((f) => (
                <div key={f.id} className="flag">
                  <div className="flag-head">
                    <b>{f.user?.email ?? 'удалённый пользователь'}</b>
                    <span className="chip chip-muted">{f.user ? roleName[f.user.role] : ''}</span>
                    <span className="muted small">{fmtDateTime(f.createdAt)} · {f.context.startsWith('lesson') ? 'чат урока' : 'профиль наставника'}</span>
                  </div>
                  <div className="flag-reason">{f.reason}</div>
                  <blockquote>{f.body}</blockquote>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
