import { BROWN, Callout, Figure, INK, METAL, WOOD, WOOD_DARK, type Tc } from './parts';

/** Guitar or ukulele lying on its side, with labelled parts. */
export function GuitarParts({ tc, uke = false }: { tc: Tc; uke?: boolean }) {
  const strings = uke ? 4 : 6;
  const k = uke ? 0.78 : 1;
  return (
    <Figure title={tc(uke ? 'Из чего состоит укулеле' : 'Из чего состоит гитара')} h={260}>
      <g transform={`translate(${uke ? 50 : 10} ${uke ? 40 : 20}) scale(${k})`}>
        {/* body */}
        <path d="M40 120c0-60 40-80 80-70 20 6 30 6 44 0 40-12 76 14 76 70s-36 82-76 70c-14-6-24-6-44 0-40 10-80-10-80-70z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="3" />
        <circle cx="160" cy="120" r="22" fill={BROWN} />
        <rect x="70" y="104" width="14" height="32" rx="3" fill={WOOD_DARK} />
        {/* neck and frets */}
        <rect x="160" y="108" width="220" height="24" fill="#8a5a3c" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={190 + i * 16} y1="108" x2={190 + i * 16} y2="132" stroke={METAL} strokeWidth="2" />
        ))}
        {/* headstock and pegs */}
        <path d="M380 102h50l6 10v16l-6 10h-50z" fill={WOOD_DARK} />
        {Array.from({ length: strings / 2 }, (_, i) => (
          <g key={i}>
            <circle cx={392 + i * 14} cy="96" r="5" fill={METAL} />
            <circle cx={392 + i * 14} cy="144" r="5" fill={METAL} />
          </g>
        ))}
        {/* strings */}
        {Array.from({ length: strings }, (_, i) => (
          <line key={i} x1="77" y1={110 + i * (20 / (strings - 1))} x2="384" y2={110 + i * (20 / (strings - 1))} stroke="#e8e3d6" strokeWidth="1.2" />
        ))}
      </g>
      {uke ? (
        <>
          <Callout x={170} y={74} tx={110} ty={20} text={tc('Корпус (дека)')} anchor="end" />
          <Callout x={175} y={134} tx={150} ty={240} text={tc('Резонаторное отверстие')} anchor="end" />
          <Callout x={112} y={134} tx={60} ty={210} text={tc('Подставка')} anchor="end" />
          <Callout x={280} y={134} tx={290} ty={220} text={tc('Гриф с ладами')} />
          <Callout x={380} y={116} tx={420} ty={40} text={tc('Колки')} anchor="end" />
          <Callout x={300} y={127} tx={330} ty={60} text={tc('4 струны')} />
        </>
      ) : (
        <>
          <Callout x={130} y={70} tx={90} ty={18} text={tc('Корпус (дека)')} anchor="end" />
          <Callout x={170} y={140} tx={170} ty={250} text={tc('Резонаторное отверстие')} anchor="middle" />
          <Callout x={77} y={140} tx={40} ty={230} text={tc('Подставка')} />
          <Callout x={300} y={140} tx={320} ty={230} text={tc('Гриф с ладами')} />
          <Callout x={420} y={116} tx={440} ty={40} text={tc('Колки')} anchor="end" />
          <Callout x={260} y={128} tx={260} ty={40} text={tc('6 струн')} anchor="middle" />
        </>
      )}
    </Figure>
  );
}

