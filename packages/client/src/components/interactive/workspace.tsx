import { useState, type ReactNode } from 'react';
import type { Tc } from './kit';

/** One part of an editor window: where it is on the picture and what it is for. */
interface Part {
  id: string;
  name: string;
  about: string;
  /** CSS grid area of the mock window. */
  area: string;
  body: (run: boolean) => ReactNode;
}

interface Env {
  title: string;
  app: string;
  /** grid-template-areas of the window, rows top to bottom. */
  grid: string[];
  columns: string;
  rows: string;
  parts: Part[];
  runLabel: string;
  tools: { name: string; url: string; about: string; tag: string }[];
}

const code = (lines: string[]) => (
  <pre className="ws-code">
    {lines.map((l, i) => (
      <span key={i}>
        <i>{i + 1}</i>
        {l}
        {'\n'}
      </span>
    ))}
  </pre>
);

const ENVS: Record<string, Env> = {
  python: {
    title: 'Рабочая среда Python: Thonny',
    app: 'Thonny — untitled.py',
    grid: ['bar bar', 'edit vars', 'shell vars'],
    columns: '2fr 1fr',
    rows: 'auto 1fr auto',
    runLabel: '▶ Запустить (F5)',
    parts: [
      { id: 'bar', area: 'bar', name: 'Панель кнопок', about: 'Новый файл, открыть, сохранить и зелёная кнопка ▶, которая запускает программу.', body: () => <span className="ws-tools">📄 📂 💾 <b className="ws-run">▶</b> 🐞 ⏹</span> },
      { id: 'edit', area: 'edit', name: 'Редактор кода', about: 'Здесь пишут программу. Строки пронумерованы, слова подсвечиваются разными цветами.', body: () => code(['name = "Соня"', 'print("Привет,", name)', 'print(2 + 3)']) },
      { id: 'shell', area: 'shell', name: 'Оболочка (Shell)', about: 'Сюда программа выводит ответы. Здесь же можно набрать одну команду и сразу увидеть результат.', body: (run) => <pre className="ws-out">{run ? '>>> %Run untitled.py\nПривет, Соня\n5\n>>> ' : '>>> '}</pre> },
      { id: 'vars', area: 'vars', name: 'Переменные', about: 'Thonny показывает, что лежит в каждой переменной. Очень удобно искать ошибки.', body: (run) => <pre className="ws-out">{run ? 'name   "Соня"' : '—'}</pre> },
    ],
    tools: [
      { name: 'Thonny', url: 'https://thonny.org', about: 'Самый простой редактор для первых программ: Python уже внутри, есть пошаговый запуск.', tag: 'Для начала' },
      { name: 'Trinket', url: 'https://trinket.io/python', about: 'Python прямо в браузере, ничего не нужно устанавливать.', tag: 'В браузере' },
      { name: 'Mu Editor', url: 'https://codewith.mu', about: 'Простой редактор с режимами для игр и микроконтроллеров.', tag: 'Для начала' },
      { name: 'Replit', url: 'https://replit.com', about: 'Онлайн-среда: можно сохранять проекты и делиться ссылкой.', tag: 'В браузере' },
      { name: 'VS Code', url: 'https://code.visualstudio.com', about: 'Профессиональный редактор. Пригодится, когда программы станут большими.', tag: 'Потом' },
    ],
  },
  web: {
    title: 'Рабочая среда для сайтов: редактор и браузер',
    app: 'VS Code — my-site',
    grid: ['files edit view', 'files edit view'],
    columns: '0.8fr 2fr 1.6fr',
    rows: '1fr 1fr',
    runLabel: '▶ Показать страницу',
    parts: [
      { id: 'files', area: 'files', name: 'Файлы проекта', about: 'Все файлы сайта лежат в одной папке: страница index.html, оформление style.css, картинки.', body: () => <pre className="ws-out">{'📁 my-site\n  📄 index.html\n  🎨 style.css\n  🖼 cat.png'}</pre> },
      { id: 'edit', area: 'edit', name: 'Редактор', about: 'Здесь пишут HTML и CSS. Редактор подсказывает теги и закрывает скобки.', body: () => code(['<h1>Мой сайт</h1>', '<p>Я люблю котов!</p>', '<button>Мяу</button>']) },
      { id: 'view', area: 'view', name: 'Браузер', about: 'Готовую страницу открывают в браузере. Сохранил файл, обновил страницу, и видно результат.', body: (run) => <div className="ws-page">{run ? <><h4>Мой сайт</h4><p>Я люблю котов!</p><span className="ws-fakebtn">Мяу</span></> : <span className="muted">⟳</span>}</div> },
    ],
    tools: [
      { name: 'CodePen', url: 'https://codepen.io', about: 'HTML, CSS и JavaScript в браузере, результат виден сразу под кодом.', tag: 'В браузере' },
      { name: 'JSFiddle', url: 'https://jsfiddle.net', about: 'Быстро попробовать кусочек кода и поделиться ссылкой.', tag: 'В браузере' },
      { name: 'StackBlitz', url: 'https://stackblitz.com', about: 'Целый проект в браузере, как на настоящем компьютере.', tag: 'Потом' },
      { name: 'VS Code', url: 'https://code.visualstudio.com', about: 'Главный редактор веб-разработчиков. С расширением Live Server страница обновляется сама.', tag: 'Для начала' },
    ],
  },
  scratch: {
    title: 'Рабочая среда Scratch',
    app: 'Scratch — Мой проект',
    grid: ['blocks script stage', 'blocks script sprites'],
    columns: '1fr 2fr 1.4fr',
    rows: '1.4fr 1fr',
    runLabel: '🏁 Зелёный флажок',
    parts: [
      { id: 'blocks', area: 'blocks', name: 'Палитра блоков', about: 'Блоки разложены по цветным группам: движение, внешность, звук, события, управление.', body: () => <div className="ws-palette">{[['#4c97ff', 'Движение'], ['#9966ff', 'Внешность'], ['#cf63cf', 'Звук'], ['#ffbf00', 'События'], ['#ffab19', 'Управление']].map(([c, n]) => <span key={n} style={{ background: c }}>{n}</span>)}</div> },
      { id: 'script', area: 'script', name: 'Область скриптов', about: 'Сюда перетаскивают блоки и складывают их друг под друга, как конструктор.', body: () => <div className="ws-blocks"><span style={{ background: '#ffbf00' }}>когда 🏁 нажат</span><span style={{ background: '#4c97ff' }}>идти 10 шагов</span><span style={{ background: '#9966ff' }}>сказать «Привет!»</span></div> },
      { id: 'stage', area: 'stage', name: 'Сцена', about: 'Здесь живут спрайты и видно, как работает программа. Над сценой флажок 🏁 и стоп ⏹.', body: (run) => <div className="ws-stage"><span className={run ? 'ws-cat go' : 'ws-cat'}>🐱{run && <em>Привет!</em>}</span></div> },
      { id: 'sprites', area: 'sprites', name: 'Спрайты и фоны', about: 'Список персонажей. Выбери спрайт, и в области скриптов появятся его скрипты.', body: () => <span className="ws-tools">🐱 🐶 ⭐ ＋</span> },
    ],
    tools: [
      { name: 'Scratch онлайн', url: 'https://scratch.mit.edu/projects/editor', about: 'Редактор в браузере. С аккаунтом проекты сохраняются и ими можно делиться.', tag: 'Для начала' },
      { name: 'Scratch для компьютера', url: 'https://scratch.mit.edu/download', about: 'То же самое без интернета: проекты хранятся на компьютере.', tag: 'Без интернета' },
      { name: 'ScratchJr', url: 'https://www.scratchjr.org', about: 'Для самых маленьких, 5–7 лет: на планшете, блоки с картинками.', tag: 'Малышам' },
    ],
  },
  roblox: {
    title: 'Рабочая среда Roblox Studio',
    app: 'Roblox Studio — Baseplate',
    grid: ['bar bar bar', 'tool view explorer', 'tool out props'],
    columns: '0.9fr 2.2fr 1fr',
    rows: 'auto 1.6fr 1fr',
    runLabel: '▶ Play',
    parts: [
      { id: 'bar', area: 'bar', name: 'Лента инструментов', about: 'Вкладки Home, Model, Test. Кнопка ▶ Play запускает игру прямо в студии.', body: () => <span className="ws-tools">Home · Model · Test <b className="ws-run">▶</b></span> },
      { id: 'tool', area: 'tool', name: 'Toolbox', about: 'Готовые модели и детали: деревья, машины, звуки. Перетащи в мир.', body: () => <span className="ws-tools">🌳 🚗 🏠 🔊</span> },
      { id: 'view', area: 'view', name: 'Окно мира (Viewport)', about: 'Трёхмерный мир игры. Мышкой крутят камеру, детали двигают и растягивают.', body: (run) => <div className="ws-stage ws-3d"><span className={run ? 'ws-cat go' : 'ws-cat'}>🧍</span><span className="ws-block3d" /></div> },
      { id: 'explorer', area: 'explorer', name: 'Explorer', about: 'Дерево всего, что есть в игре: Workspace с деталями, игроки, скрипты.', body: () => <pre className="ws-out">{'Workspace\n  Baseplate\n  Part\n    Script'}</pre> },
      { id: 'props', area: 'props', name: 'Properties', about: 'Свойства выбранной детали: цвет, размер, прозрачность, закреплена ли она.', body: () => <pre className="ws-out">{'Color   🟥\nAnchored ☑'}</pre> },
      { id: 'out', area: 'out', name: 'Output', about: 'Сюда скрипты на Lua пишут сообщения и ошибки.', body: (run) => <pre className="ws-out">{run ? 'Привет из Roblox!' : ''}</pre> },
    ],
    tools: [
      { name: 'Roblox Studio', url: 'https://create.roblox.com', about: 'Бесплатная студия для создания игр Roblox. Нужен аккаунт Roblox (для детей — с родителем).', tag: 'Для начала' },
      { name: 'Документация Roblox', url: 'https://create.roblox.com/docs', about: 'Уроки и справочник по Lua от создателей Roblox.', tag: 'Справка' },
      { name: 'VS Code + Rojo', url: 'https://rojo.space', about: 'Для больших проектов: писать скрипты в VS Code и переносить в студию.', tag: 'Потом' },
    ],
  },
  unity: {
    title: 'Рабочая среда Unity',
    app: 'Unity — SampleScene',
    grid: ['bar bar bar', 'hier scene insp', 'proj proj insp'],
    columns: '0.9fr 2.2fr 1.1fr',
    rows: 'auto 1.6fr 1fr',
    runLabel: '▶ Play',
    parts: [
      { id: 'bar', area: 'bar', name: 'Панель инструментов', about: 'Инструменты для движения и поворота объектов и кнопка ▶ Play, которая запускает игру.', body: () => <span className="ws-tools">✋ ✥ ⟳ ⤢ <b className="ws-run">▶</b> ⏸</span> },
      { id: 'hier', area: 'hier', name: 'Hierarchy', about: 'Список объектов сцены: камера, свет, игрок, земля.', body: () => <pre className="ws-out">{'Main Camera\nDirectional Light\nPlayer\nGround'}</pre> },
      { id: 'scene', area: 'scene', name: 'Scene и Game', about: 'Scene — где строят уровень. Game — как игру увидит игрок после ▶.', body: (run) => <div className="ws-stage ws-3d"><span className={run ? 'ws-cat go' : 'ws-cat'}>🟦</span><span className="ws-block3d" /></div> },
      { id: 'insp', area: 'insp', name: 'Inspector', about: 'Компоненты выбранного объекта: Transform, Rigidbody, скрипты на C# и их настройки.', body: () => <pre className="ws-out">{'Transform\n Position 0 1 0\nRigidbody\nPlayerMove.cs'}</pre> },
      { id: 'proj', area: 'proj', name: 'Project и Console', about: 'Project — все файлы игры: скрипты, модели, звуки. Console показывает сообщения и ошибки.', body: (run) => <pre className="ws-out">{run ? '📁 Assets  📄 PlayerMove.cs\nConsole: Игра началась!' : '📁 Assets  📄 PlayerMove.cs'}</pre> },
    ],
    tools: [
      { name: 'Unity Hub и Unity Personal', url: 'https://unity.com/download', about: 'Бесплатная версия для учёбы. Через Hub ставят редактор и создают проекты.', tag: 'Для начала' },
      { name: 'Visual Studio Community', url: 'https://visualstudio.microsoft.com/vs/community', about: 'Редактор для скриптов на C#, ставится вместе с Unity и подсказывает команды.', tag: 'Для скриптов' },
      { name: 'VS Code', url: 'https://code.visualstudio.com', about: 'Лёгкий редактор для C#, если компьютер не очень мощный.', tag: 'Для скриптов' },
      { name: 'Unity Learn', url: 'https://learn.unity.com', about: 'Официальные бесплатные курсы и проекты для начинающих.', tag: 'Справка' },
    ],
  },
};

