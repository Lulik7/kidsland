import type { SubjectId } from '@kidsland/shared';

/** Simple pictograms for course subjects, drawn in white on the course colour. */
export function SubjectIcon({ subject, size = 48 }: { subject: SubjectId; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 48 48', 'aria-hidden': true } as const;
  switch (subject) {
    case 'computer':
      return (
        <svg {...common}>
          <rect x="6" y="8" width="36" height="24" rx="4" fill="#fff" />
          <rect x="10" y="12" width="28" height="16" rx="2" fill="currentColor" opacity=".35" />
          <path d="M18 38h12M24 32v6" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    case 'roblox':
      return (
        <svg {...common}>
          <rect x="10" y="10" width="28" height="28" rx="3" fill="#fff" transform="rotate(15 24 24)" />
          <rect x="20" y="20" width="8" height="8" fill="currentColor" transform="rotate(15 24 24)" />
        </svg>
      );
    case 'unity':
      return (
        <svg {...common}>
          <path d="M24 5l16 9v20l-16 9-16-9V14z" fill="#fff" />
          <path d="M24 24l16-10M24 24v19M24 24L8 14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
        </svg>
      );
    case 'scratch':
      return (
        <svg {...common}>
          <path d="M8 14h10a4 4 0 0 0 8 0h14v10H8z" fill="#fff" />
          <path d="M8 28h16a4 4 0 0 0 8 0h8v8H8z" fill="#fff" opacity=".75" />
        </svg>
      );
    case 'python':
      return (
        <svg {...common}>
          <path d="M24 6c-8 0-8 4-8 6v4h9v2H12c-4 0-6 3-6 8s2 8 6 8h4v-5c0-3 2-5 5-5h8c3 0 5-2 5-5v-7c0-4-4-6-10-6z" fill="#fff" />
          <path d="M24 42c8 0 8-4 8-6v-4h-9v-2h13c4 0 6-3 6-8s-2-8-6-8h-4v5c0 3-2 5-5 5h-8c-3 0-5 2-5 5v7c0 4 4 6 10 6z" fill="#fff" opacity=".75" />
          <circle cx="20" cy="11" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'web':
      return (
        <svg {...common}>
          <rect x="5" y="9" width="38" height="30" rx="5" fill="#fff" />
          <rect x="5" y="9" width="38" height="7" rx="3" fill="#fff" opacity=".6" />
          <path d="M19 23l-5 5 5 5M29 23l5 5-5 5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'games':
      return (
        <svg {...common}>
          <path d="M14 14h20c6 0 9 6 9 14 0 6-2 9-5 9-4 0-5-5-9-5h-10c-4 0-5 5-9 5-3 0-5-3-5-9 0-8 3-14 9-14z" fill="#fff" />
          <path d="M15 21v8M11 25h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="22" r="2.4" fill="currentColor" />
          <circle cx="36" cy="27" r="2.4" fill="currentColor" />
        </svg>
      );
    case 'logic':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="5" fill="#fff" />
          <circle cx="36" cy="12" r="5" fill="#fff" />
          <circle cx="24" cy="36" r="5" fill="#fff" />
          <path d="M12 12L24 36L36 12M12 12h24" stroke="#fff" strokeWidth="3" fill="none" opacity=".7" />
        </svg>
      );
  }
}
