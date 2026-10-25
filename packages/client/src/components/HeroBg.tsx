import type { Course } from '@kidsland/shared';

/** A photo or looping video behind a hero banner, fading into the banner on the left. */
export type HeroMedia = { image?: string; video?: string; pos?: string };

/** Background media of section pages, by section id. */
export const SECTION_BG: Record<string, HeroMedia> = {
  animals: { image: '/img/bg/animals-dog.jpg', pos: 'center 22%' },
  spirit: { image: '/img/bg/spirit-lotus.jpg', pos: 'center 35%' },
  music: { image: '/img/bg/music-rock.jpg', pos: 'center 30%' },
  art: { image: '/img/bg/art-painter.jpg', pos: 'center 30%' },
  science: { image: '/img/bg/science-lab.jpg', pos: 'center 30%' },
  leisure: { image: '/img/hobby/craft-embroidery-bunny.jpg', pos: 'center 60%' },
};

const p = (topic: string, pos = 'center 30%'): HeroMedia => ({ image: `/img/posture/${topic}.jpg`, pos });
/** Music topics: photos of children playing each instrument. */
const MUSIC: Record<string, HeroMedia> = {
  guitar: p('guitar'),
  piano: p('piano', 'center 25%'),
  accordion: p('accordion', 'center 55%'),
  violin: p('violin', 'center 40%'),
  drums: p('drums', '70% 40%'),
  flute: p('flute', 'center 40%'),
  saxophone: p('saxophone', 'center 25%'),
  ukulele: p('ukulele', 'center 45%'),
  cello: p('cello', 'center 40%'),
  vocal: p('vocal', '30% 30%'),
  solfeggio: { image: '/img/bg/music-sheet.jpg', pos: 'center 30%' },
  dj: { image: '/img/bg/dj-synth.jpg', pos: 'center 40%' },
  composition: { image: '/img/bg/compose-pen.jpg' },
};

/** Background media of course pages: by topic first, then by subject. */
const TOPIC_BG: Record<string, HeroMedia> = {
  ...MUSIC,
  piano: { image: '/img/bg/music-piano-pink.jpg', pos: 'center 65%' },
  'dog-training': { image: '/img/bg/animals-dog.jpg', pos: 'center 22%' },
  cooking: { image: '/img/bg/leisure-cake.jpg', pos: 'center 40%' },
};

/** Course pages of a subject, when they should differ from the section page. */
const SUBJECT_BG: Record<string, HeroMedia> = {
  animals: { image: '/img/bg/animals-pony.jpg', pos: 'center 30%' },
};

/** Photos of the countries where a language is spoken, by language topic. Course level N shows photo N. */
export const COUNTRY_PHOTOS: Record<string, string[]> = {
  'lang-zh': ['zh-temple', 'zh-flag'],
  'lang-ja': ['../bg/japan-sakura', 'ja-castle', 'ja-pagoda', 'ja-kimono'],
  'lang-de': ['de-nuremberg', 'de-mosel'],
  'lang-fr': ['fr-arc', 'fr-provence'],
  'lang-es': ['es-street', 'es-flag'],
  'lang-it': ['it-cinqueterre', 'it-village', 'it-street', 'it-flag'],
  'lang-el': ['el-church', 'el-athens', 'el-guards', 'el-flag'],
};

export const countryPhoto = (name: string) => `/img/country/${name}.jpg`;

