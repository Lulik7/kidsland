import { useEffect, useState } from 'react';

/** Photos that open big on click, anywhere on the site. */
const ZOOM = '.cg-row img, img.lt-photo, img.article-cover, .pc-pic.photo img, img.zoomable';

/**
 * Click a photo from a gallery or a lesson and it opens full-screen; arrows and swipes go through the
 * other photos of the same gallery, Escape or a click outside closes it.
 */
export function Lightbox() {
  const [list, setList] = useState<string[]>([]);
  const [at, setAt] = useState(-1);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const img = (e.target as Element | null)?.closest?.('img');
      if (!img || !img.matches(ZOOM)) return;
      e.preventDefault();
      const group = img.closest('.cg-row');
      const imgs = group ? [...group.querySelectorAll('img')] : [img];
      setList(imgs.map((i) => i.currentSrc || i.src));
      setAt(Math.max(0, imgs.indexOf(img)));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const open = at >= 0 && list.length > 0;
  const go = (d: number) => setAt((i) => (i + d + list.length) % list.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAt(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });

  if (!open) return null;
  let startX = 0;
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      onClick={() => setAt(-1)}
      onTouchStart={(e) => (startX = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <img src={list[at]} alt="" onClick={(e) => e.stopPropagation()} />
      <button className="lb-close" aria-label="×" onClick={() => setAt(-1)}>×</button>
      {list.length > 1 && (
        <>
          <button className="lb-nav lb-prev" aria-label="←" onClick={(e) => (e.stopPropagation(), go(-1))}>‹</button>
          <button className="lb-nav lb-next" aria-label="→" onClick={(e) => (e.stopPropagation(), go(1))}>›</button>
          <span className="lb-count">{at + 1} / {list.length}</span>
        </>
      )}
    </div>
  );
}
