import { useEffect, useRef, useState } from 'react';
import { playSteps } from './sound';
import type { Tc } from './parts';

export type Step = { beats: number; play: (at: number) => void };

/** Plays a list of steps and tells which one is sounding now. */
export function usePlayer() {
  const [step, setStep] = useState(-1);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);
  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setStep(-1);
  };
  const play = (steps: Step[], bpm: number) => {
    stop();
    stopRef.current = playSteps(steps, bpm, (i) => {
      setStep(i);
      if (i === -1) stopRef.current = null;
    });
  };
  return { step, playing: step !== -1, play, stop };
}

/** The round "listen" button under a picture. */
export function ListenButton({ tc, playing, onPlay, onStop, label = 'Послушать' }: { tc: Tc; playing: boolean; onPlay: () => void; onStop: () => void; label?: string }) {
  return (
    <button type="button" className={`btn ${playing ? 'btn-light' : 'btn-go'} md-play`} onClick={playing ? onStop : onPlay}>
      {playing ? `■ ${tc('Стоп')}` : `▶ ${tc(label)}`}
    </button>
  );
}