/** Banners of single courses, by course id. */
const COURSE_BG: Record<string, HeroMedia> = {
  'dj-1': { image: '/img/bg/dj-headphones.jpg', pos: 'center 70%' },
  'dj-2': { image: '/img/bg/dj-cables.jpg', pos: 'center 40%' },
  'dj-3': { image: '/img/bg/dj-roland.jpg', pos: 'center 60%' },
  'compose-1': { image: '/img/bg/compose-pencil.jpg' },
  'compose-2': { image: '/img/bg/compose-pen.jpg' },
  'compose-3': { image: '/img/bg/compose-piano.jpg' },
  'art-start': { image: '/img/hobby/art-paints.jpg' },
  'art-mid': { image: '/img/hobby/art-watercolor-table.jpg', pos: 'center 40%' },
  'art-pro': { image: '/img/hobby/art-easel.jpg', pos: 'center 30%' },
  'leisure-start': { image: '/img/hobby/craft-twine.jpg', pos: 'center 50%' },
  'leisure-mid': { image: '/img/hobby/knit.jpg', pos: 'center 35%' },
  'leisure-pro': { image: '/img/hobby/craft-embroidery.jpg', pos: 'center 50%' },
};

function countryBg(course: Course): HeroMedia | undefined {
  const list = course.topic ? COUNTRY_PHOTOS[course.topic] : undefined;
  if (!list) return undefined;
  const level = Number(course.id.split('-').pop()) || 1;
  return { image: countryPhoto(list[(level - 1) % list.length]), pos: 'center 40%' };
}

export function courseBg(course: Course): HeroMedia | undefined {
  return COURSE_BG[course.id] || countryBg(course) || (course.topic && TOPIC_BG[course.topic]) || SUBJECT_BG[course.subject] || SECTION_BG[course.subject];
}

export function HeroBg({ media }: { media?: HeroMedia }) {
  if (!media) return null;
  const style = { objectPosition: media.pos ?? 'center' };
  return (
    <div className="hero-bg" aria-hidden>
      {media.video ? (
        <video src={media.video} poster={media.image} style={style} autoPlay muted loop playsInline />
      ) : (
        <img src={media.image} alt="" style={style} />
      )}
    </div>
  );
}

/** Photos of section topics, shown on the topic chips. */
export const TOPIC_PHOTO: Record<string, HeroMedia> = {
  ...MUSIC,
  'lang-zh': { image: '/img/country/zh-temple.jpg' },
  'lang-ja': { image: '/img/country/ja-pagoda.jpg', pos: 'center 20%' },
  'lang-de': { image: '/img/country/de-nuremberg.jpg' },
  'lang-fr': { image: '/img/country/fr-arc.jpg', pos: 'center 30%' },
  'lang-es': { image: '/img/country/es-flag.jpg', pos: '40% 30%' },
  'lang-it': { image: '/img/country/it-flag.jpg' },
  'lang-el': { image: '/img/country/el-flag.jpg', pos: '35% 40%' },
  dogs: { image: '/img/bg/animals-dog.jpg', pos: 'center 25%' },
  birds: { image: '/img/bg/animals-bird.jpg', pos: '68% 45%' },
  pets: { image: '/img/bg/animals-pony.jpg', pos: 'center 25%' },
  yoga: { image: '/img/bg/spirit-yoga.jpg', pos: '20% 50%' },
  food: { image: '/img/bg/leisure-food.jpg' },
  experiments: { image: '/img/bg/science-lab.jpg', pos: '70% 30%' },
  magic: { image: '/img/hobby/magic-stage.jpg', pos: 'center 30%' },
  pencil: { image: '/img/hobby/art-brushes.jpg' },
  watercolor: { image: '/img/hobby/art-paints.jpg' },
  gouache: { image: '/img/hobby/art-easel.jpg', pos: 'center 25%' },
  sketching: { image: '/img/hobby/art-watercolor.jpg', pos: 'center 40%' },
  knitting: { image: '/img/hobby/knit.jpg', pos: 'center 35%' },
  crochet: { image: '/img/hobby/knit.jpg', pos: 'center 60%' },
  sewing: { image: '/img/hobby/craft-embroidery.jpg' },
  crafts: { image: '/img/hobby/craft-twine.jpg' },
  macrame: { image: '/img/hobby/craft-twine.jpg', pos: 'center 60%' },
  magicCards: { image: '/img/hobby/magic-deck.jpg', pos: 'center 45%' },
  embroidery: { image: '/img/hobby/craft-embroidery-bunny.jpg', pos: 'center 65%' },
  market: { image: '/img/hobby/craft-market.jpg', pos: 'center 60%' },
  herbarium: { image: '/img/bg/spirit-lotus.jpg' },
  cooking: { image: '/img/bg/leisure-cake.jpg', pos: 'center 40%' },
};

