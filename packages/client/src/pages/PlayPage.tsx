import { runProgram, type FailReason, type Point, type Program, type RobotState } from '@kidsland/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type AttemptResult, type LevelDetail } from '../api';
import { BlocklyEditor, type EditorHandle } from '../game/BlocklyEditor';
import { Confetti } from '../components/Confetti';
import { Sprite } from '../components/Sprite';
import { GameCanvas } from '../game/GameCanvas';
import { COIN, GOAL, HERO } from '../game/sprites';
import { plural } from '../plural';
import { THEMES } from '../themes';
import { Stars } from './LevelMap';
import { useT } from '../i18n';

const FAIL_TEXT: Record<FailReason, string> = {
  crashed: 'Ой! Впереди препятствие. Попробуй другой путь.',
  not_at_goal: 'Почти! Герой не дошёл до цели.',
  coins_left: 'До цели дошли, но остались монеты. Собери все!',
  too_many_steps: 'Программа слишком долгая, похоже на бесконечный цикл.',
  empty_program: 'Прикрепи блоки под блок «Старт».',
};

const SPEEDS = { normal: 420, fast: 160 };

type Phase = 'edit' | 'running' | 'done';

export function PlayPage() {
  const t = useT();
  const { childId = '', slug = '' } = useParams();
  // Without a child profile this is the guest trial from the landing page: free levels, nothing saved.
  const guest = !childId;
  const home = guest ? '/' : `/kids/${childId}`;
  const playPath = (s: string) => (guest ? `/play/${s}` : `/kids/${childId}/play/${s}`);
  const navigate = useNavigate();
  const editor = useRef<EditorHandle>(null);
  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [saved, setSaved] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [robot, setRobot] = useState<RobotState | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [trail, setTrail] = useState<Point[]>([]);
  const [phase, setPhase] = useState<Phase>('edit');
  const [blockCount, setBlockCount] = useState(0);
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>('normal');
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const timer = useRef<number>(0);

  const resetRobot = useCallback((l: LevelDetail) => {
    window.clearTimeout(timer.current);
    editor.current?.highlight(null);
    setRobot({ x: l.config.start.x, y: l.config.start.y, dir: l.config.start.dir, collected: [] });
    setTrail([]);
    setCrashed(false);
    setPhase('edit');
  }, []);

  useEffect(() => {
    setLevel(null);
    setResult(null);
    setError(null);
    (guest ? api.publicLevel(slug) : api.level(childId, slug))
      .then((r) => {
        setLevel(r.level);
        setSaved(r.savedProgram);
        resetRobot(r.level);
      })
      .catch((e) => setError(e.message));
    return () => window.clearTimeout(timer.current);
  }, [guest, childId, slug, resetRobot]);

  const run = () => {
    if (!level || !editor.current) return;
    const program = editor.current.getProgram();
    resetRobot(level);
    setPhase('running');
    const local = runProgram(level.config, program);
    // The server re-checks the program and grants rewards; start it now so it is ready when the animation ends.
    const submitted: Promise<AttemptResult> = guest
      ? Promise.resolve({
          success: local.success,
          failReason: local.failReason ?? null,
          stars: local.stars,
          bestStars: Math.max(local.stars, level.stars),
          score: local.score,
          blocksUsed: local.blocksUsed,
          rewards: { xp: 0, coins: 0 },
          child: { xp: 0, coins: 0 },
        })
      : api.submit(childId, level.slug, program);
    const stepMs = SPEEDS[speed];
    let i = 0;
    const finish = async () => {
      editor.current?.highlight(null);
      try {
        const r = await submitted;
        setResult(r);
        setLevel({ ...level, stars: r.bestStars });
        if (r.success) {
          const { levels } = guest ? await api.publicLevels() : await api.levels(childId);
          const idx = levels.findIndex((l) => l.slug === level.slug);
          const next = levels[idx + 1];
          setNextSlug(next && (guest ? !next.isPremium : next.unlocked) ? next.slug : null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t('Ошибка сохранения'));
      }
      setPhase('done');
    };
    const step = () => {
      const s = local.trace[i];
      if (!s) {
        void finish();
        return;
      }
      setRobot(s.state);
      if (s.event === 'move') setTrail((tr) => [...tr, { x: s.state.x, y: s.state.y }]);
      if (s.event === 'bump') setCrashed(true);
      editor.current?.highlight(s.blockId ?? null);
      i++;
      timer.current = window.setTimeout(step, s.event === 'check' ? stepMs / 2 : stepMs);
    };
    timer.current = window.setTimeout(step, 150);
  };

  if (error && !level) {
    return (
      <div className="center-note">
        {error} <Link to={home}>{guest ? t('На главную') : t('К карте')}</Link>
      </div>
    );
  }
  if (!level || !robot) return <div className="center-note">{t('Загружаем уровень…')}</div>;

  const th = THEMES[level.theme];
  const max = level.config.maxBlocks ?? 0;
  const coinsTotal = level.config.coins.length;
  const overOptimal = blockCount > level.config.optimalBlocks;

  return (
    <main className="play" style={{ ['--world' as string]: th.bg, ['--world2' as string]: th.bg2 }}>
      <div className="play-head">
        <Link to={home} className="btn btn-light btn-round" aria-label={guest ? t('На главную') : t('К карте')}>
          ←
        </Link>
        <Sprite svg={HERO[level.theme]('right')} size={52} className="play-hero" />
        <div className="play-title">
          <span className="play-world">
            {t(th.name)} · {t('уровень')} {level.order}
          </span>
          <h1>{t(level.title)}</h1>
          <p>{t(level.description)}</p>
        </div>
        <Stars n={level.stars} size={26} />
      </div>
      {guest && (
        <div className="guest-note">
          {t('Пробный режим: прогресс не сохраняется.')} <Link to="/register">{t('Зарегистрируйтесь бесплатно')}</Link>{t(', чтобы копить звёзды, опыт и монеты.')}
        </div>
      )}
      <div className="play-body">
        <section className={`editor-pane${phase === 'running' ? ' running' : ''}`}>
          <div className="pane-head">
            <b>{t('Твоя программа')}</b>
            <span className={`block-meter${overOptimal ? ' over' : ''}`}>
              {t('Блоков:')}{' '}{blockCount}
              {max > 0 && ` / ${max}`}
              <small>{t('на 3 звезды:')}{' '}{level.config.optimalBlocks}</small>
            </span>
          </div>
          <BlocklyEditor
            key={level.slug}
            ref={editor}
            availableBlocks={level.config.availableBlocks}
            initialProgram={saved}
            onBlockCount={setBlockCount}
          />
        </section>
        <section className="stage-pane">
          <div className="stage">
            <GameCanvas
              config={level.config}
              theme={level.theme}
              state={robot}
              trail={trail}
              crashed={crashed}
              stepMs={SPEEDS[speed]}
            />
            <div className="stage-goal">
              <Sprite svg={GOAL[level.theme]} size={22} />{' '}{t('Доберись до цели')}
              {coinsTotal > 0 && (
                <>
                  {' '}
                  {t('и собери')}{' '}<Sprite svg={COIN} size={20} /> {robot.collected.length}/{coinsTotal}
                </>
              )}
            </div>
          </div>
          {level.config.hint && (
            <div className="hint-box">
              <b>{t('Подсказка.')}</b> {t(level.config.hint)}
            </div>
          )}
          <div className="controls">
            <button
              className="btn btn-go btn-xl"
              onClick={run}
              disabled={phase === 'running' || (max > 0 && blockCount > max)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                <path d="M7 4l13 8-13 8z" fill="currentColor" />
              </svg>
              {t('Запустить')}
            </button>
            <button className="btn btn-light" onClick={() => resetRobot(level)} disabled={phase === 'running'}>
              {t('Сначала')}
            </button>
            <button className="btn btn-light" onClick={() => setSpeed(speed === 'normal' ? 'fast' : 'normal')}>
              {t('Скорость:')}{' '}{speed === 'normal' ? t('обычная') : t('быстрая')}
            </button>
          </div>
        </section>
      </div>

      {phase === 'done' && result && (
        <div className="modal-bg">
          {result.success && <Confetti />}
          <div className="modal">
            {result.success ? (
              <>
                <Sprite svg={GOAL[level.theme]} size={96} className="pop-in" />
                <h2>{t('Уровень пройден!')}</h2>
                <Stars n={result.stars} size={48} />
                <p>
                  {t('Программа из')}{' '}{result.blocksUsed} {plural(result.blocksUsed, [t('блока'), t('блоков'), t('блоков')])}.
                  {result.stars < 3 && ` ${t('Попробуй уложиться в {n} блоков, чтобы получить три звезды.', { n: level.config.optimalBlocks })}`}
                </p>
                {(result.rewards.xp > 0 || result.rewards.coins > 0) && (
                  <div className="rewards">
                    <span className="chip chip-xp">+{result.rewards.xp} XP</span>
                    <span className="chip chip-coin">
                      +{result.rewards.coins} <Sprite svg={COIN} size={18} />
                    </span>
                  </div>
                )}
                <div className="modal-actions">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      setResult(null);
                      resetRobot(level);
                    }}
                  >
                    {t('Ещё раз')}
                  </button>
                  {nextSlug ? (
                    <button className="btn btn-primary" onClick={() => navigate(playPath(nextSlug))}>
                      {t('Следующий уровень')}
                    </button>
                  ) : (
                    <Link className="btn btn-primary" to={guest ? '/register' : home}>
                      {guest ? t('Зарегистрироваться') : t('К карте')}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <Sprite svg={HERO[level.theme]('down')} size={88} className="wobble" />
                <h2>{t('Почти получилось!')}</h2>
                <p>{t(FAIL_TEXT[result.failReason ?? 'not_at_goal'])}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setResult(null);
                    resetRobot(level);
                  }}
                >
                  {t('Попробовать снова')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
