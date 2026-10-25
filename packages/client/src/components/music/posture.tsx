import { useState } from 'react';
import type { Tc } from './parts';

type Topic = 'guitar' | 'piano' | 'violin' | 'drums' | 'flute' | 'saxophone' | 'ukulele' | 'accordion' | 'cello' | 'vocal';

const TIPS: Record<Topic, string[]> = {
  guitar: ['Спина прямая, сиди на краю стула.', 'Гитара лежит на левой ноге, под ногу подставка.', 'Правая рука лежит на корпусе, пальцы над отверстием.', 'Левая рука держит гриф, большой палец за грифом.'],
  ukulele: ['Спина прямая, плечи свободны.', 'Укулеле прижата правым предплечьем к груди.', 'Правая рука бьёт по струнам над концом грифа.', 'Левая рука держит гриф, пальцы прижимают струны кончиками.'],
  piano: ['Сиди на краю банкетки, спина прямая.', 'Локти на уровне клавиш, плечи опущены.', 'Пальцы круглые, как будто держишь яблоко.', 'Ноги стоят на полу или на подставке.'],
  violin: ['Стой прямо, ноги на ширине плеч.', 'Скрипка лежит на левом плече, подбородок на подбороднике.', 'Левая рука держит гриф, запястье прямое.', 'Правая рука держит смычок мягко, большой палец согнут.'],
  cello: ['Сиди на краю стула, ноги обнимают виолончель.', 'Шпиль упирается в пол, гриф у левого плеча.', 'Левая рука на грифе, пальцы круглые.', 'Смычок ведём между подставкой и грифом.'],
  drums: ['Сиди на табурете так, чтобы колени были чуть ниже бёдер.', 'Правая нога на педали бочки, левая на педали хай-хэта.', 'Палочки держи у конца, примерно на трети длины.', 'Малый барабан стоит между коленями.'],
  flute: ['Стой или сиди прямо, плечи свободны.', 'Флейта лежит вправо, параллельно полу.', 'Губная пластина у нижней губы, дуй поперёк отверстия.', 'Левая рука ближе к лицу, правая дальше.'],
  saxophone: ['Сиди или стой прямо, ремень на шее.', 'Саксофон висит на ремне справа от тела.', 'Мундштук входит в рот на одну треть.', 'Левая рука сверху, правая снизу.'],
  accordion: ['Сиди на краю стула, спина прямая.', 'Аккордеон стоит на левой ноге, ремни на плечах.', 'Правая рука на клавишах, левая под ремнём у басов.', 'Мех раскрываем и сжимаем левой рукой плавно.'],
  vocal: ['Стой прямо, ноги на ширине плеч.', 'Плечи опущены, шея свободна.', 'Вдыхай животом: живот выходит вперёд.', 'Рот открывай свободно, подбородок не задирай.'],
};

/** Instruments that have a real photo in /img/posture/<topic>.jpg. */
const PHOTOS = new Set<Topic>(['piano', 'accordion', 'guitar', 'violin', 'drums', 'flute', 'saxophone', 'ukulele', 'cello', 'vocal']);

const PIC: Record<Topic, string> = {
  guitar: '1f3b8',
  ukulele: '1f3b8',
  piano: '1f3b9',
  violin: '1f3bb',
  cello: '1f3bb',
  drums: '1f941',
  flute: '1fa88',
  saxophone: '1f3b7',
  accordion: '1fa97',
  vocal: '1f3a4',
};

/** How to hold the instrument: a photo when there is one, otherwise a 3D picture, and numbered tips. */
export function Posture({ tc, topic }: { tc: Tc; topic: Topic }) {
  const [photo, setPhoto] = useState(PHOTOS.has(topic));
  return (
    <figure className="music-diagram posture-card">
      <figcaption className="md-title">{tc(topic === 'piano' ? 'Как сидеть за инструментом' : 'Как держать инструмент и сидеть')}</figcaption>
      <div className="pc-main">
        <div className={`pc-pic${photo ? ' photo' : ''}`}>
          {photo ? (
            <img src={`/img/posture/${topic}.jpg`} alt="" onError={() => setPhoto(false)} />
          ) : (
            <img src={`/img/3d/${PIC[topic]}.webp`} alt="" className={topic === 'ukulele' ? 'small' : topic === 'cello' ? 'big' : ''} />
          )}
        </div>
        <ol className="pc-tips">
          {TIPS[topic].map((t, i) => (
            <li key={t}>
              <b>{i + 1}</b>
              {tc(t)}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
