import { type AuthUser } from '@/types/global';

export default function UserBadge({ user }: { user: AuthUser }) {
  const displayName = user.name || user.email || 'GitHub user';
  const fallbackInitial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="hidden max-w-[180px] truncate text-sm text-[var(--muted)] sm:inline">
        {displayName}
      </span>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-white/[0.06] text-xs font-semibold uppercase text-[var(--text)]">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${displayName} GitHub avatar`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          fallbackInitial
        )}
      </div>
    </div>
  );
}
