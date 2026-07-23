import { AUTH_TOKEN_COOKIE } from '@/libs/auth-token';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const oneDay = 60 * 60 * 24;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/?auth=failed', request.url));
  }

  const cookieStore = await cookies();

  cookieStore.set(AUTH_TOKEN_COOKIE, token, {
    path: '/',
    maxAge: oneDay,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
