import { useState } from 'react';
import type { Tc } from './parts';
import { usePlayer } from './player';
import { playNote } from './sound';

const N: Record<string, number> = { G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, 'F#4': 66, G4: 67, A4: 69, B4: 71, C5: 72, 'C#5': 73, D5: 74, E5: 76, F5: 77, 'F#5': 78, G5: 79 };
type Tune = [string, number][];
const play = (player: ReturnType<typeof usePlayer>, tune: Tune, bpm: number) =>
  player.play(tune.map(([n, b]) => ({ beats: b, play: (at: number) => playNote(N[n], b * (60 / bpm) * 0.9, at, 0.33) })), bpm);

const COMPOSERS: Record<string, { name: string; years: string; country: string; pic: string; photo?: string; piece: string; tune: Tune; bpm: number; facts: string[] }> = {
  Бах: {
    name: 'Иоганн Себастьян Бах',
    years: '1685–1750',
    country: 'Германия',
    pic: '1f3b9',
    piece: 'Менуэт соль мажор (из Нотной тетради Анны Магдалены Бах)',
    bpm: 132,
    tune: [['D5', 1], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['G4', 1], ['G4', 1], ['E5', 1], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['G5', 1], ['G4', 1], ['G4', 1], ['C5', 1], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 1], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 1], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['G4', 0.5], ['A4', 3]],
    facts: ['Играл на органе в церкви и писал музыку почти каждую неделю.', 'В его семье было больше пятидесяти музыкантов.', 'Другие известные произведения: «Токката и фуга ре минор», «Бранденбургские концерты».'],
  },
  Моцарт: {
    name: 'Вольфганг Амадей Моцарт',
    years: '1756–1791',
    country: 'Австрия',
    pic: '1f3bb',
    piece: '«Маленькая ночная серенада»',
    bpm: 132,
    tune: [['G4', 1], ['D4', 0.5], ['G4', 1], ['D4', 0.5], ['G4', 0.5], ['D4', 0.5], ['G4', 0.5], ['B4', 0.5], ['D5', 2], ['C5', 1], ['A4', 0.5], ['C5', 1], ['A4', 0.5], ['C5', 0.5], ['A4', 0.5], ['F#4', 0.5], ['A4', 0.5], ['D4', 2]],
    facts: ['В шесть лет уже выступал перед королями Европы.', 'Написал больше 600 произведений, в том числе оперу «Волшебная флейта».', 'Песенка «Мерцай, мерцай, звёздочка» известна по его вариациям «Ах, скажу я вам, мама».'],
  },
  Чайковский: {
    name: 'Пётр Ильич Чайковский',
    years: '1840–1893',
    country: 'Россия',
    pic: '1fa70',
    piece: 'Тема лебедей из балета «Лебединое озеро»',
    bpm: 84,
    tune: [['F#5', 3], ['B4', 0.5], ['C#5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 1.5], ['D5', 0.5], ['F#5', 1.5], ['D5', 0.5], ['F#5', 1.5], ['B4', 0.5], ['D5', 0.5], ['B4', 0.5], ['G4', 0.5], ['D5', 0.5], ['B4', 3]],
    facts: ['Учился на юриста, а потом стал композитором.', 'Написал три балета: «Лебединое озеро», «Спящая красавица» и «Щелкунчик».', 'Его «Детский альбом» из 24 пьес написан специально для детей.'],
  },
};

/** A composer card: years, country, a few facts and the start of a famous piece to listen to. */
export function ComposerCard({ tc, id }: { tc: Tc; id: string }) {
  const c = COMPOSERS[id];
  const player = usePlayer();
  const [noPhoto, setNoPhoto] = useState(false);
  if (!c) return null;
  return (
    <figure className="music-diagram composer-card">
      <div className="cc-head">
        {noPhoto ? (
          <img className="cc-pic" src={`/img/3d/${c.pic}.webp`} alt="" width={96} height={96} />
        ) : (
          <img className="cc-photo zoomable" src={`/img/composers/${id === 'Бах' ? 'bach' : id === 'Моцарт' ? 'mozart' : 'tchaikovsky'}.jpg`} alt={tc(c.name)} onError={() => setNoPhoto(true)} />
        )}
        <div>
          <figcaption className="md-title">{tc(c.name)}</figcaption>
          <p className="muted">
            <span dir="ltr">{c.years}</span> · {tc(c.country)}
          </p>
        </div>
      </div>
      <ul className="cc-facts">
        {c.facts.map((f) => (
          <li key={f}>{tc(f)}</li>
        ))}
      </ul>
      <div className="cc-listen">
        <button type="button" className={player.playing ? 'btn btn-light md-play' : 'btn btn-go md-play'} onClick={() => (player.playing ? player.stop() : play(player, c.tune, c.bpm))}>
          {player.playing ? `■ ${tc('Стоп')}` : `▶ ${tc('Послушать')}`}
        </button>
        <span>{tc(c.piece)}</span>
      </div>
    </figure>
  );
}

/** Parts of a little song, each with its own colour; while it plays, the sounding part lights up. */
const FORMS: Record<string, { title: string; parts: { label: string; color: string; tune: Tune; repeat?: boolean }[]; notes: string[] }> = {
  'Куплет и припев': {
    title: 'Песня: куплет, припев, куплет, припев',
    parts: [
      { label: 'Куплет', color: '#bfe3d3', tune: [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2]] },
      { label: 'Припев', color: '#ffd8bf', tune: [['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 3]] },
      { label: 'Куплет', color: '#bfe3d3', tune: [['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]] },
      { label: 'Припев', color: '#ffd8bf', tune: [['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 3]] },
    ],
    notes: ['Слова куплетов разные, а припев каждый раз повторяется одинаково.', 'Припев обычно самый запоминающийся: его подпевают все.'],
  },
  'Вступление и кода': {
    title: 'Вступление, песня и кода',
    parts: [
      { label: 'Вступление', color: '#d9d2f7', tune: [['C4', 0.5], ['E4', 0.5], ['G4', 0.5], ['E4', 0.5], ['G3', 0.5], ['B3', 0.5], ['D4', 0.5], ['B3', 0.5]] },
      { label: 'Песня', color: '#bfe3d3', tune: [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]] },
      { label: 'Кода', color: '#ffd8bf', tune: [['G4', 1], ['E4', 1], ['C5', 4]] },
    ],
    notes: ['Вступление звучит до слов: оно задаёт настроение и темп.', 'Кода звучит в самом конце и ставит точку.'],
  },
  Повторы: {
    title: 'Знаки репризы: ‖: играй дважды :‖',
    parts: [
      { label: '‖: A :‖', color: '#bfe3d3', repeat: true, tune: [['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 2]] },
      { label: 'B', color: '#ffd8bf', tune: [['D4', 1], ['D4', 1], ['D4', 2], ['E4', 1], ['G4', 1], ['G4', 2]] },
    ],
    notes: ['Отрывок между знаками ‖: и :‖ играют два раза.', 'Так ноты занимают меньше места на бумаге.'],
  },
};

export function SongForm({ tc, id }: { tc: Tc; id: string }) {
  const f = FORMS[id];
  const player = usePlayer();
  if (!f) return null;
  const flat: { part: number; n: string; b: number }[] = [];
  f.parts.forEach((p, i) => {
    for (let k = 0; k < (p.repeat ? 2 : 1); k++) p.tune.forEach(([n, b]) => flat.push({ part: i, n, b }));
  });
  const now = player.step >= 0 ? flat[player.step]?.part : -1;
  const start = () => player.play(flat.map((s) => ({ beats: s.b, play: (at: number) => playNote(N[s.n], s.b * 0.5 * 0.92, at, 0.33) })), 120);
  return (
    <figure className="music-diagram song-form">
      <figcaption className="md-title">{tc(f.title)}</figcaption>
      <div className="sf-parts">
        {f.parts.map((p, i) => (
          <span key={i} className={now === i ? 'sf-part on' : 'sf-part'} style={{ background: p.color, flexGrow: p.tune.reduce((n, [, b]) => n + b, 0) * (p.repeat ? 2 : 1) }}>
            {tc(p.label)}
          </span>
        ))}
      </div>
      <button type="button" className={player.playing ? 'btn btn-light md-play' : 'btn btn-go md-play'} onClick={() => (player.playing ? player.stop() : start())}>
        {player.playing ? `■ ${tc('Стоп')}` : `▶ ${tc('Послушать')}`}
      </button>
      <ol className="md-notes">
        {f.notes.map((n) => (
          <li key={n}>{tc(n)}</li>
        ))}
      </ol>
    </figure>
  );
}
