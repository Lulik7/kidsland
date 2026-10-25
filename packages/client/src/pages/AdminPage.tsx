import { useState } from 'react';
import { api, type AdminNotification, type CommunityPost, type SafetyFlag, type SupportMessage, type SupportThread } from '../api';
import { ChatBox, usePolling } from '../components/ChatBox';
import { fmtDateTime } from '../format';
import { ContentEditor } from './admin/ContentEditor';
import { LessonChats } from './admin/LessonChats';
import { AdminMail, AdminPayments } from './admin/MailAndPayments';
import { Notifications } from './admin/Notifications';
import { TutorApplications } from './admin/TutorApplications';

type Tab = 'notes' | 'mail' | 'payments' | 'support' | 'tutors' | 'chats' | 'content' | 'posts' | 'safety';

const roleName = { parent: 'родитель', tutor: 'наставник', admin: 'админ' } as const;

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('notes');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotes, setUnreadNotes] = useState(0);
  const [pendingTutors, setPendingTutors] = useState(0);
  const [focusTutor, setFocusTutor] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'' | 'parent' | 'tutor'>('');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [flags, setFlags] = useState<SafetyFlag[]>([]);
  const [error, setError] = useState<string | null>(null);

  usePolling(() => {
    api.adminThreads().then((r) => setThreads(r.threads)).catch((e) => setError(e.message));
    api.safetyFlags().then((r) => setFlags(r.flags)).catch(() => {});
    api.adminPosts('pending').then((r) => setPosts(r.posts)).catch(() => {});
    loadNotes();
  }, 10_000, []);

  const loadNotes = () => {
    api
      .adminNotifications()
      .then((r) => {
        setNotifications(r.notifications);
        setUnreadNotes(r.unread);
      })
      .catch(() => {});
    api.tutorApplications('pending').then((r) => setPendingTutors(r.applications.length)).catch(() => {});
  };

  const openNote = async (n: AdminNotification) => {
    if (!n.read) {
      await api.readNotifications([n.id]).catch(() => {});
      loadNotes();
    }
    const link = n.link ?? '';
    if (link.startsWith('support:')) {
      setTab('support');
      setCurrent(link.slice(8));
    } else if (link.startsWith('tutor:')) {
      setFocusTutor(link.slice(6));
      setTab('tutors');
    } else if (link === 'posts') setTab('posts');
    else if (link === 'safety') setTab('safety');
    else if (link.startsWith('/billing/receipt/')) setTab('payments');
  };

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
  const shownThreads = threads.filter((t) => !roleFilter || t.user?.role === roleFilter);
  const tabButton = (id: Tab, label: string, count = 0) => (
    <button className={tab === id ? 'tab on' : 'tab'} onClick={() => setTab(id)}>
      {label} {count > 0 && <span className="badge">{count}</span>}
    </button>
  );

  return (
    <main className="page admin-page">
      <div className="dash-head">
        <h1 className="page-title left">Кабинет администратора</h1>
        <div className="tabs">
          {tabButton('notes', 'Уведомления', unreadNotes)}
          {tabButton('support', 'Сообщения', unread)}
          {tabButton('mail', 'Письма')}
          {tabButton('payments', 'Оплаты')}
          {tabButton('tutors', 'Преподаватели', pendingTutors)}
          {tabButton('chats', 'Чаты уроков')}
          {tabButton('content', 'Темы, статьи, уроки')}
          {tabButton('posts', 'Посты на проверку', posts.length)}
          {tabButton('safety', 'Жалобы и безопасность', flags.length)}
        </div>
      </div>
      {error && <div className="error">{error}</div>}

      {tab === 'notes' ? (
        <Notifications
          items={notifications}
          onOpen={openNote}
          onReadAll={async () => {
            await api.readNotifications().catch(() => {});
            loadNotes();
          }}
        />
      ) : tab === 'mail' ? (
        <AdminMail />
      ) : tab === 'payments' ? (
        <AdminPayments />
      ) : tab === 'tutors' ? (
        <TutorApplications focus={focusTutor} onChanged={loadNotes} />
      ) : tab === 'chats' ? (
        <LessonChats />
      ) : tab === 'content' ? (
        <ContentEditor />
      ) : tab === 'support' ? (
        <div className="admin-layout">
          <div className="card thread-list">
            <div className="chips-row">
              {(
                [
                  ['', 'Все'],
                  ['parent', 'Родители'],
                  ['tutor', 'Наставники'],
                ] as const
              ).map(([id, label]) => (
                <button key={id} className={roleFilter === id ? 'fchip on' : 'fchip'} onClick={() => setRoleFilter(id)}>
                  {label}
                </button>
              ))}
            </div>
            {shownThreads.length === 0 && <p className="muted">Сообщений пока нет.</p>}
            {shownThreads.map((t) => (
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
      ) : tab === 'posts' ? (
        <div className="card">
          <h2 className="card-title">Посты «Побудь админом»</h2>
          <p className="muted small">Пост увидят все только после одобрения. При отказе автор увидит ваш комментарий.</p>
          {posts.length === 0 ? (
            <p className="muted">Новых постов нет.</p>
          ) : (
            <div className="flag-list">
              {posts.map((p) => (
                <div key={p.id} className="flag">
                  <div className="flag-head">
                    <b>{p.authorName}</b>
                    <span className="muted small">{p.author?.email} · {fmtDateTime(p.createdAt)}</span>
                  </div>
                  <h3 className="post-title">{p.title}</h3>
                  <blockquote className="post-body">{p.body}</blockquote>
                  <input
                    placeholder="Комментарий автору (необязательно)"
                    value={notes[p.id] ?? ''}
                    onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                  />
                  <div className="post-actions">
                    <button
                      className="btn btn-go"
                      onClick={async () => {
                        await api.reviewPost(p.id, 'approve', notes[p.id]);
                        setPosts((ps) => ps.filter((x) => x.id !== p.id));
                      }}
                    >
                      Одобрить и опубликовать
                    </button>
                    <button
                      className="btn btn-light"
                      onClick={async () => {
                        await api.reviewPost(p.id, 'reject', notes[p.id]);
                        setPosts((ps) => ps.filter((x) => x.id !== p.id));
                      }}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    <span className="muted small">{fmtDateTime(f.createdAt)} · {f.context.startsWith('lesson') ? 'чат урока' : f.context === 'post' ? 'пост «Побудь админом»' : 'профиль наставника'}</span>
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
