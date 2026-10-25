import type { Course } from '@kidsland/shared';

/** A photo or looping video behind a hero banner, fading into the banner on the left. */
export type HeroMedia = { image?: string; video?: string; pos?: string };

/** Background media of section pages, by section id. */
export const SECTION_BG: Record<string, HeroMedia> = {
  animals: { image: '/img/bg/animals-dog.jpg', pos: 'center 22%' },
  spirit: { image: '/img/bg/spirit-lotus.jpg', pos: 'center 35%' },
};

/** Background media of course pages: by topic first, then by subject. */
const TOPIC_BG: Record<string, HeroMedia> = {
  'dog-training': { image: '/img/bg/animals-dog.jpg', pos: 'center 22%' },
  'lang-ja': { image: '/img/bg/japan-sakura.jpg' },
  cooking: { image: '/img/bg/leisure-cake.jpg', pos: 'center 40%' },
};

/** Course pages of a subject, when they should differ from the section page. */
const SUBJECT_BG: Record<string, HeroMedia> = {
  animals: { image: '/img/bg/animals-pony.jpg', pos: 'center 30%' },
};

export function courseBg(course: Course): HeroMedia | undefined {
  return (course.topic && TOPIC_BG[course.topic]) || SUBJECT_BG[course.subject] || SECTION_BG[course.subject];
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
