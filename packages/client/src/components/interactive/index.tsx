import type { Course } from '@kidsland/shared';
import type { ReactNode } from 'react';
import type { Tc } from './kit';
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
};

/** An interactive picture for one theory card, if there is one for it. */
export function lessonScene(course: Course, lessonId: string, sectionTitle: string | undefined, tc: Tc): ReactNode {
  if (!sectionTitle) return null;
  const make = SCENES[`${lessonId}|${sectionTitle}`];
  return make ? make(tc) : null;
}