/** Photos that replace the 3D picture at the top of a lesson, by subject and lesson title. */
const LESSON_PHOTO: [string, RegExp, HeroMedia][] = [
  ['animals', /птиц|попуга|канар/i, TOPIC_PHOTO.birds],
  ['animals', /лошад|пони/i, TOPIC_PHOTO.pets],
  ['science', /фокус/i, TOPIC_PHOTO.magicCards],
  ['leisure', /вышивк/i, TOPIC_PHOTO.embroidery],
  ['leisure', /ярмарк|выставк/i, TOPIC_PHOTO.market],
  ['leisure', /вязан|спиц|крюч|шапк|шарф/i, TOPIC_PHOTO.knitting],
  ['leisure', /рацион|салат|суп|кухни мира|обед/i, TOPIC_PHOTO.food],
  ['leisure', /кулинар|печенье|выпечк|тесто|блины|праздничный стол|бутерброд|каша/i, TOPIC_PHOTO.cooking],
  ['leisure', /гербарий/i, TOPIC_PHOTO.herbarium],
];

export function lessonPhoto(course: Course, title: string): HeroMedia | undefined {
  return LESSON_PHOTO.find(([subject, re]) => subject === course.subject && re.test(title))?.[2];
}

/** Photos of the DJ studio, shown in a strip on DJ course pages. */
const DJ_PHOTOS = ['dj-synth', 'dj-headphones', 'dj-cables', 'dj-knobs', 'dj-roland', 'dj-panel'].map((n) => `/img/bg/${n}.jpg`);

const COMPOSE_PHOTOS = ['compose-pencil', 'compose-pen', 'compose-notes', 'compose-piano', 'music-band'].map((n) => `/img/bg/${n}.jpg`);

const hobby = (names: string[]) => names.map((n) => `/img/hobby/${n}.jpg`);
const ART_PHOTOS = [...hobby(['art-easel', 'art-paints', 'art-watercolor-table', 'art-brushes', 'art-watercolor']), '/img/bg/art-painter.jpg'];
const CRAFT_PHOTOS = hobby(['knit', 'craft-embroidery-bunny', 'craft-twine', 'craft-embroidery', 'craft-market']);

/** A strip of photos under a course banner: the language's country, or the DJ studio. */
export function courseGallery(course: Course): { title: string; photos: string[] } | undefined {
  if (course.topic === 'dj') return { title: 'Студия диджея', photos: DJ_PHOTOS };
  if (course.subject === 'art') return { title: 'Мастерская художника', photos: ART_PHOTOS };
  if (course.subject === 'leisure' && course.topic !== 'cooking') return { title: 'Мастерская рукоделия', photos: CRAFT_PHOTOS };
  if (course.topic === 'composition') return { title: 'Как пишут музыку', photos: COMPOSE_PHOTOS };
  const list = course.topic ? COUNTRY_PHOTOS[course.topic] : undefined;
  return list && { title: 'Страна языка', photos: list.map(countryPhoto) };
}

export function PhotoGallery({ title, photos }: { title: string; photos: string[] }) {
  return (
    <section className="country-gallery">
      <h2 className="track-title">{title}</h2>
      <div className="cg-row">
        {photos.map((src) => (
          <img key={src} src={src} alt="" loading="lazy" />
        ))}
      </div>
    </section>
  );
}

/** Looping video behind the header of lessons about nature. */
const NATURE: HeroMedia = { video: '/video/nature-river.mp4', image: '/video/nature-river.jpg', pos: 'center 45%' };

export function lessonBg(title: string): HeroMedia | undefined {
  return /природ/i.test(title) ? NATURE : undefined;
}
