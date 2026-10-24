export const StarIcon = ({ on, size = 22 }: { on: boolean; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path
      d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5-4.9-4.5 6.6-.8z"
      fill={on ? '#ffd23f' : '#d9d3e8'}
      stroke={on ? '#c98a00' : '#b9b0cf'}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const LockIcon = ({ size = 34 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <rect x="4" y="10" width="16" height="12" rx="3" fill="#fff" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#fff" strokeWidth="3" fill="none" />
    <circle cx="12" cy="16" r="2" fill="#8a84a6" />
  </svg>
);

export const CrownIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#ffd23f" stroke="#c98a00" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
