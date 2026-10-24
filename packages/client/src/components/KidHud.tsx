import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { Child } from '../api';
import { COIN, avatarSvg } from '../game/sprites';
import { Sprite } from './Sprite';

/** Child's header with rewards and the Games / Courses switch. */
export function KidHud({ childId, child, extra }: { childId: string; child: Child | null; extra?: ReactNode }) {
  const navigate = useNavigate();
  const tab = (to: string, label: string, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => `kid-tab${isActive ? ' on' : ''}`}>
      {label}
    </NavLink>
  );
  return (
    <div className="hud">
      <button className="hud-player" onClick={() => navigate('/kids')} title="Сменить игрока">
        <Sprite svg={avatarSvg(child?.avatarUrl)} size={48} />
        <b>{child?.nickname ?? '…'}</b>
      </button>
      <nav className="kid-tabs" aria-label="Разделы">
        {tab(`/kids/${childId}`, '🎮 Игры', true)}
        {tab(`/kids/${childId}/courses`, '📚 Курсы')}
      </nav>
      <div className="chips">
        {extra}
        <span className="chip chip-xp">{child?.xp ?? 0} XP</span>
        <span className="chip chip-coin">
          <Sprite svg={COIN} size={18} /> {child?.coins ?? 0}
        </span>
      </div>
    </div>
  );
}
