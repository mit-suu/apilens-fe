'use client';

import Link from 'next/link';
import UserBadge from '@/components/UserBadge';
import { type AuthUser } from '@/types/global';

interface AppHeaderProps {
  user: AuthUser;
  activeTab?: 'dashboard' | 'scan' | 'history' | 'admin';
  sourceMode?: 'repos' | 'url';
  onSourceModeChange?: (mode: 'repos' | 'url') => void;
}

export default function AppHeader({
  user,
  activeTab,
  sourceMode = 'repos',
  onSourceModeChange,
}: AppHeaderProps) {
  const navLinkClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition ${
      active
        ? 'border border-[var(--border-strong)] bg-white/[0.06] font-medium text-white'
        : 'text-[var(--muted)] hover:bg-white/[0.06] hover:text-white'
    }`;

  const isMitSuu =
    (user.providers?.username || '').toLowerCase() === 'mit-suu' ||
    (user.name || '').toLowerCase().includes('mit-suu') ||
    (user.email || '').toLowerCase().includes('mit-suu') ||
    user.role === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(9,13,20,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white">
            APILens
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex" aria-label="App navigation">
            <Link href="/dashboard" className={navLinkClass(activeTab === 'dashboard')}>
              Dashboard
            </Link>

            {onSourceModeChange ? (
              <>
                <button
                  type="button"
                  onClick={() => onSourceModeChange('repos')}
                  className={navLinkClass(activeTab === 'scan' && sourceMode === 'repos')}
                >
                  Scan Repos
                </button>
                <button
                  type="button"
                  onClick={() => onSourceModeChange('url')}
                  className={navLinkClass(activeTab === 'scan' && sourceMode === 'url')}
                >
                  Repo URL
                </button>
              </>
            ) : (
              <Link href="/app" className={navLinkClass(activeTab === 'scan')}>
                Scan Repository
              </Link>
            )}

            <Link href="/app/history" className={navLinkClass(activeTab === 'history')}>
              History
            </Link>

            {isMitSuu && (
              <Link
                href="/admin"
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ml-2 ${
                  activeTab === 'admin'
                    ? 'border border-amber-500/50 bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                Admin Console
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <UserBadge user={user} />
        </div>
      </div>
    </header>
  );
}
