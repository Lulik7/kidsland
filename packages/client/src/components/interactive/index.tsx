import type { Course } from '@kidsland/shared';
import type { ReactNode } from 'react';
import { CharacterMaker, ColorMixer, ColorWheel, ComicPanel, Easel, FaceBuilder, FigurePose, Flipbook, FolkPattern, Hatching, LandscapePlanes, Layers, LightShadow, MoodPalette, Perspective, PainterStyles, PencilPressure, PixelArt, ShapeBuilder, ThirdsGrid, WatercolorWash, WaterReflect } from './art1';
import { BinaryBits, BinarySearch, ChoiceTree, DebugSteps, GraphBfs, IfElseFlow, LogicGates, LoopPattern, RobotProgram, SortBars, WaveMaze } from './algo';
import { GEORGIAN } from './geoData';
import { HIRAGANA, KATAKANA, type Kana } from './kanaData';
import type { Tc } from './kit';
import { Copybook } from './writer';
import { AtomZoom, CircuitPlay, FloatSink, FrictionRamp, LeverPlay, MagnetPlay, MagnetPoles, MoleculeBuilder, ParticlesHeat, PrismRainbow, ShadowLamp, SoundWave } from './science1';
import {
  BodyOrgans,
  CabbageIndicator,
  CellParts,
  Constellation,
  DayNight,
  EarthLayers,
  FireTriangle,
  FoodChain,
  ForceCart,
  MoonPhases,
  PlanetWeight,
  PlantGrow,
  RecycleSort,
  SnowPressure,
  SolarSystem,
  WaterCycle,
  WaterStates,
  WindTurbine,
} from './science2';

type Make = (tc: Tc) => ReactNode;

