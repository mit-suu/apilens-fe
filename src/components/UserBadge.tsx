import { type AuthUser } from '@/types/global';
import Link from 'next/link';

function MenuIcon({ type }: { type: 'dashboard' | 'history' | 'github' | 'logout' }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'h-3.5 w-3.5',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };

  if (type === 'dashboard') {
    return (
      <svg {...commonProps}>
        <rect height="7" rx="1.5" width="7" x="3" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="14" />
        <rect height="7" rx="1.5" width="7" x="3" y="14" />
      </svg>
    );
  }

  if (type === 'history') {
    return (
      <svg {...commonProps}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (type === 'github') {
    return (
      <svg {...commonProps}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function UserBadge({ user }: { user: AuthUser }) {
  const displayName = user.name || user.email || 'GitHub user';
  const fallbackInitial = displayName.slice(0, 1).toUpperCase();

  const isMitSuu =
    (user.providers?.username || '').toLowerCase() === 'mit-suu' ||
    (user.name || '').toLowerCase().includes('mit-suu') ||
    (user.email || '').toLowerCase().includes('mit-suu') ||
    user.role === 'admin';

  return (
    <div className="user-badge-menu">
      <div className="user-badge-popup">
        <input
          aria-label="Toggle user menu"
          id="user-badge-menu-toggle"
          type="checkbox"
        />
        <label className="user-badge-trigger" htmlFor="user-badge-menu-toggle">
          <span className="hidden max-w-[180px] truncate text-sm text-[var(--muted)] sm:inline">
            {displayName}
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-white/[0.06] text-xs font-semibold uppercase text-[var(--text)]">
            {user.avatarUrl ? (
              <img
                alt={`${displayName} GitHub avatar`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                src={user.avatarUrl}
              />
            ) : (
              fallbackInitial
            )}
          </span>
          <span className="user-badge-burger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </label>

        <nav className="user-badge-window" aria-label="User actions">
          <legend>Account</legend>
          <div className="px-3 pb-2">
            <p className="truncate text-sm font-semibold text-[var(--text)]">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--subtle)]">
              {user.email || (user.providers.github ? 'Connected with GitHub' : user.role)}
            </p>
          </div>
          <ul>
            <li>
              <Link href="/dashboard">
                <MenuIcon type="dashboard" />
                <span>Analytics Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/app">
                <MenuIcon type="dashboard" />
                <span>Scan Repository</span>
              </Link>
            </li>
            <li>
              <Link href="/app/history">
                <MenuIcon type="history" />
                <span>Scan history</span>
              </Link>
            </li>
            {isMitSuu && (
              <li>
                <Link href="/admin" className="text-amber-400 font-semibold">
                  <MenuIcon type="dashboard" />
                  <span>Admin Console</span>
                </Link>
              </li>
            )}
            <hr />
            <li>
              <a
                href="https://github.com/settings/connections/applications"
                rel="noreferrer"
                target="_blank"
              >
                <MenuIcon type="github" />
                <span>GitHub access</span>
              </a>
            </li>
            <hr />
            <li>
              <form action="/auth/logout" method="post">
                <button type="submit">
                  <MenuIcon type="logout" />
                  <span>Logout</span>
                </button>
              </form>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
