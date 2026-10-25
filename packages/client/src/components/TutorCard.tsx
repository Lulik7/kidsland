import { Link } from 'react-router-dom';
import type { Tutor } from '../api';
import { fmtDateTime, languageName, personName, subjectName } from '../format';
import { plural } from '../plural';
import { StarIcon } from './Icons';
import { TutorAvatar } from './TutorAvatar';
import { useT } from '../i18n';

export function TutorCard({ tutor: tu, childId }: { tutor: Tutor; childId?: string | null }) {
  const t = useT();
  const link = `/tutors/${tu.id}${childId ? `?child=${childId}` : ''}`;
  return (
    <Link to={link} className="tutor-card">
      <div className="tc-top">
        <span className="tc-ava">
          <TutorAvatar name={tu.displayName} size={68} />
          {tu.online && <i className="online-dot" title={t('В сети')} />}
        </span>
        <div className="tc-who">
          <h3>{personName(tu.displayName)}</h3>
          <div className="tc-badges">
            {tu.online && <span className="badge-online">● {t('В сети')}</span>}
            {tu.isNew && <span className="badge-new">✨ {t('Новый наставник')}</span>}
          </div>
          <span className="tc-rating">
            <StarIcon on size={16} /> <b>{tu.rating.toFixed(1)}</b> <span className="muted">· {tu.reviewsCount}{' '}{t('отзывов')}</span>
          </span>
        </div>
      </div>
      <p className="tc-headline">{t(tu.headline)}</p>
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
        <span>{tu.languages.map((l) => t(languageName(l))).join(', ')}</span>
        <span>
          👧 {tu.students}{' '}{plural(tu.students, [t('ученик'), t('ученика'), t('учеников')])}
        </span>
      </div>
      <div className="tc-foot">
        <div>
          <div className="small tc-next">{tu.nextSlot ? `${t('Ближайшее')}: ${fmtDateTime(tu.nextSlot)}` : t('Нет свободного времени')}</div>
        </div>
        <span className="btn btn-primary">{t('Выбрать время')}</span>
      </div>
    </Link>
  );
}