/** Interactive pictures by lesson id and theory card title. */
const SCENES: Record<string, Make> = {
  // Логика и алгоритмы: каждый алгоритм работает по шагам
  'logic-1|Что такое алгоритм': (tc) => <RobotProgram tc={tc} />,
  'logic-2|Ищем повторения': (tc) => <LoopPattern tc={tc} />,
  'logic-3|Решения в алгоритмах': (tc) => <IfElseFlow tc={tc} />,
  'logic-3|И, или, не': (tc) => <LogicGates tc={tc} />,
  'logic-4|Как искать': (tc) => <DebugSteps tc={tc} />,
  'logic-mid-1|Дерево вариантов': (tc) => <ChoiceTree tc={tc} />,
  'logic-mid-2|Сортировка пузырьком': (tc) => <SortBars tc={tc} kind="bubble" />,
  'logic-mid-2|Сортировка выбором': (tc) => <SortBars tc={tc} kind="selection" />,
  'logic-mid-3|Как читать двоичное число': (tc) => <BinaryBits tc={tc} bits={4} />,
  'logic-mid-3|Байт': (tc) => <BinaryBits tc={tc} />,
  'logic-pro-1|Угадай число за 7 вопросов': (tc) => <BinarySearch tc={tc} />,
  'logic-pro-2|Граф': (tc) => <GraphBfs tc={tc} />,
  'logic-pro-2|Разберём пример: волна по клеткам': (tc) => <WaveMaze tc={tc} />,
  // Маленький учёный
  'science-start-1|Восемь планет': (tc) => <SolarSystem tc={tc} />,
  'science-start-2|Трение': (tc) => <FrictionRamp tc={tc} />,
  'science-start-2|Магниты': (tc) => <MagnetPlay tc={tc} />,
  'science-start-3|Яйцо в солёной воде': (tc) => <FloatSink tc={tc} salt />,
  'science-start-5|Три состояния': (tc) => <WaterStates tc={tc} />,
  'science-start-6|Круговорот воды': (tc) => <WaterCycle tc={tc} />,
  'science-start-8|Как появляется тень': (tc) => <ShadowLamp tc={tc} />,
  'science-start-9|Белый свет разноцветный': (tc) => <PrismRainbow tc={tc} />,
  'science-start-10|Звук это дрожание': (tc) => <SoundWave tc={tc} />,
  'science-start-11|Два полюса': (tc) => <MagnetPoles tc={tc} />,
  'science-start-11|Что притягивает магнит': (tc) => <MagnetPlay tc={tc} />,
  'science-start-12|Что нужно растению': (tc) => <PlantGrow tc={tc} />,
  'science-start-13|Сердце': (tc) => <BodyOrgans tc={tc} />,
  'science-start-14|Лёгкое и тяжёлое': (tc) => <FloatSink tc={tc} />,
  'science-start-15|Земля вращается': (tc) => <DayNight tc={tc} />,
  'science-start-15|Фазы Луны': (tc) => <MoonPhases tc={tc} />,
  'science-start-16|Созвездия': (tc) => <Constellation tc={tc} />,
  'science-start-17|Температура': (tc) => <ParticlesHeat tc={tc} />,
  'science-start-18|Ток': (tc) => <CircuitPlay tc={tc} />,
  'science-start-19|Рычаг': (tc) => <LeverPlay tc={tc} />,
  // Как устроен мир
  'science-mid-1|Атомы': (tc) => <AtomZoom tc={tc} />,
  'science-mid-1|Молекулы': (tc) => <MoleculeBuilder tc={tc} />,
  'science-mid-1|Частицы движутся': (tc) => <ParticlesHeat tc={tc} />,
  'science-mid-3|Индикатор из капусты': (tc) => <CabbageIndicator tc={tc} />,
  'science-mid-5|Сила': (tc) => <ForceCart tc={tc} />,
  'science-mid-6|Вес на других планетах': (tc) => <PlanetWeight tc={tc} />,
  'science-mid-7|Что такое трение': (tc) => <FrictionRamp tc={tc} />,
  'science-mid-8|Превращения': (tc) => <WindTurbine tc={tc} />,
  'science-mid-9|Цепь': (tc) => <CircuitPlay tc={tc} />,
  'science-mid-10|Преломление': (tc) => <PrismRainbow tc={tc} />,
  'science-mid-11|Волны': (tc) => <SoundWave tc={tc} />,
  'science-mid-12|Погода': (tc) => <WaterCycle tc={tc} />,
  'science-mid-13|Кирпичики жизни': (tc) => <CellParts tc={tc} />,
  'science-mid-14|Еда из света': (tc) => <PlantGrow tc={tc} />,
  'science-mid-15|Кто кого ест': (tc) => <FoodChain tc={tc} />,
  'science-mid-16|Слои': (tc) => <EarthLayers tc={tc} />,
  'science-mid-17|Каменные планеты': (tc) => <SolarSystem tc={tc} />,
  'science-mid-17|Газовые гиганты': (tc) => <PlanetWeight tc={tc} />,
  'science-mid-20|Плавающее яйцо': (tc) => <FloatSink tc={tc} salt />,
  // Юный исследователь
  'science-pro-1|Второй закон': (tc) => <ForceCart tc={tc} />,
  'science-pro-2|Лыжи и снегоступы': (tc) => <SnowPressure tc={tc} />,
  'science-pro-3|Выталкивающая сила': (tc) => <FloatSink tc={tc} />,
  'science-pro-4|Электромагнит': (tc) => <MagnetPlay tc={tc} />,
  'science-pro-5|Невидимый свет': (tc) => <PrismRainbow tc={tc} />,
  'science-pro-7|Треугольник огня': (tc) => <FireTriangle tc={tc} />,
  'science-pro-8|Свет идёт к нам': (tc) => <SolarSystem tc={tc} />,
  'science-pro-13|Инструкция жизни': (tc) => <CellParts tc={tc} />,
  'science-pro-15|Гигиена': (tc) => <BodyOrgans tc={tc} />,
  'science-pro-16|Переработка': (tc) => <RecycleSort tc={tc} />,
  'science-pro-17|Солнце и ветер': (tc) => <WindTurbine tc={tc} />,
  // Рисование
  'art-start-1|Мягкий и твёрдый': (tc) => <PencilPressure tc={tc} />,
  'art-start-1|Разминка': (tc) => <Easel tc={tc} title="Разминка: рисуй линии" />,
  'art-start-2|Круг, квадрат, треугольник': (tc) => <ShapeBuilder tc={tc} />,
  'art-start-3|Основные цвета': (tc) => <ColorMixer tc={tc} />,
  'art-start-3|Тёплые и холодные': (tc) => <ColorWheel tc={tc} mode="warm" />,
  'art-start-3|Акварель и гуашь': (tc) => <WatercolorWash tc={tc} />,
  'art-start-4|Что это': (tc) => <Hatching tc={tc} />,
  'art-start-5|Откуда свет': (tc) => <LightShadow tc={tc} />,
  'art-start-6|Куб': (tc) => <LightShadow tc={tc} cube />,
  'art-start-6|Шар': (tc) => <LightShadow tc={tc} />,
  'art-start-7|Композиция': (tc) => <ThirdsGrid tc={tc} />,
  'art-start-8|Даль меньше': (tc) => <Perspective tc={tc} />,
  'art-start-9|Планы': (tc) => <LandscapePlanes tc={tc} />,
  'art-start-9|Небо': (tc) => <Easel tc={tc} title="Нарисуй своё небо" back="sky" />,
  'art-start-10|Ровная заливка': (tc) => <WatercolorWash tc={tc} />,
  'art-start-11|Техника': (tc) => <WatercolorWash tc={tc} />,
  'art-start-12|Плотная краска': (tc) => <Easel tc={tc} title="Гуашь: рисуй плотной краской" back="meadow" />,
  'art-start-13|Круг цветов': (tc) => <ColorWheel tc={tc} />,
  'art-start-13|Палитра': (tc) => <ColorMixer tc={tc} />,
  'art-start-14|Простые формы': (tc) => <ShapeBuilder tc={tc} />,
  'art-start-15|Эмоции': (tc) => <FaceBuilder tc={tc} />,
  'art-start-15|Пропорции': (tc) => <FaceBuilder tc={tc} />,
  'art-start-16|Каркас': (tc) => <FigurePose tc={tc} />,
  'art-start-17|Силуэт': (tc) => <CharacterMaker tc={tc} />,
  'art-start-18|Пузыри': (tc) => <ComicPanel tc={tc} />,
  'art-start-19|Ван Гог': (tc) => <PainterStyles tc={tc} />,
  'art-start-20|Выбери работы': (tc) => <Easel tc={tc} title="Картина для выставки" />,
  'art-mid-1|Правило третей': (tc) => <ThirdsGrid tc={tc} />,
  'art-mid-4|Температура': (tc) => <ColorWheel tc={tc} mode="warm" />,
  'art-mid-4|Свет и тень': (tc) => <LightShadow tc={tc} />,
  'art-mid-5|Палитра настроения': (tc) => <MoodPalette tc={tc} />,
  'art-mid-6|Быстрый рисунок': (tc) => <Easel tc={tc} title="Скетч за минуту" />,
  'art-mid-8|Угол дома': (tc) => <Perspective tc={tc} two />,
  'art-mid-9|Отражения': (tc) => <WaterReflect tc={tc} />,
  'art-mid-10|Закат': (tc) => <MoodPalette tc={tc} />,
  'art-mid-10|Облака объёмные': (tc) => <Easel tc={tc} title="Нарисуй облака" back="sky" />,
  'art-mid-11|Свет на лице': (tc) => <FaceBuilder tc={tc} />,
  'art-mid-12|Линия действия': (tc) => <FigurePose tc={tc} />,
  'art-mid-14|Хохлома': (tc) => <FolkPattern tc={tc} />,
  'art-mid-16|Слои': (tc) => <Layers tc={tc} />,
  'art-mid-16|Инструменты': (tc) => <Easel tc={tc} title="Цифровые кисти" />,
  'art-mid-17|Заливка': (tc) => <Easel tc={tc} title="Заливка цветом" back="night" />,
  'art-mid-18|Флипбук': (tc) => <Flipbook tc={tc} />,
  'art-mid-18|Ключевые кадры': (tc) => <Flipbook tc={tc} />,
  'art-pro-3|Сокращение': (tc) => <Perspective tc={tc} />,
  'art-pro-7|Ключевой свет': (tc) => <LightShadow tc={tc} />,
  'art-pro-8|Палитра': (tc) => <MoodPalette tc={tc} />,
  'art-pro-9|Листы персонажа': (tc) => <CharacterMaker tc={tc} />,
  'art-pro-12|Раскадровка': (tc) => <ComicPanel tc={tc} />,
  'art-pro-14|Кисти': (tc) => <Easel tc={tc} title="Цифровая живопись" back="night" />,
  'art-pro-15|Квадратики': (tc) => <PixelArt tc={tc} />,
  'art-pro-15|Анимация': (tc) => <Flipbook tc={tc} />,
};

