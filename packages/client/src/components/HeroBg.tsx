import type { Course } from '@kidsland/shared';

/** A photo or looping video behind a hero banner, fading into the banner on the left. */
export type HeroMedia = { image?: string; video?: string; pos?: string };

/** Background media of section pages, by section id. */
export const SECTION_BG: Record<string, HeroMedia> = {
  animals: { image: '/img/bg/animals-dog.jpg', pos: 'center 22%' },
  spirit: { image: '/img/bg/spirit-lotus.jpg', pos: 'center 35%' },
  music: { image: '/img/bg/music-rock.jpg', pos: 'center 30%' },
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
  dj: { image: '/img/bg/music-rock.jpg', pos: 'center 30%' },
  composition: { image: '/img/bg/music-band.jpg', pos: 'center 40%' },
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

function countryBg(course: Course): HeroMedia | undefined {
  const list = course.topic ? COUNTRY_PHOTOS[course.topic] : undefined;
  if (!list) return undefined;
  const level = Number(course.id.split('-').pop()) || 1;
  return { image: countryPhoto(list[(level - 1) % list.length]), pos: 'center 40%' };
}

export function courseBg(course: Course): HeroMedia | undefined {
  return countryBg(course) || (course.topic && TOPIC_BG[course.topic]) || SUBJECT_BG[course.subject] || SECTION_BG[course.subject];
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
  yoga: { image: '/img/bg/spirit-lotus.jpg' },
  herbarium: { image: '/img/bg/spirit-lotus.jpg' },
  cooking: { image: '/img/bg/leisure-cake.jpg', pos: 'center 40%' },
};

/** Photos that replace the 3D picture at the top of a lesson, by subject and lesson title. */
const LESSON_PHOTO: [string, RegExp, HeroMedia][] = [
  ['animals', /птиц|попуга|канар/i, TOPIC_PHOTO.birds],
  ['animals', /лошад|пони/i, TOPIC_PHOTO.pets],
  ['leisure', /кулинар|печенье|выпечк|тесто|блины|праздничный стол|бутерброд|каша/i, TOPIC_PHOTO.cooking],
  ['leisure', /гербарий/i, TOPIC_PHOTO.herbarium],
];

export function lessonPhoto(course: Course, title: string): HeroMedia | undefined {
  return LESSON_PHOTO.find(([subject, re]) => subject === course.subject && re.test(title))?.[2];
}

/** A strip of photos of the language's country, shown on a language course page. */
export function CountryGallery({ course, title }: { course: Course; title: string }) {
  const list = course.topic ? COUNTRY_PHOTOS[course.topic] : undefined;
  if (!list) return null;
  return (
    <section className="country-gallery">
      <h2 className="track-title">{title}</h2>
      <div className="cg-row">
        {list.map((n) => (
          <img key={n} src={countryPhoto(n)} alt="" loading="lazy" />
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
