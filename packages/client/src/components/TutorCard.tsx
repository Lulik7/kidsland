import { Link } from 'react-router-dom';
import type { Tutor } from '../api';
import { fmtDateTime, languageName, rub, subjectName } from '../format';
import { StarIcon } from './Icons';
import { TutorAvatar } from './TutorAvatar';

export function TutorCard({ tutor: t, childId }: { tutor: Tutor; childId?: string | null }) {
  const link = `/tutors/${t.id}${childId ? `?child=${childId}` : ''}`;
  return (
    <Link to={link} className="tutor-card">
      <div className="tc-top">
        <TutorAvatar name={t.displayName} size={68} />
        <div className="tc-who">
          <h3>{t.displayName}</h3>
          <span className="tc-rating">
            <StarIcon on size={16} /> <b>{t.rating.toFixed(1)}</b> <span className="muted">· {t.reviewsCount} отзывов</span>
          </span>
        </div>
      </div>
      <p className="tc-headline">{t.headline}</p>
      <div className="tags">
        {t.subjects.map((s) => (
          <span key={s} className="tag">
            {subjectName(s)}
          </span>
        ))}
      </div>
      <div className="tc-meta">
        <span>
          {t.ageMin}–{t.ageMax} лет
        </span>
        <span>{t.languages.map(languageName).join(', ')}</span>
      </div>
      <div className="tc-foot">
        <div>
          <b className="tc-price">{rub(t.hourlyRate)}</b>
          <span className="muted small"> / урок</span>
          <div className="small tc-next">{t.nextSlot ? `Ближайшее: ${fmtDateTime(t.nextSlot)}` : 'Нет свободного времени'}</div>
        </div>
        <span className="btn btn-primary">Выбрать время</span>
      </div>
    </Link>
  );
}
