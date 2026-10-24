import { lazy, Suspense, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Sprite } from './components/Sprite';
import { HERO } from './game/sprites';
import { AuthPage } from './pages/AuthPage';
import { KidsPage } from './pages/KidsPage';
import { Landing } from './pages/Landing';
import { LevelMap } from './pages/LevelMap';

// Blockly is heavy, so the game screen loads in its own chunk.
const PlayPage = lazy(() => import('./pages/PlayPage').then((m) => ({ default: m.PlayPage })));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-note">Загружаем…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <Link to="/" className="logo">
        <Sprite svg={HERO.space('right')} size={34} />
        <span>
          Kids<b>land</b>
        </span>
      </Link>
      <nav>
        {user ? (
          <>
            <Link to="/kids" className="btn btn-ghost">
              Игроки
            </Link>
            <button className="btn btn-ghost" onClick={logout}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Войти
            </Link>
            <Link to="/register" className="btn btn-primary">
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
        <Route path="/kids" element={<RequireAuth><KidsPage /></RequireAuth>} />
        <Route path="/kids/:childId" element={<RequireAuth><LevelMap /></RequireAuth>} />
        <Route path="/kids/:childId/play/:slug" element={<RequireAuth><Suspense fallback={<div className="center-note">Загружаем игру…</div>}><PlayPage /></Suspense></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
