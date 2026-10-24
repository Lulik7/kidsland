import { useCallback, useEffect, useState } from 'react';
import { api, type Child, type LessonProgress } from '../api';

/** Loads a child profile and its course progress; both are empty in the public catalogue. */
export function useCourseProgress(childId?: string) {
  const [child, setChild] = useState<Child | null>(null);
  const [progress, setProgress] = useState<LessonProgress[] | null>(childId ? null : []);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!childId) return;
    api.courseProgress(childId).then((r) => setProgress(r.progress)).catch((e) => setError(e.message));
    api.children().then((r) => setChild(r.children.find((c) => c.id === childId) ?? null)).catch(() => {});
  }, [childId]);

  useEffect(reload, [reload]);
  return { child, setChild, progress, error, reload };
}
