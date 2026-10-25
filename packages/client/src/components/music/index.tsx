import type { Course } from '@kidsland/shared';
import type { ReactNode } from 'react';
import { AccordionParts, DrumParts, FluteParts, GuitarParts, PianoParts, SaxParts, ViolinParts, VoiceParts } from './instruments';
import type { Tc } from './parts';
import { Accidentals, Accompaniment, BluesScale, ClapRhythm, Dynamics, IntervalHouse, MajorMinorChords, SongHints, Metronome, Rests, RhythmExample, ToneExample } from './live';
import { Posture } from './posture';
import { Composer } from './compose';
import { DjMixer } from './dj';
import { AccordionPress, BowedPress, DrumPress, Durations, GuitarPress, KeyboardTheory, PianoPress, StaffNotes, UkulelePress, VoiceLadder, WindPress } from './press';

type Topic = 'guitar' | 'piano' | 'violin' | 'drums' | 'flute' | 'saxophone' | 'ukulele' | 'accordion' | 'cello' | 'vocal';

function parts(topic: Topic, tc: Tc): ReactNode {
  switch (topic) {
    case 'guitar': return <GuitarParts tc={tc} />;
    case 'ukulele': return <GuitarParts tc={tc} uke />;
    case 'violin': return <ViolinParts tc={tc} />;
    case 'cello': return <ViolinParts tc={tc} cello />;
    case 'piano': return <PianoParts tc={tc} />;
    case 'drums': return <DrumParts tc={tc} />;
    case 'flute': return <FluteParts tc={tc} />;
    case 'saxophone': return <SaxParts tc={tc} />;
    case 'accordion': return <AccordionParts tc={tc} />;
    case 'vocal': return <VoiceParts tc={tc} />;
  }
}

function press(topic: Topic, tc: Tc): ReactNode {
  switch (topic) {
    case 'guitar': return <GuitarPress tc={tc} />;
    case 'ukulele': return <UkulelePress tc={tc} />;
    case 'violin': return <BowedPress tc={tc} />;
    case 'cello': return <BowedPress tc={tc} cello />;
    case 'piano': return <PianoPress tc={tc} />;
    case 'drums': return <DrumPress tc={tc} />;
    case 'flute': return <WindPress tc={tc} />;
    case 'saxophone': return <WindPress tc={tc} sax />;
    case 'accordion': return <AccordionPress tc={tc} />;
    case 'vocal': return <VoiceLadder tc={tc} />;
  }
}

const THEORY: [RegExp, (tc: Tc) => ReactNode][] = [
  [/^Нотный стан/, (tc) => <StaffNotes tc={tc} />],
  [/^Длительности/, (tc) => <Durations tc={tc} />],
  [/^Диезы и бемоли/, (tc) => <KeyboardTheory tc={tc} kind="sharps" />],
  [/^Тоны и полутоны/, (tc) => <KeyboardTheory tc={tc} kind="tones" />],
  [/^Мажорная гамма/, (tc) => <KeyboardTheory tc={tc} kind="major" />],
  [/^Минорная гамма/, (tc) => <KeyboardTheory tc={tc} kind="minor" />],
  [/^Аккорды: трезвучия|^Главные аккорды/, (tc) => <KeyboardTheory tc={tc} kind="triad" />],
];

const SOLFEGGIO: [RegExp, (tc: Tc) => ReactNode][] = [
  [/^Высокие и низкие|^Скрипичный ключ|^Пение с листа/, (tc) => <StaffNotes tc={tc} />],
  [/^Семь нот|^Лесенка гаммы|^Строение мажорной|^Устойчивые|^Тоника/, (tc) => <KeyboardTheory tc={tc} kind="major" />],
  [/^Четверть|^Половинная/, (tc) => <Durations tc={tc} />],
  [/^Пульс и метроном|^Темп/, (tc) => <Metronome tc={tc} />],
  [/^Такт и размер|^Размер|^Пунктирный|^Шестнадцатые|^Затакт/, (tc) => <ClapRhythm tc={tc} />],
  [/^Пауза/, (tc) => <Rests tc={tc} />],
  [/^Мажор и минор|^Мажорное и минорное/, (tc) => <MajorMinorChords tc={tc} />],
  [/^Тон и полутон/, (tc) => <KeyboardTheory tc={tc} kind="tones" />],
  [/^Диез, бемоль/, (tc) => <Accidentals tc={tc} />],
  [/^Натуральный минор|^Три вида минора|^Параллельные/, (tc) => <KeyboardTheory tc={tc} kind="minor" />],
  [/^Что такое интервал|^Терции|^Кварта|^Секста|^Обращения интервалов|^Тритон/, (tc) => <IntervalHouse tc={tc} />],
  [/^Трезвучие|^Главные ступени|^Обращения трезвучий|^Каденции/, (tc) => <KeyboardTheory tc={tc} kind="triad" />],
  [/^Громко и тихо/, (tc) => <Dynamics tc={tc} />],
  [/^Первый музыкальный диктант|^Мелодический диктант|^Как движется мелодия/, (tc) => <Composer tc={tc} />],
];

