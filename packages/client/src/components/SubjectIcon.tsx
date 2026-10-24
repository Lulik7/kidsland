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
    case 'science':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="5" fill="#fff" />
          <ellipse cx="24" cy="24" rx="19" ry="7.5" stroke="#fff" strokeWidth="3" fill="none" />
          <ellipse cx="24" cy="24" rx="19" ry="7.5" stroke="#fff" strokeWidth="3" fill="none" transform="rotate(60 24 24)" />
          <ellipse cx="24" cy="24" rx="19" ry="7.5" stroke="#fff" strokeWidth="3" fill="none" transform="rotate(-60 24 24)" />
        </svg>
      );
    case 'chess':
      return (
        <svg {...common}>
          <path d="M18 8h3v3h6V8h3v3h3v6l-4 4v9h-10v-9l-4-4v-6h3z" fill="#fff" />
          <rect x="12" y="32" width="24" height="5" rx="2" fill="#fff" />
          <rect x="9" y="38" width="30" height="5" rx="2" fill="#fff" opacity=".8" />
        </svg>
      );
    case 'music':
      return (
        <svg {...common}>
          <path d="M18 34V12l22-5v22" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
          <ellipse cx="13" cy="35" rx="6" ry="5" fill="#fff" />
          <ellipse cx="35" cy="30" rx="6" ry="5" fill="#fff" />
          <path d="M18 17l22-5" stroke="#fff" strokeWidth="3.5" />
        </svg>
      );
    case 'art':
      return (
        <svg {...common}>
          <path d="M24 6C13 6 5 14 5 24s8 18 17 18c3 0 4-2 4-4 0-3-3-4-1-7 2-2 6-1 10-1 5 0 8-3 8-8C43 13 35 6 24 6z" fill="#fff" />
          <circle cx="14" cy="22" r="3" fill="currentColor" />
          <circle cx="20" cy="14" r="3" fill="currentColor" opacity=".7" />
          <circle cx="30" cy="14" r="3" fill="currentColor" opacity=".5" />
          <circle cx="36" cy="22" r="3" fill="currentColor" opacity=".8" />
        </svg>
      );
    case 'leisure':
      return (
        <svg {...common}>
          <circle cx="20" cy="26" r="13" fill="#fff" />
          <path d="M10 20c6 4 14 4 20 0M9 29c6 4 16 4 22 0M14 15c2 8 2 16 0 23" stroke="currentColor" strokeWidth="2.2" fill="none" opacity=".55" />
          <path d="M30 18l12-12" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M33 26l9-16" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity=".7" />
        </svg>
      );
    case 'languages':
      return (
        <svg {...common}>
          <path d="M6 8h22a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H16l-7 6v-6H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#fff" />
          <path d="M22 22h20a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-2v6l-7-6H22a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" fill="#fff" opacity=".7" />
          <text x="10" y="21" fontSize="11" fontWeight="800" fill="currentColor">Aa</text>
        </svg>
      );
    case 'animals':
      return (
        <svg {...common}>
          <ellipse cx="24" cy="32" rx="10" ry="8" fill="#fff" />
          <ellipse cx="11" cy="21" rx="4.5" ry="5.5" fill="#fff" />
          <ellipse cx="37" cy="21" rx="4.5" ry="5.5" fill="#fff" />
          <ellipse cx="18" cy="12" rx="4.5" ry="5.5" fill="#fff" />
          <ellipse cx="30" cy="12" rx="4.5" ry="5.5" fill="#fff" />
        </svg>
      );
    case 'spirit':
      return (
        <svg {...common}>
          <path d="M24 41S6 30 6 18a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 23-18 23z" fill="#fff" />
          <path d="M17 21c2 3 5 4 7 4s5-1 7-4" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
}
