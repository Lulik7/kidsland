import { applyContentOverrides, type ContentOverrides } from '@kidsland/shared';
import { useEffect, useState } from 'react';
import { api, type ContentOverridesDto } from './api';

const EVENT = 'kidsland:content';

/**
 * Puts the admin's topics, articles and lesson texts into the shared lists. Pages opened afterwards read
 * them; with redraw the open page is drawn again too (used once, when the site loads).
 */
export function applyContent(content: ContentOverridesDto, redraw = false) {
  applyContentOverrides(content as unknown as ContentOverrides);
  if (redraw) window.dispatchEvent(new Event(EVENT));
}

/** Loads the admin's content once; returns a number that changes whenever the content does. */
export function useContentVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(EVENT, bump);
    api
      .content()
      .then((c) => {
        if (c.topics.length || c.articles.length || c.lessons.length) applyContent(c, true);
      })
      .catch(() => {
        /* the built-in content is still there */
      });
    return () => window.removeEventListener(EVENT, bump);
  }, []);
  return version;
}
