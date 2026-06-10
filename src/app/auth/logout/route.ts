import { AUTH_TOKEN_COOKIE } from '@/libs/auth-token';
import { getBackendAuthUrl } from '@/libs/env';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (token) {
    await fetch(getBackendAuthUrl('/auth/logout'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }).catch(() => undefined);
  }

  cookieStore.delete(AUTH_TOKEN_COOKIE);

  return NextResponse.redirect(new URL('/', request.url));
}