/** Violin or cello standing upright, with the bow next to it. */
export function ViolinParts({ tc, cello = false }: { tc: Tc; cello?: boolean }) {
  return (
    <Figure title={tc(cello ? 'Из чего состоит виолончель' : 'Из чего состоит скрипка')} h={340}>
      <g transform="translate(150 10)">
        {/* scroll and pegbox */}
        <circle cx="0" cy="18" r="12" fill={WOOD_DARK} />
        <rect x="-7" y="26" width="14" height="40" fill={WOOD_DARK} />
        {[34, 46, 58].map((y) => (
          <g key={y}>
            <rect x="-18" y={y - 2} width="11" height="5" rx="2" fill={BROWN} />
            <rect x="7" y={y + 2} width="11" height="5" rx="2" fill={BROWN} />
          </g>
        ))}
        {/* neck / fingerboard */}
        <rect x="-9" y="64" width="18" height="120" rx="4" fill="#2f2a2a" />
        {/* body */}
        <path d="M0 96C40 96 52 110 50 140C48 160 30 168 30 190C30 210 60 214 62 250C64 290 30 310 0 310C-30 310 -64 290 -62 250C-60 214 -30 210 -30 190C-30 168 -48 160 -50 140C-52 110 -40 96 0 96Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="3" />
        <rect x="-9" y="96" width="18" height="110" rx="4" fill="#2f2a2a" />
        {/* f-holes */}
        <path d="M-30 210c6 10-6 20 0 32M30 210c-6 10 6 20 0 32" stroke={BROWN} strokeWidth="3" fill="none" />
        {/* bridge, tailpiece, chin rest */}
        <rect x="-18" y="226" width="36" height="6" rx="2" fill="#f0e2c8" stroke={WOOD_DARK} />
        <path d="M-10 250h20l-4 46h-12z" fill="#2f2a2a" />
        {cello ? <line x1="0" y1="300" x2="0" y2="332" stroke={METAL} strokeWidth="4" /> : <ellipse cx="-30" cy="296" rx="16" ry="8" fill="#2f2a2a" />}
        {/* strings */}
        {[-6, -2, 2, 6].map((dx) => (
          <line key={dx} x1={dx} y1="40" x2={dx * 1.2} y2="252" stroke="#e8e3d6" strokeWidth="1" />
        ))}
      </g>
      {/* bow */}
      <g transform="translate(330 20) rotate(8)">
        <line x1="0" y1="0" x2="0" y2="290" stroke={BROWN} strokeWidth="5" strokeLinecap="round" />
        <line x1="8" y1="8" x2="8" y2="270" stroke="#f3eee2" strokeWidth="4" />
        <rect x="-4" y="262" width="16" height="24" rx="3" fill="#2f2a2a" />
      </g>
      <Callout x={150} y={20} tx={60} ty={20} text={tc('Завиток')} anchor="end" />
      <Callout x={134} y={46} tx={60} ty={56} text={tc('Колки')} anchor="end" />
      <Callout x={150} y={130} tx={60} ty={110} text={tc('Гриф')} anchor="end" />
      <Callout x={120} y={226} tx={50} ty={190} text={tc('Эфы')} anchor="end" />
      <Callout x={168} y={239} tx={240} ty={160} text={tc('Подставка')} />
      <Callout x={150} y={280} tx={240} ty={250} text={tc('Подгрифник')} />
      {cello ? <Callout x={150} y={330} tx={60} ty={330} text={tc('Шпиль')} anchor="end" /> : <Callout x={120} y={306} tx={60} ty={330} text={tc('Подбородник')} anchor="end" />}
      <Callout x={334} y={120} tx={380} ty={110} text={tc('Трость смычка')} />
      <Callout x={341} y={200} tx={380} ty={190} text={tc('Волос')} />
      <Callout x={330} y={300} tx={380} ty={300} text={tc('Колодка')} />
    </Figure>
  );
}

/** An upright piano seen from the front. */
export function PianoParts({ tc }: { tc: Tc }) {
  return (
    <Figure title={tc('Из чего состоит фортепиано')} h={300}>
      <g transform="translate(70 20)">
        <rect x="0" y="0" width="300" height="150" rx="8" fill="#4a3a3a" />
        <rect x="100" y="30" width="100" height="44" rx="4" fill="#f6efe0" stroke="#c9b8a6" />
        <path d="M110 44h80M110 52h80M110 60h80" stroke="#c9b8a6" />
        <rect x="-10" y="150" width="320" height="16" fill="#3a2d2d" />
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} x={i * 15} y="166" width="15" height="42" fill="#fffdf8" stroke="#8a94a3" />
        ))}
        {Array.from({ length: 19 }, (_, i) => ([0, 1, 3, 4, 5].includes(i % 7) ? <rect key={`b${i}`} x={i * 15 + 10} y="166" width="10" height="26" fill="#2f3440" /> : null))}
        <rect x="0" y="208" width="300" height="50" fill="#4a3a3a" />
        {[120, 145, 170].map((x) => (
          <rect key={x} x={x} y="262" width="14" height="8" rx="2" fill="#d4b56a" />
        ))}
      </g>
      <Callout x={220} y={60} tx={420} ty={40} text={tc('Пюпитр для нот')} anchor="end" />
      <Callout x={140} y={28} tx={40} ty={14} text={tc('Крышка')} />
      <Callout x={120} y={200} tx={30} ty={230} text={tc('Белые клавиши')} />
      <Callout x={310} y={196} tx={440} ty={210} text={tc('Чёрные клавиши')} anchor="end" />
      <Callout x={215} y={286} tx={330} ty={290} text={tc('Педали')} />
      <Callout x={330} y={110} tx={440} ty={130} text={tc('Внутри струны и молоточки')} anchor="end" />
    </Figure>
  );
}

