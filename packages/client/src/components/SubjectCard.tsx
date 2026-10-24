import { COURSES, SUBJECT_INFO, SUBJECTS, type SubjectId } from '@kidsland/shared';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { SubjectIcon } from './SubjectIcon';

/** A study direction: age, school grades, what the child learns and a "more" action. */
export function SubjectCard({ subject, to, onMore }: { subject: SubjectId; to?: string; onMore?: () => void }) {
  const t = useT();
  const info = SUBJECT_INFO[subject];
  const name = SUBJECTS.find((s) => s.id === subject)?.name ?? subject;
  const color = COURSES.find((c) => c.subject === subject)?.color ?? '#6c4cff';
  return (
    <article className="subject-card" style={{ ['--c' as string]: color }}>
      <div className="sc-top">
        <span className="sc-icon">
          <SubjectIcon subject={subject} size={34} />
        </span>
        <div className="sc-chips">
          <span>{t('с {n} лет', { n: info.ageFrom })}</span>
          <span>{t(info.grades)}</span>
        </div>
      </div>
      <h3>{t(name)}</h3>
      <ul>
        {info.points.map((p) => (
          <li key={p}>{t(p)}</li>
        ))}
      </ul>
      {to ? (
        <Link to={to} className="btn btn-light sc-more">
          {t('Подробнее')}
        </Link>
      ) : (
        <button className="btn btn-light sc-more" onClick={onMore}>
          {t('Подробнее')}
        </button>
      )}
    </article>
  );
}
