export const AUTH_TOKEN_COOKIE = 'apilens_token';

const maxAge = 60 * 60 * 24;

const encodeCookieValue = (value: string) => encodeURIComponent(value);

const getCookieValue = (name: string) => {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : null;
};

export const getBrowserAuthToken = () => getCookieValue(AUTH_TOKEN_COOKIE);

export const setBrowserAuthToken = (token: string) => {
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeCookieValue(
    token
  )}; path=/; max-age=${maxAge}; samesite=lax`;
};

export const clearBrowserAuthToken = () => {
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
};
