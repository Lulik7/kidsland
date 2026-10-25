import { articlesOfSection, findArticle, findSection } from '@kidsland/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ListenText } from '../components/ListenText';
import { useLocal, useTc } from '../content';
import { useT } from '../i18n';

/** One article to read: title, short sections with tips and links to the other articles. */
export function ArticlePage() {
  const t = useT();
  const { articleId } = useParams();
  const original = findArticle(articleId ?? '');
  const article = useLocal(original);
  const tc = useTc();
  const [reading, setReading] = useState(-1);
  if (!article) return <div className="center-note">{t('Статья не найдена.')} <Link to="/sections">{t('Все разделы')}</Link></div>;
  const section = findSection(article.section)!;
  const others = articlesOfSection(section.id).filter((a) => a.id !== article.id);

  return (
    <main className="page article-page" style={{ ['--c' as string]: section.color }}>
      <Link to={`/sections/${section.id}`} className="back-link">← {t(section.name)}</Link>
      <article className="card article">
        <span className="article-topic">{t(section.topics.find((tp) => tp.id === article.topic)?.name ?? '')}</span>
        <h1>{article.title}</h1>
        <p className="article-lead">{article.summary}</p>
        <ListenText parts={[article.title, ...article.sections.map((s) => [s.title, s.text, s.tip].filter(Boolean).join('. '))]} onPart={(i) => setReading(i - 1)} />
        {article.sections.map((s, i) => (
          <section key={i} className={reading === i ? 'reading' : undefined}>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            {s.tip && <div className="tip">{s.tip}</div>}
          </section>
        ))}
      </article>
      {others.length > 0 && (
        <>
          <h2 className="track-title">{t('Ещё статьи')}</h2>
          <div className="article-grid">
            {others.map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="article-card">
                <h3>{tc(a.title)}</h3>
                <p>{tc(a.summary)}</p>
                <span className="muted small">{t('{n} мин чтения', { n: a.minutes })}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
