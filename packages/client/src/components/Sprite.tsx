import { useMemo } from 'react';
import { toDataUrl } from '../game/sprites';

export function Sprite({ svg, size, className, alt = '' }: { svg: string; size: number; className?: string; alt?: string }) {
  const src = useMemo(() => toDataUrl(svg), [svg]);
  return <img src={src} width={size} height={size} className={className} alt={alt} draggable={false} />;
}