/** An interactive picture for one theory card, if there is one for it. */
export function lessonScene(course: Course, lessonId: string, sectionTitle: string | undefined, tc: Tc): ReactNode {
  if (!sectionTitle) return null;
  const make = SCENES[`${lessonId}|${sectionTitle}`];
  return make ? make(tc) : null;
}

/** Letters a lesson teaches to write: `per` letters for each lesson in order, nothing once they run out. */
const slice = <T,>(list: T[], index: number, per: number) => list.slice(index * per, index * per + per);

/** The copybook for a lesson of a language with its own alphabet (Japanese kana, Georgian). */
export function lessonCopybook(course: Course, index: number, tc: Tc): ReactNode {
  const kana = (k: Kana) => ({ ch: k.ch, sound: k.ru, hint: k.hint, pic: k.pic });
  if (course.id === 'lang-ja-1' || course.id === 'lang-ja-2') {
    const list = course.id === 'lang-ja-1' ? HIRAGANA : KATAKANA;
    const letters = slice(list, index, 3);
    if (!letters.length) return null;
    return <Copybook key={course.id + index} letters={letters.map(kana)} file="kana-strokes.json" lang="ja-JP" ruling="grid" tc={tc} title={tc(course.id === 'lang-ja-1' ? 'Прописи: хирагана' : 'Прописи: катакана')} />;
  }
  if (course.id === 'lang-ja-3') {
    const letters = slice([...HIRAGANA, ...KATAKANA], index, 5);
    if (!letters.length) return null;
    return <Copybook key={course.id + index} letters={letters.map(kana)} file="kana-strokes.json" lang="ja-JP" ruling="grid" tc={tc} title={tc('Прописи: повторяем азбуки')} />;
  }
  if (course.id === 'lang-ka-1') {
    const letters = slice(GEORGIAN, index, 2);
    if (!letters.length) return null;
    return (
      <Copybook
        key={course.id + index}
        letters={letters.map((g) => ({ ch: g.ch, sound: g.ru, pic: g.pic, word: g.word, wordTr: g.wordRu }))}
        file="ka-strokes.json"
        lang="ka-GE"
        ruling="lines"
        tc={tc}
        title={tc('Прописи: грузинские буквы')}
      />
    );
  }
  if (course.id === 'lang-ka-2') {
    const letters = slice(GEORGIAN, index, 2);
    if (!letters.length) return null;
    return (
      <Copybook
        key={course.id + index}
        letters={letters.map((g) => ({ ch: g.ch, sound: g.ru, pic: g.pic, word: g.word, wordTr: g.wordRu }))}
        file="ka-strokes.json"
        lang="ka-GE"
        ruling="lines"
        tc={tc}
        title={tc('Прописи: повторяем буквы')}
      />
    );
  }
  return null;
}