/** A drum kit seen from above, with which hand or foot plays each drum. */
export function DrumParts({ tc }: { tc: Tc }) {
  const drum = (x: number, y: number, r: number, fill: string) => (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} stroke="#8a94a3" strokeWidth="3" />
      <circle cx={x} cy={y} r={r * 0.82} fill="#f6f1e6" />
    </g>
  );
  const cymbal = (x: number, y: number, r: number) => <circle cx={x} cy={y} r={r} fill="#e9c97a" stroke="#c9a24a" strokeWidth="2" opacity="0.9" />;
  return (
    <Figure title={tc('Из чего состоит барабанная установка')} h={300}>
      {cymbal(90, 70, 40)}
      {cymbal(370, 70, 46)}
      {cymbal(110, 170, 32)}
      {drum(190, 90, 30, '#e8743b')}
      {drum(270, 90, 32, '#e8743b')}
      {drum(330, 190, 40, '#e8743b')}
      {drum(180, 180, 34, '#d9d4c8')}
      <rect x="200" y="210" width="80" height="60" rx="30" fill="#e8743b" stroke="#8a94a3" strokeWidth="3" />
      <Callout x={90} y={70} tx={20} ty={20} text={tc('Тарелка крэш')} />
      <Callout x={370} y={70} tx={440} ty={20} text={tc('Тарелка райд')} anchor="end" />
      <Callout x={110} y={170} tx={20} ty={240} text={tc('Хай-хэт (левая нога)')} />
      <Callout x={180} y={180} tx={150} ty={290} text={tc('Малый барабан')} anchor="middle" />
      <Callout x={190} y={90} tx={190} ty={30} text={tc('Том 1')} anchor="middle" />
      <Callout x={270} y={90} tx={270} ty={30} text={tc('Том 2')} anchor="middle" />
      <Callout x={330} y={190} tx={440} ty={250} text={tc('Напольный том')} anchor="end" />
      <Callout x={240} y={260} tx={300} ty={290} text={tc('Бас-бочка (правая нога)')} />
    </Figure>
  );
}

/** A flute in three parts. */
export function FluteParts({ tc }: { tc: Tc }) {
  const keys = [150, 175, 200, 240, 265, 290, 330];
  return (
    <Figure title={tc('Из чего состоит флейта')} h={200}>
      <rect x="30" y="90" width="400" height="18" rx="9" fill={METAL} stroke="#8a94a3" />
      <line x1="110" y1="90" x2="110" y2="108" stroke="#8a94a3" strokeWidth="2" />
      <line x1="360" y1="90" x2="360" y2="108" stroke="#8a94a3" strokeWidth="2" />
      <ellipse cx="70" cy="90" rx="14" ry="6" fill="#d7dee5" stroke="#8a94a3" />
      <ellipse cx="70" cy="90" rx="5" ry="3" fill={INK} />
      {keys.map((x) => (
        <circle key={x} cx={x} cy="99" r="8" fill="#e6ebf0" stroke="#8a94a3" />
      ))}
      <Callout x={70} y={88} tx={40} ty={30} text={tc('Губная пластина')} />
      <Callout x={70} y={104} tx={40} ty={170} text={tc('Головка')} />
      <Callout x={240} y={108} tx={240} ty={170} text={tc('Корпус с клапанами')} anchor="middle" />
      <Callout x={390} y={104} tx={430} ty={170} text={tc('Колено')} anchor="end" />
      <Callout x={175} y={92} tx={210} ty={30} text={tc('Клапаны')} />
    </Figure>
  );
}

