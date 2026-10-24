import type { Course } from '@kidsland/shared';
import { Link } from 'react-router-dom';
import { levelName, levelRank } from '../courses/meta';
import { plural } from '../plural';
import { SubjectIcon } from './SubjectIcon';

export function LevelBadge({ level }: { level: Course['level'] }) {
  const rank = levelRank(level);
  return (
    <span className={`level-badge lv-${level}`}>
      <span className="lv-bars" aria-hidden>
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= rank ? 'on' : ''} />
        ))}
      </span>
      {levelName(level)}
    </span>
  );
}

export function CourseCard({ course, to, done }: { course: Course; to: string; done?: number }) {
  const total = course.lessons.length;
  const tasks = course.lessons.reduce((n, l) => n + l.practice.length + l.quiz.length, 0);
  return (
    <Link to={to} className="course-card" style={{ ['--c' as string]: course.color }}>
      <div className="cc-art">
        <SubjectIcon subject={course.subject} size={54} />
        <LevelBadge level={course.level} />
      </div>
      <div className="cc-body">
        <h3>{course.title}</h3>
        <p>{course.tagline}</p>
        <div className="cc-meta">
          <span>
            {total} {plural(total, ['урок', 'урока', 'уроков'])}
          </span>
          <span>
            {tasks} {plural(tasks, ['задание', 'задания', 'заданий'])}
          </span>
          <span>
            {course.ageMin}–{course.ageMax} лет
          </span>
        </div>
        {done !== undefined && (
          <div className="cc-progress">
            <div className="meter">
              <i style={{ width: `${(done / total) * 100}%`, background: course.color }} />
            </div>
            <span>{done === total ? 'Курс пройден!' : done > 0 ? `${done} из ${total}` : 'Ещё не начат'}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