/** Which picture a course's first lesson starts with. */
export const workspaceFor = (subject: string) => (subject in ENVS ? subject : null);

/**
 * A tour of the working environment for a programming language: a picture of the editor window
 * where each part lights up with its explanation, a run button, and editors to try at home.
 */
export function Workspace({ subject, tc }: { subject: string; tc: Tc }) {
  const env = ENVS[subject];
  const [on, setOn] = useState(env?.parts[0].id ?? '');
  const [run, setRun] = useState(false);
  if (!env) return null;
  const part = env.parts.find((p) => p.id === on) ?? env.parts[0];
  return (
    <figure className="music-diagram workspace">
      <figcaption className="md-title">{tc(env.title)}</figcaption>
      <div className="ws-window">
        <div className="ws-titlebar">
          <i />
          <i />
          <i />
          <span>{env.app}</span>
        </div>
        <div className="ws-grid" style={{ gridTemplateAreas: env.grid.map((r) => `"${r}"`).join(' '), gridTemplateColumns: env.columns, gridTemplateRows: env.rows }}>
          {env.parts.map((p, i) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              className={`ws-part${p.id === on ? ' on' : ''}`}
              style={{ gridArea: p.area }}
              onClick={() => setOn(p.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOn(p.id)}
            >
              <span className="ws-n">{i + 1}</span>
              <small>{tc(p.name)}</small>
              {p.body(run)}
            </div>
          ))}
        </div>
      </div>
      <div className="scene-controls">
        <button type="button" className="btn btn-go btn-small" onClick={() => setRun((r) => !r)}>
          {run ? `⏹ ${tc('Остановить')}` : tc(env.runLabel)}
        </button>
        <span className="ws-about">
          <b>
            {env.parts.indexOf(part) + 1}. {tc(part.name)}
          </b>{' '}
          — {tc(part.about)}
        </span>
      </div>
      <div className="ws-tools-list">
        <h4>{tc('Где программировать дома')}</h4>
        <ul>
          {env.tools.map((x) => (
            <li key={x.name}>
              <a href={x.url} target="_blank" rel="noopener noreferrer">
                {x.name}
              </a>{' '}
              <span className="ws-tag">{tc(x.tag)}</span>
              <br />
              <small className="muted">{tc(x.about)}</small>
            </li>
          ))}
        </ul>
        <p className="small muted">{tc('Все эти программы бесплатные. Устанавливайте их вместе со взрослым.')}</p>
      </div>
    </figure>
  );
}
