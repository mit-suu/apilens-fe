import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from './auth-token';
import { getBackendAuthUrl } from './env';
import { type AuthUser } from '@/types/global';

export const getServerAuthToken = async () => {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
};

export const getServerCurrentUser = async () => {
  const token = await getServerAuthToken();

  if (!token) return null;

  const response = await fetch(getBackendAuthUrl('/auth/me'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { user: AuthUser };

  return payload.user;
};
