import { useState, type FormEvent } from 'react';
import { api } from '../../api';

/** The admin changes their own password: current one, then the new one twice. */
export function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setNote({ ok: false, text: 'Новый пароль должен быть не короче 8 символов' });
    if (next !== repeat) return setNote({ ok: false, text: 'Новые пароли не совпадают' });
    setBusy(true);
    try {
      await api.changePassword(current, next);
      setCurrent('');
      setNext('');
      setRepeat('');
      setNote({ ok: true, text: 'Пароль изменён. В следующий раз входите с новым паролем.' });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : 'Не получилось сменить пароль' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card auth-card" onSubmit={submit}>
      <h2>Сменить пароль</h2>
      <label>
        Текущий пароль
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label>
        Новый пароль
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
      </label>
      <label>
        Новый пароль ещё раз
        <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required />
      </label>
      {note && <div className={note.ok ? 'success' : 'error'}>{note.text}</div>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Сохраняем…' : 'Сохранить пароль'}
      </button>
    </form>
  );
}
