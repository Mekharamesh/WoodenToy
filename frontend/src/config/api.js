const DEFAULT_API_URL = 'https://linen-finch-820225.hostingersite.com';

const isLocalBrowser = () => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

const resolveApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL || '';
  const normalized = envApiUrl.replace(/\/$/, '');

  if (normalized && !/localhost|127\.0\.0\.1|\[::1\]/i.test(normalized)) {
    return normalized;
  }

  if (normalized && isLocalBrowser()) {
    return normalized;
  }

  return DEFAULT_API_URL;
};

export const API_URL = resolveApiUrl();
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
