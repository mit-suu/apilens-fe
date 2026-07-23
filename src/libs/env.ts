const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined' && process.env.BACKEND_INTERNAL_URL) {
    return trimTrailingSlash(process.env.BACKEND_INTERNAL_URL);
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required');
  }

  return trimTrailingSlash(apiBaseUrl);
};

export const getBackendAuthUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (path.includes('/auth/github') || path.includes('/auth/google')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBaseUrl) {
      return `${trimTrailingSlash(apiBaseUrl)}${normalizedPath}`;
    }
  }

  return `${getApiBaseUrl()}${normalizedPath}`;
};