/** Pictures for a music lesson: parts of the instrument, how to hold it, where to press, music theory. */
export function musicDiagrams(course: Course, lessonTitle: string, tc: Tc): ReactNode[] {
  if (course.subject !== 'music') return [];
  if (course.topic === 'dj') return [<DjMixer key="dj" tc={tc} />];
  if (course.topic === 'composition') return [<Composer key="c" tc={tc} />];
  if (course.topic === 'solfeggio') {
    const hit = SOLFEGGIO.find(([re]) => re.test(lessonTitle)) ?? THEORY.find(([re]) => re.test(lessonTitle));
    return hit ? [hit[1](tc)] : [];
  }
  const topic = course.topic as Topic | undefined;
  if (topic) {
    if (/^Знакомство/.test(lessonTitle)) return [parts(topic, tc)];
    if (/^Устройство|^Как устроен голос/.test(lessonTitle)) return [parts(topic, tc)];
    if (/^Посадка|^Стойка/.test(lessonTitle)) return [<Posture key="p" tc={tc} topic={topic} />];
    if (/^Первый звук|^Первая мелодия/.test(lessonTitle)) return [press(topic, tc)];
    if (/^Ноты и ритм/.test(lessonTitle)) return [<StaffNotes key="s" tc={tc} />, <Durations key="d" tc={tc} />];
    return [];
  }
  const hit = THEORY.find(([re]) => re.test(lessonTitle));
  return hit ? [hit[1](tc)] : [];
}

/** A live picture for one theory card of a music lesson, by the card's title. */
export function musicSectionPicture(course: Course, sectionTitle: string | undefined, tc: Tc): ReactNode {
  if (course.subject !== 'music' || !sectionTitle) return null;
  switch (sectionTitle) {
    case 'Метроном':
      return <Metronome tc={tc} />;
    case 'Хлопаем ритм':
      return <ClapRhythm tc={tc} />;
    case 'Тон':
      return <ToneExample tc={tc} />;
    case 'Точка':
      return (
        <RhythmExample
          tc={tc}
          title="Половинная с точкой: три счёта"
          notes={[{ d: 3, dotted: true }, { d: 1 }, { d: 2 }, { d: 1, dotted: false }, { d: 1 }]}
          explain={['Половинная это 2 счёта, точка добавляет ещё половину: 2 + 1 = 3.', 'Слушай: первая нота тянется на «раз, два, три».']}
        />
      );
    case 'Лига':
      return (
        <RhythmExample
          tc={tc}
          title="Лига: две ноты звучат как одна"
          notes={[{ d: 1 }, { d: 1, tie: true }, { d: 1 }, { d: 1 }]}
          explain={['Дуга соединяет две одинаковые ноты.', 'Вторую ноту не играем заново, а просто тянем первую дальше.']}
        />
      );
    case 'Синкопа':
      return (
        <RhythmExample
          tc={tc}
          title="Синкопа: ударение на «и»"
          notes={[{ d: 0.5 }, { d: 1, accent: true }, { d: 0.5 }, { d: 1, accent: true }, { d: 1 }]}
          explain={['Знак > показывает ударение.', 'Звук начинается между счётами, на «и», и продолжается через следующий счёт.']}
        />
      );
    case 'Такт':
    case 'Сильная доля':
      return sectionTitle === 'Такт' ? (
        <RhythmExample
          tc={tc}
          title="Такт на 4 четверти"
          notes={[{ d: 1, accent: true }, { d: 1 }, { d: 1 }, { d: 1 }, { d: 1, accent: true }, { d: 1 }, { d: 1 }, { d: 1 }]}
          explain={['Вертикальная черта делит музыку на такты.', 'Первая доля каждого такта сильная: её играют чуть громче.']}
        />
      ) : null;
    case 'Размер':
      return (
        <RhythmExample
          tc={tc}
          title="Размер 3/4: раз-два-три, как вальс"
          perBar={3}
          notes={[{ d: 1, accent: true }, { d: 1 }, { d: 1 }, { d: 1, accent: true }, { d: 1 }, { d: 1 }]}
          explain={['Верхняя цифра: сколько долей в такте. Нижняя: какие это доли (4 значит четверти).']}
        />
      );
    case 'Паузы':
      return <Rests tc={tc} />;
    case 'Бекар':
      return <Accidentals tc={tc} />;
    case 'Расстояние':
      return <IntervalHouse tc={tc} />;
    case 'Песенки-подсказки':
      return <SongHints tc={tc} />;
    case 'Мажорное и минорное':
      return <MajorMinorChords tc={tc} />;
    case 'Аккомпанемент':
      return <Accompaniment tc={tc} />;
    case 'Блюзовая гамма':
      return <BluesScale tc={tc} />;
    case 'Крещендо':
      return <Dynamics tc={tc} />;
    case 'Фермата':
      return (
        <RhythmExample
          tc={tc}
          title="Фермата: задержись на ноте"
          notes={[{ d: 1 }, { d: 1 }, { d: 2, fermata: true }]}
          explain={['Фермата похожа на глаз над нотой.', 'Ноту под ней тянут дольше, чем написано, сколько захочется.']}
        />
      );
  }
  return null;
}
