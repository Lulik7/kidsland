import { CHILD_SAFETY_TIPS } from '@kidsland/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type SupportMessage } from '../api';
import { useAuth } from '../auth';
import { ChatBox, usePolling } from '../components/ChatBox';
import { Faq } from '../components/Faq';
import { Sprite } from '../components/Sprite';
import { HERO } from '../game/sprites';

const FAQ = [
  { q: 'Это бесплатно?', a: 'Первые уровни игры и все курсы для самостоятельного обучения бесплатны. Платные только премиум-уровни и уроки с наставниками, причём первый урок бесплатный.' },
  { q: 'Как добавить ребёнка?', a: 'Войдите и откройте «Играть». Там можно создать до пяти профилей детей, у каждого свой прогресс.' },
  { q: 'Как записаться на урок?', a: 'В разделе «Наставники» выберите преподавателя, день и время. Ссылка на урок появится в кабинете родителя.' },
  { q: 'Как отменить урок?', a: 'В кабинете родителя на вкладке «Уроки» нажмите «Отменить» рядом с уроком. Отменить можно до начала занятия.' },
  { q: 'Как устроена безопасность?', a: 'Общение с наставником идёт только в комнате урока на сайте. Сообщения с телефонами, почтой, адресом и просьбами прислать фото блокируются автоматически и передаются модератору.' },
  { q: 'Как стать наставником?', a: 'Зарегистрируйтесь как наставник, заполните профиль, загрузите видео-знакомство и добавьте свободное время.' },
];

export function SupportPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  usePolling(
    () => {
      if (!user) return;
      api.support().then((r) => {
        setMessages(r.messages);
        setLoaded(true);
      }).catch(() => setLoaded(true));
    },
    10_000,
    [user?.id],
  );

  return (
    <main className="page support-page">
      <section className="support-hero">
        <Sprite svg={HERO.robot('down')} size={96} className="float" />
        <div>
          <h1>Служба поддержки</h1>
          <p className="muted">Напишите нам, если что-то не получается, есть вопрос об уроке или оплате. Отвечаем в течение дня.</p>
        </div>
      </section>
      <div className="support-layout">
        <section className="card support-chat">
          <h2 className="card-title">Чат с поддержкой</h2>
          {user ? (
            <ChatBox
              items={messages.map((m) => ({
                id: m.id,
                body: m.body,
                mine: !m.isStaff,
                author: m.isStaff ? 'Поддержка Kidsland' : 'Вы',
                createdAt: m.createdAt,
              }))}
              empty={loaded ? 'Опишите вопрос, и мы ответим здесь же.' : 'Загружаем…'}
              onSend={async (body) => setMessages((await api.sendSupport(body)).messages)}
              placeholder="Ваш вопрос…"
            />
          ) : (
            <div className="empty">
              <p>Чтобы написать в поддержку, войдите в аккаунт. Так мы сможем ответить и посмотреть ваши записи.</p>
              <div className="form-actions">
                <Link to="/login?next=/support" className="btn btn-primary">Войти</Link>
                <Link to="/register" className="btn btn-light">Регистрация</Link>
              </div>
            </div>
          )}
        </section>
        <aside className="support-side">
          <div className="card">
            <h2 className="card-title">Частые вопросы</h2>
            <Faq items={FAQ} />
          </div>
          <div className="card safety-card">
            <h2 className="card-title">🛡 Правила безопасности для детей</h2>
            <ul>
              {CHILD_SAFETY_TIPS.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
