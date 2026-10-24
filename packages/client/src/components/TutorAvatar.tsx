const GRADIENTS = [
  ['#ff9a3d', '#ff6b3d'],
  ['#7b5cff', '#4c2fd6'],
  ['#38bdf8', '#1679a8'],
  ['#43d68a', '#1f9a50'],
  ['#ff6fb5', '#d63a86'],
  ['#ffc93c', '#e09b00'],
];

/** Initials on a colour picked from the name, so each tutor keeps the same colour everywhere. */
export function TutorAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [a, b] = GRADIENTS[h % GRADIENTS.length];
  return (
    <span
      className="tutor-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
