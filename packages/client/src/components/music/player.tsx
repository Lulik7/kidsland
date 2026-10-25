import { useEffect, useRef, useState } from 'react';
import { audio, claim, playSteps, release } from './sound';
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

/**
 * A steady clock of sixteenth notes for loops. `onStep(i, at)` schedules sound for step i at AudioContext time
 * `at` and returns false to stop. `step` is the step that sounds now, for the playhead.
 */
export function useLoop(bpm: number, onStep: (i: number, at: number) => boolean) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const cb = useRef(onStep);
  cb.current = onStep;
  const timer = useRef(0);
  const shows = useRef<number[]>([]);
  const stopNow = useRef(() => {});
  const handle = useRef(() => stopNow.current()).current;
  const stop = () => {
    release(handle);
    window.clearInterval(timer.current);
    timer.current = 0;
    shows.current.forEach(clearTimeout);
    shows.current = [];
    setStep(-1);
    setRunning(false);
  };
  stopNow.current = stop;
  const start = () => {
    stop();
    const a = audio();
    if (!a) return;
    claim(handle);
    setRunning(true);
    let next = a.currentTime + 0.08;
    let i = 0;
    const tick = () => {
      while (next < a.currentTime + 0.12) {
        if (!cb.current(i, next)) {
          const end = window.setTimeout(stop, (next - a.currentTime) * 1000);
          shows.current.push(end);
          window.clearInterval(timer.current);
          return;
        }
        const s = i;
        shows.current.push(window.setTimeout(() => setStep(s), Math.max(0, (next - a.currentTime) * 1000)));
        if (shows.current.length > 64) shows.current.splice(0, 32);
        next += 60 / bpmRef.current / 4;
        i++;
      }
    };
    tick();
    timer.current = window.setInterval(tick, 25);
  };
  useEffect(() => stop, []);
  return { step, running, start, stop };
}
