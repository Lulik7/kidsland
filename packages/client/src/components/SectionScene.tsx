import { WcCloud, WcHills } from './Watercolor';

/** [picture code, left %, top %, width % of the slide, tilt in degrees] */
type Item = [string, number, number, number, number?];

interface Scene {
  sky: [string, string];
  items: Item[];
}

/** Big pictures that fill the landing carousel window, one scene per section. */
const SCENES: Record<string, Scene> = {
  science: {
    sky: ['#1f2f63', '#4f5fa8'],
    items: [['1fa90', 6, 8, 30, -8], ['1f52d', 60, 34, 30, 6], ['1f680', 40, 4, 22, 20], ['1f319', 78, 4, 16], ['2604', 10, 52, 18, -20], ['1f9ea', 34, 50, 16, 8], ['2b50', 88, 52, 9]],
  },
  chess: {
    sky: ['#e9e4f5', '#f8efe2'],
    items: [['chess-board', 22, 10, 56], ['chess-k', 2, 24, 26, -6], ['chess-q', 74, 20, 26, 6], ['chess-n', 6, 58, 18, -10], ['chess-p', 80, 60, 14, 8]],
  },
  music: {
    sky: ['#fde3ec', '#fff3e6'],
    items: [['1f3b9', 26, 30, 46], ['1f3b8', 2, 6, 30, -16], ['1f3bb', 70, 4, 28, 14], ['1f941', 72, 56, 22], ['1f3b5', 42, 2, 13, -10], ['1f3b6', 6, 62, 16, 8], ['1f3a4', 52, 64, 14, -12]],
  },
  art: {
    sky: ['#fff1dc', '#fde5d8'],
    items: [['1f3a8', 30, 18, 40, -6], ['1f5bc', 2, 6, 28, -8], ['1f58c', 72, 8, 24, 20], ['1f58d', 74, 54, 20, -18], ['270f', 4, 60, 18, 30], ['1f308', 40, 0, 20]],
  },
  leisure: {
    sky: ['#e2f6ee', '#fff6e4'],
    items: [['1f373', 28, 22, 40], ['1f382', 2, 8, 26, -6], ['1f9c1', 74, 6, 22, 10], ['1f9f6', 72, 56, 22, -8], ['1f9f5', 4, 60, 18, 12], ['1f9e9', 46, 0, 14, 16], ['1faa1', 52, 66, 12, -20]],
  },
  languages: {
    sky: ['#dcecff', '#eef8ff'],
    items: [['1f30d', 30, 16, 40], ['1f4ac', 4, 4, 22, -8], ['1f4da', 74, 52, 22, 6], ['1f1ec-1f1e7', 72, 6, 16, 8], ['1f1eb-1f1f7', 4, 54, 15, -8], ['1f1ec-1f1f7', 20, 70, 13, 6], ['1f1ea-1f1f8', 58, 2, 13, -6], ['1f1ee-1f1f9', 58, 70, 12, 8]],
  },
  animals: {
    sky: ['#e3f3ff', '#f2fbea'],
    items: [['1f40e', 4, 26, 34], ['1f415', 56, 34, 30], ['1f408', 36, 46, 22], ['1f407', 84, 58, 14], ['1f99c', 66, 2, 18, -8], ['1f98b', 30, 6, 13, 12], ['1f422', 4, 70, 14]],
  },
  spirit: {
    sky: ['#efe6fb', '#fff1f5'],
    items: [['1f9d8', 30, 22, 40], ['2600', 4, 4, 22], ['1fab7', 70, 54, 24], ['1f496', 74, 8, 18, 10], ['1f54a', 4, 56, 20, -8], ['1f308', 50, 0, 18], ['1f33b', 52, 70, 13, -10]],
  },
};

const ASPECT = 1.7;

export function SectionScene({ id }: { id: string }) {
  const scene = SCENES[id];
  if (!scene) return null;
  return (
    <div className="scene" style={{ background: `linear-gradient(180deg, ${scene.sky[0]}, ${scene.sky[1]})` }}>
      <WcCloud className="scene-cloud c1" size={150} color={id === 'science' ? '#8a96d6' : '#ffffff'} />
      <WcCloud className="scene-cloud c2" size={110} color={id === 'science' ? '#7280c8' : '#fbe2d6'} />
      <WcHills className="scene-hills" />
      {scene.items.map(([code, x, y, w0, r = 0], i) => {
        // The window is about 1.7 times wider than tall: shrink a little and keep every picture inside.
        const w = w0 * 0.82;
        const top = Math.max(2, Math.min(y, 96 - w * ASPECT));
        return (
        <img
          key={code + i}
          className="scene-pic"
          src={`/img/3d/${code}.webp`}
          alt=""
          draggable={false}
          style={{ left: `${x}%`, top: `${top}%`, width: `${w}%`, ['--r' as string]: `${r}deg`, animationDelay: `${i * 0.15}s` }}
        />
        );
      })}
    </div>
  );
}
