import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import type { User } from './api';
import { homeFor, useAuth } from './auth';
import { HeaderTools } from './components/HeaderTools';
import { Sprite } from './components/Sprite';
import { HERO } from './game/sprites';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { CoursePage } from './pages/CoursePage';
import { CoursesPage } from './pages/CoursesPage';
import { DemoLesson } from './pages/DemoLesson';
import { LessonPage } from './pages/LessonPage';
import { SectionPage, SectionsPage } from './pages/SectionsPage';
import { BeAdminPage } from './pages/BeAdminPage';
import { ArticlePage } from './pages/ArticlePage';
import { SupportPage } from './pages/SupportPage';
import { KidsPage } from './pages/KidsPage';
import { Landing } from './pages/Landing';
import { LessonRoom } from './pages/LessonRoom';
import { LevelMap } from './pages/LevelMap';
import { ParentDashboard } from './pages/ParentDashboard';
import { TutorCabinet } from './pages/TutorCabinet';
import { TutorPage } from './pages/TutorPage';
import { TutorsPage } from './pages/TutorsPage';
import { useT } from './i18n';

// Blockly is heavy, so the game screen loads in its own chunk.
const PlayPage = lazy(() => import('./pages/PlayPage').then((m) => ({ default: m.PlayPage })));

function RequireAuth({ children, role }: { children: ReactNode; role?: User['role'] }) {
  const t = useT();
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-note">{t('Загружаем…')}</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

interface MenuItem {
  to: string;
  label: string;
}

function menuFor(user: User | null): MenuItem[] {
  const home = { to: '/', label: 'Главная' };
  const sections = { to: '/sections', label: 'Разделы' };
  const courses = { to: '/courses', label: 'Курсы' };
  const tutors = { to: '/tutors', label: 'Наставники' };
  const support = { to: '/support', label: 'Поддержка' };
  const beAdmin = { to: '/be-admin', label: 'Побудь админом' };
  if (!user) return [home, sections, { to: '/register', label: 'Играть' }, courses, tutors, beAdmin, support];
  if (user.role === 'tutor') return [home, sections, { to: '/tutor', label: 'Кабинет' }, courses, tutors, beAdmin, support];
  if (user.role === 'admin') return [home, sections, { to: '/admin', label: 'Админ' }, courses, tutors, beAdmin, support];
  return [home, sections, { to: '/kids', label: 'Играть' }, courses, tutors, beAdmin, { to: '/parent', label: 'Кабинет' }, support];
}

function Header() {
  const t = useT();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
  }, [open]);
  const items = menuFor(user);
  const link = (m: MenuItem) => (
    <NavLink key={m.to} to={m.to} end={m.to === '/'} className={({ isActive }) => `navlink${isActive ? ' on' : ''}`}>
      {t(m.label)}
    </NavLink>
  );
  const account = user ? (
    <button className="btn btn-ghost" onClick={logout}>
      {t('Выйти')}
    </button>
  ) : (
    <>
      <Link to="/login" className="btn btn-ghost">
        {t('Войти')}
      </Link>
      <Link to="/register" className="btn btn-primary">
        {t('Начать бесплатно')}
      </Link>
    </>
  );
  return (
    <header className="topbar">
      <Link to="/" className="logo">
        <Sprite svg={HERO.space('right')} size={34} />
        <span>
          Kids<b>land</b>
        </span>
      </Link>
      <nav className="main-nav" aria-label={t('Главное меню')}>
        {items.map(link)}
      </nav>
      <HeaderTools />
      <div className="account">{account}</div>
      <button className={open ? 'burger on' : 'burger'} onClick={() => setOpen(!open)} aria-label={t('Меню')} aria-expanded={open}>
        <i />
        <i />
        <i />
      </button>
      {/* Portal: the header's backdrop-filter would otherwise clip a fixed-position drawer. */}
      {open &&
        createPortal(
        <div className="drawer-bg" onClick={() => setOpen(false)}>
          <nav className="drawer" aria-label={t('Меню')} onClick={(e) => e.stopPropagation()}>
            {items.map(link)}
            <div className="drawer-account">{account}</div>
          </nav>
        </div>,
          document.body,
        )}
    </header>
  );
}

export function App() {
  const t = useT();
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/tutors" element={<TutorsPage />} />
        <Route path="/tutors/:id" element={<TutorPage />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route path="/be-admin" element={<BeAdminPage />} />
        <Route path="/articles/:articleId" element={<ArticlePage />} />
        <Route path="/sections/:sectionId" element={<SectionPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        <Route path="/courses/:courseId/:lessonId" element={<LessonPage />} />
        <Route path="/kids/:childId/courses" element={<RequireAuth role="parent"><CoursesPage /></RequireAuth>} />
        <Route path="/kids/:childId/courses/:courseId" element={<RequireAuth role="parent"><CoursePage /></RequireAuth>} />
        <Route path="/kids/:childId/courses/:courseId/:lessonId" element={<RequireAuth role="parent"><LessonPage /></RequireAuth>} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/admin" element={<RequireAuth role="admin"><AdminPage /></RequireAuth>} />
        <Route path="/lessons/demo" element={<DemoLesson />} />
        <Route path="/kids" element={<RequireAuth role="parent"><KidsPage /></RequireAuth>} />
        <Route path="/kids/:childId" element={<RequireAuth role="parent"><LevelMap /></RequireAuth>} />
        <Route
          path="/kids/:childId/play/:slug"
          element={
            <RequireAuth role="parent">
              <Suspense fallback={<div className="center-note">{t('Загружаем игру…')}</div>}>
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
