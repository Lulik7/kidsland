import { lazy, Suspense, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import type { User } from './api';
import { homeFor, useAuth } from './auth';
import { Sprite } from './components/Sprite';
import { HERO } from './game/sprites';
import { AuthPage } from './pages/AuthPage';
import { KidsPage } from './pages/KidsPage';
import { Landing } from './pages/Landing';
import { LessonRoom } from './pages/LessonRoom';
import { LevelMap } from './pages/LevelMap';
import { ParentDashboard } from './pages/ParentDashboard';
import { TutorCabinet } from './pages/TutorCabinet';
import { TutorPage } from './pages/TutorPage';
import { TutorsPage } from './pages/TutorsPage';

// Blockly is heavy, so the game screen loads in its own chunk.
const PlayPage = lazy(() => import('./pages/PlayPage').then((m) => ({ default: m.PlayPage })));

function RequireAuth({ children, role }: { children: ReactNode; role?: User['role'] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-note">Загружаем…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function Header() {
  const { user, logout } = useAuth();
  const nav = (to: string, label: string) => (
    <NavLink to={to} className={({ isActive }) => `navlink${isActive ? ' on' : ''}`}>
      {label}
    </NavLink>
  );
  return (
    <header className="topbar">
      <Link to="/" className="logo">
        <Sprite svg={HERO.space('right')} size={34} />
        <span>
          Kids<b>land</b>
        </span>
      </Link>
      <nav>
        {user?.role === 'tutor' ? (
          nav('/tutor', 'Кабинет')
        ) : (
          <>
            {user && nav('/kids', 'Играть')}
            {user && nav('/parent', 'Кабинет')}
            {nav('/tutors', 'Наставники')}
          </>
        )}
        {user ? (
          <button className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Войти
            </Link>
            <Link to="/register" className="btn btn-primary hide-sm">
              Начать бесплатно
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/tutors" element={<TutorsPage />} />
        <Route path="/tutors/:id" element={<TutorPage />} />
        <Route path="/kids" element={<RequireAuth role="parent"><KidsPage /></RequireAuth>} />
        <Route path="/kids/:childId" element={<RequireAuth role="parent"><LevelMap /></RequireAuth>} />
        <Route
          path="/kids/:childId/play/:slug"
          element={
            <RequireAuth role="parent">
              <Suspense fallback={<div className="center-note">Загружаем игру…</div>}>
                <PlayPage />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="/parent" element={<RequireAuth role="parent"><ParentDashboard /></RequireAuth>} />
        <Route path="/tutor" element={<RequireAuth role="tutor"><TutorCabinet /></RequireAuth>} />
        <Route path="/lessons/:id" element={<RequireAuth><LessonRoom /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
