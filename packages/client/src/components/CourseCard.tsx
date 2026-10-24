import type { Course } from '@kidsland/shared';
import { Link } from 'react-router-dom';
import { levelName, levelRank } from '../courses/meta';
import { plural } from '../plural';
import { coursePic, Pic } from '../pics';
import { useT } from '../i18n';

export function LevelBadge({ level }: { level: Course['level'] }) {
  const t = useT();
  const rank = levelRank(level);
  return (
    <span className={`level-badge lv-${level}`}>
      <span className="lv-bars" aria-hidden>
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= rank ? 'on' : ''} />
        ))}
      </span>
      {t(levelName(level))}
    </span>
  );
}

export function CourseCard({ course, to, done }: { course: Course; to: string; done?: number }) {
  const t = useT();
  const total = course.lessons.length;
  const tasks = course.lessons.reduce((n, l) => n + l.practice.length + l.quiz.length, 0);
  return (
    <Link to={to} className="course-card" style={{ ['--c' as string]: course.color }}>
      <div className="cc-art">
        <Pic code={coursePic(course)} size={72} />
        <LevelBadge level={course.level} />
      </div>
      <div className="cc-body">
        <h3>{course.title}</h3>
        <p>{course.tagline}</p>
        <div className="cc-meta">
          <span>
            {total} {plural(total, [t('урок'), t('урока'), t('уроков')])}
          </span>
          <span>
            {tasks} {plural(tasks, [t('задание'), t('задания'), t('заданий')])}
          </span>
          <span>
            {course.ageMin}–{course.ageMax}{' '}{t('лет')}
          </span>
        </div>
        {done !== undefined && (
          <div className="cc-progress">
            <div className="meter">
              <i style={{ width: `${(done / total) * 100}%`, background: course.color }} />
            </div>
            <span>{done === total ? t('Курс пройден!') : done > 0 ? `${done} ${t('из')} ${total}` : t('Ещё не начат')}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
