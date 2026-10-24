import { Link } from 'react-router-dom';
import type { Tutor } from '../api';
import { fmtDateTime, languageName, rub, subjectName } from '../format';
import { StarIcon } from './Icons';
import { TutorAvatar } from './TutorAvatar';
import { useT } from '../i18n';

export function TutorCard({ tutor: tu, childId }: { tutor: Tutor; childId?: string | null }) {
  const t = useT();
  const link = `/tutors/${tu.id}${childId ? `?child=${childId}` : ''}`;
  return (
    <Link to={link} className="tutor-card">
      <div className="tc-top">
        <TutorAvatar name={tu.displayName} size={68} />
        <div className="tc-who">
          <h3>{tu.displayName}</h3>
          <span className="tc-rating">
            <StarIcon on size={16} /> <b>{tu.rating.toFixed(1)}</b> <span className="muted">· {tu.reviewsCount}{' '}{t('отзывов')}</span>
          </span>
        </div>
      </div>
      <p className="tc-headline">{tu.headline}</p>
      <div className="tags">
        {tu.subjects.map((s) => (
          <span key={s} className="tag">
            {t(subjectName(s))}
          </span>
        ))}
      </div>
      <div className="tc-meta">
        <span>
          {tu.ageMin}–{tu.ageMax}{' '}{t('лет')}
        </span>
        <span>{tu.languages.map(languageName).join(', ')}</span>
      </div>
      <div className="tc-foot">
        <div>
          <b className="tc-price">{rub(tu.hourlyRate)}</b>
          <span className="muted small">{' '}{t('/ урок')}</span>
          <div className="small tc-next">{tu.nextSlot ? `${t('Ближайшее')}: ${fmtDateTime(tu.nextSlot)}` : t('Нет свободного времени')}</div>
        </div>
        <span className="btn btn-primary">{t('Выбрать время')}</span>
      </div>
    </Link>
  );
}
