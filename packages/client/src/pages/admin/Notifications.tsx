import type { AdminNotification } from '../../api';
import { fmtDateTime } from '../../format';

const kindName: Record<AdminNotification['kind'], string> = {
  support: 'Сообщение',
  'tutor-application': 'Анкета',
  post: 'Пост',
  safety: 'Безопасность',
};

/** The admin's feed: what happened on the site and needs a look. A click opens the right tab. */
export function Notifications({
  items,
  onOpen,
  onReadAll,
}: {
  items: AdminNotification[];
  onOpen: (n: AdminNotification) => void;
  onReadAll: () => void;
}) {
  return (
    <div className="card">
      <div className="thread-head">
        <h2 className="card-title">Уведомления</h2>
        {items.some((n) => !n.read) && (
          <button className="btn btn-light" onClick={onReadAll}>
            Отметить все прочитанными
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="muted">Пока ничего нового.</p>
      ) : (
        <div className="note-list">
          {items.map((n) => (
            <button key={n.id} className={`note-row${n.read ? '' : ' unread'}`} onClick={() => onOpen(n)}>
              <span className={`chip note-kind note-${n.kind}`}>{kindName[n.kind] ?? n.kind}</span>
              <span className="note-main">
                <b>{n.title}</b>
                {n.body && <span className="thread-last">{n.body}</span>}
              </span>
              <span className="muted small">{fmtDateTime(n.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
