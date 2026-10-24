import { runProgram, type FailReason, type Program, type RobotState } from '@kidsland/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type AttemptResult, type LevelDetail } from '../api';
import { BlocklyEditor, type EditorHandle } from '../game/BlocklyEditor';
import { GameCanvas } from '../game/GameCanvas';
import { THEMES } from '../themes';
import { Stars } from './LevelMap';

const FAIL_TEXT: Record<FailReason, string> = {
  crashed: 'Ой! Впереди препятствие. Попробуй другой путь.',
  not_at_goal: 'Почти! Герой не дошёл до цели.',
  coins_left: 'До цели дошли, но остались монеты. Собери все!',
  too_many_steps: 'Программа слишком долгая, похоже на бесконечный цикл.',
  empty_program: 'Прикрепи блоки под «▶ Старт».',
};

const SPEEDS = { normal: 420, fast: 160 };

type Phase = 'edit' | 'running' | 'done';

export function PlayPage() {
  const { childId = '', slug = '' } = useParams();
  const navigate = useNavigate();
  const editor = useRef<EditorHandle>(null);
  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [saved, setSaved] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [robot, setRobot] = useState<RobotState | null>(null);
  const [crashed, setCrashed] = useState(false);
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
    setCrashed(false);
    setPhase('edit');
  }, []);

  useEffect(() => {
    setLevel(null);
    setResult(null);
    setError(null);
    api
      .level(childId, slug)
      .then((r) => {
        setLevel(r.level);
        setSaved(r.savedProgram);
        resetRobot(r.level);
      })
      .catch((e) => setError(e.message));
    return () => window.clearTimeout(timer.current);
  }, [childId, slug, resetRobot]);

  const run = () => {
    if (!level || !editor.current) return;
    const program = editor.current.getProgram();
    resetRobot(level);
    setPhase('running');
    const local = runProgram(level.config, program);
    // The server re-checks the program and grants rewards; start it now so it is ready when the animation ends.
    const submitted = api.submit(childId, level.slug, program);
    const stepMs = SPEEDS[speed];
    let i = 0;
    const finish = async () => {
      editor.current?.highlight(null);
      try {
        const r = await submitted;
        setResult(r);
        setLevel({ ...level, stars: r.bestStars });
        if (r.success) {
          const { levels } = await api.levels(childId);
          const idx = levels.findIndex((l) => l.slug === level.slug);
          const next = levels[idx + 1];
          setNextSlug(next && next.unlocked ? next.slug : null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения');
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
        {error} <Link to={`/kids/${childId}`}>К карте</Link>
      </div>
    );
  }
  if (!level || !robot) return <div className="center-note">Загружаем уровень…</div>;

  const t = THEMES[level.theme];
  const max = level.config.maxBlocks ?? 0;

  return (
    <main className="play" style={{ ['--accent' as string]: t.accent }}>
      <div className="play-head">
        <Link to={`/kids/${childId}`} className="btn btn-ghost">
          ← Карта
        </Link>
        <div>
          <h1>
            {level.order}. {level.title}
          </h1>
          <p className="muted">{level.description}</p>
        </div>
        <Stars n={level.stars} />
      </div>
      <div className="play-body">
        <section className={`editor-pane${phase === 'running' ? ' running' : ''}`}>
          <BlocklyEditor
            key={level.slug}
            ref={editor}
            availableBlocks={level.config.availableBlocks}
            initialProgram={saved}
            onBlockCount={setBlockCount}
          />
          <div className="editor-foot">
            <span>
              Блоков: <b>{blockCount}</b>
              {max > 0 && ` / ${max}`} · на 3 звезды: {level.config.optimalBlocks}
            </span>
          </div>
        </section>
        <section className="stage-pane">
          <div className="stage" style={{ background: t.bg }}>
            <GameCanvas config={level.config} theme={level.theme} state={robot} crashed={crashed} stepMs={SPEEDS[speed]} />
          </div>
          {level.config.hint && <div className="hint-box">💡 {level.config.hint}</div>}
          <div className="controls">
            <button className="btn btn-primary btn-lg" onClick={run} disabled={phase === 'running' || (max > 0 && blockCount > max)}>
              ▶ Запустить
            </button>
            <button className="btn btn-ghost" onClick={() => resetRobot(level)} disabled={phase === 'running'}>
              ⟲ Сначала
            </button>
            <button className="btn btn-ghost" onClick={() => setSpeed(speed === 'normal' ? 'fast' : 'normal')}>
              {speed === 'normal' ? '🐢 Обычно' : '🐇 Быстро'}
            </button>
          </div>
        </section>
      </div>

      {phase === 'done' && result && (
        <div className="modal-bg">
          <div className="card modal">
            {result.success ? (
              <>
                <div className="modal-icon">🎉</div>
                <h2>Уровень пройден!</h2>
                <Stars n={result.stars} />
                <p>
                  Блоков: {result.blocksUsed}
                  {result.stars < 3 && ` · попробуй уложиться в ${level.config.optimalBlocks} для трёх звёзд`}
                </p>
                {(result.rewards.xp > 0 || result.rewards.coins > 0) && (
                  <div className="rewards">
                    <span>+{result.rewards.xp} XP</span>
                    <span>+{result.rewards.coins} 🪙</span>
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => { setResult(null); resetRobot(level); }}>
                    Ещё раз
                  </button>
                  {nextSlug ? (
                    <button className="btn btn-primary" onClick={() => navigate(`/kids/${childId}/play/${nextSlug}`)}>
                      Следующий уровень →
                    </button>
                  ) : (
                    <Link className="btn btn-primary" to={`/kids/${childId}`}>
                      К карте
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="modal-icon">🤔</div>
                <h2>Не получилось</h2>
                <p>{FAIL_TEXT[result.failReason ?? 'not_at_goal']}</p>
                <button className="btn btn-primary" onClick={() => { setResult(null); resetRobot(level); }}>
                  Попробовать снова
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