/** An alto saxophone with its main parts. */
export function SaxParts({ tc }: { tc: Tc }) {
  return (
    <Figure title={tc('Из чего состоит саксофон')} h={340}>
      <g transform="translate(150 10)">
        <path d="M40 30c10-14 30-20 44-14" stroke="#d4b56a" strokeWidth="10" fill="none" strokeLinecap="round" />
        <rect x="80" y="8" width="26" height="14" rx="5" fill="#2f2a2a" transform="rotate(20 93 15)" />
        <path d="M40 30v190c0 60 30 90 70 90s60-24 60-60V250" stroke="#e1c27a" strokeWidth="34" fill="none" strokeLinecap="round" />
        <path d="M170 250c0-20 10-30 30-34" stroke="#e1c27a" strokeWidth="34" fill="none" />
        <ellipse cx="196" cy="214" rx="26" ry="12" fill="#c9a24a" />
        {[60, 90, 120, 150, 180, 210].map((y) => (
          <circle key={y} cx="40" cy={y} r="9" fill="#f6efe0" stroke="#c9a24a" strokeWidth="2" />
        ))}
      </g>
      <Callout x={240} y={20} tx={330} ty={20} text={tc('Мундштук и трость')} />
      <Callout x={200} y={36} tx={60} ty={40} text={tc('Эска (шейка)')} anchor="start" />
      <Callout x={190} y={130} tx={60} ty={130} text={tc('Клапаны')} />
      <Callout x={190} y={250} tx={60} ty={250} text={tc('Корпус')} />
      <Callout x={346} y={224} tx={420} ty={180} text={tc('Раструб')} anchor="end" />
    </Figure>
  );
}

/** A piano accordion with bellows, keyboard and bass buttons. */
export function AccordionParts({ tc }: { tc: Tc }) {
  return (
    <Figure title={tc('Из чего состоит аккордеон')} h={280}>
      <rect x="60" y="40" width="90" height="200" rx="10" fill="#d94f5c" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="70" y={50 + i * 15} width="40" height="14" fill="#fffdf8" stroke="#8a94a3" />
      ))}
      {Array.from({ length: 11 }, (_, i) => ([0, 1, 3, 4, 5].includes(i % 7) ? <rect key={`b${i}`} x="70" y={60 + i * 15} width="24" height="9" fill="#2f3440" /> : null))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${150 + i * 18} 46l9 -6 9 6v190l-9 6-9-6z`} fill={i % 2 ? '#f6f1e6' : '#e9e1d2'} stroke="#c9b8a6" />
      ))}
      <rect x="294" y="40" width="90" height="200" rx="10" fill="#d94f5c" />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={312 + (i % 5) * 13} cy={70 + Math.floor(i / 5) * 26} r="5" fill="#fffdf8" stroke="#8a94a3" />
      ))}
      <Callout x={90} y={120} tx={20} ty={20} text={tc('Клавиатура (правая рука)')} />
      <Callout x={220} y={150} tx={220} ty={270} text={tc('Мех')} anchor="middle" />
      <Callout x={338} y={120} tx={440} ty={20} text={tc('Басы (левая рука)')} anchor="end" />
      <Callout x={384} y={200} tx={440} ty={260} text={tc('Ремень для руки')} anchor="end" />
    </Figure>
  );
}

/** How the voice works: lungs, diaphragm, vocal folds and resonators. */
export function VoiceParts({ tc }: { tc: Tc }) {
  return (
    <Figure title={tc('Как устроен голос')} h={320}>
      <g transform="translate(170 10)">
        <circle cx="60" cy="40" r="34" fill="#f7d7bf" />
        <path d="M40 74h40v30H40z" fill="#f7d7bf" />
        <path d="M0 104h120l10 180H-10z" fill="#f4b391" opacity="0.6" />
        <path d="M54 80h12v40H54z" fill="#e98a8a" />
        <path d="M60 120c-30 0-46 30-46 70s10 50 30 50 22-30 22-60zM60 120c30 0 46 30 46 70s-10 50-30 50-22-30-22-60z" fill="#f2a7b5" />
        <path d="M6 250c30-20 78-20 108 0" stroke="#d27a5a" strokeWidth="5" fill="none" />
        <path d="M40 30q20-10 40 0" stroke="#7fb3a1" strokeWidth="3" fill="none" />
      </g>
      <Callout x={230} y={36} tx={80} ty={30} text={tc('Резонаторы: рот и нос')} />
      <Callout x={230} y={96} tx={80} ty={100} text={tc('Гортань и голосовые складки')} />
      <Callout x={200} y={190} tx={80} ty={190} text={tc('Лёгкие')} />
      <Callout x={230} y={254} tx={340} ty={290} text={tc('Диафрагма')} />
    </Figure>
  );
}
