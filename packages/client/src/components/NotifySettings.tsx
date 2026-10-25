import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useT } from '../i18n';

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** "BASE64URL" → bytes, the form pushManager.subscribe wants the server key in. */
function keyBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentSub() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  return reg ? reg.pushManager.getSubscription() : null;
}

/**
 * Where lesson reminders arrive: email (always), notifications on this phone or computer,
 * and text messages to the phone number on the account.
 */
export function NotifySettings() {
  const t = useT();
  const { user } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    api.me().then((r) => setPhone(r.user.phone ?? '')).catch(() => {});
    if (supported()) currentSub().then((s) => setOn(!!s)).catch(() => {});
  }, []);

  const enable = async () => {
    setBusy(true);
    setMsg('');
    try {
      if ((await Notification.requestPermission()) !== 'granted') {
        setMsg(t('Браузер не разрешил уведомления. Разрешите их в настройках сайта и нажмите ещё раз.'));
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const { publicKey } = await api.pushKey();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      await api.pushSubscribe(sub.toJSON());
      await api.pushTest();
      setOn(true);
      setMsg(t('Готово! На этом устройстве будут появляться напоминания об уроках.'));
    } catch {
      setMsg(t('Не получилось включить уведомления на этом устройстве.'));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const sub = await currentSub();
      if (sub) {
        await api.pushUnsubscribe(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setOn(false);
      setMsg('');
    } finally {
      setBusy(false);
    }
  };

  const savePhone = async () => {
    setMsg('');
    try {
      await api.setPhone(phone.trim());
      setMsg(t('Телефон сохранён.'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('Ошибка'));
    }
  };

  if (!user) return null;
  return (
    <div className="notify-settings">
      <p className="muted small">
        {t('Напоминаем об уроке в день урока и за 30 минут до начала: письмом на {email}, уведомлением на телефоне или компьютере и SMS.', { email: user.email })}
      </p>
      <div className="ns-row">
        {supported() ? (
          on ? (
            <>
              <span className="chip">✓ {t('Уведомления на этом устройстве включены')}</span>
              <button className="btn btn-ghost" disabled={busy} onClick={disable}>
                {t('Выключить')}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={enable}>
              🔔 {t('Включить уведомления на этом устройстве')}
            </button>
          )
        ) : (
          <span className="muted small">{t('Этот браузер не умеет показывать уведомления. На iPhone добавьте сайт на экран «Домой» и откройте его оттуда.')}</span>
        )}
      </div>
      <p className="muted small">{t('Включите на каждом устройстве: на телефоне родителя, на компьютере или планшете ребёнка.')}</p>
      <label className="ns-phone">
        <span className="muted small">{t('Телефон для SMS')}</span>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+972 50 123 4567" autoComplete="tel" />
        <button className="btn btn-light" onClick={savePhone}>
          {t('Сохранить')}
        </button>
      </label>
      {msg && <div className="muted small ns-msg">{msg}</div>}
    </div>
  );
}
