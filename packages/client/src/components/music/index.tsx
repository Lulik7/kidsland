import type { Course } from '@kidsland/shared';
import type { ReactNode } from 'react';
import { AccordionParts, DrumParts, FluteParts, GuitarParts, PianoParts, SaxParts, ViolinParts, VoiceParts } from './instruments';
import type { Tc } from './parts';
import { Posture } from './posture';
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

/** Pictures for a music lesson: parts of the instrument, how to hold it, where to press, music theory. */
export function musicDiagrams(course: Course, lessonTitle: string, tc: Tc): ReactNode[] {
  if (course.subject !== 'music') return [];
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
