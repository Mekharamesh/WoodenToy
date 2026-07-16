const RAW_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');
const FALLBACK_IMAGE = '/wood-placeholder.png';

export const normalizeImageValue = (image) => {
  if (!image) return null;

  if (typeof image === 'string') return image;

  if (typeof image === 'object') {
    if (typeof image.url === 'string') return image.url;
    if (typeof image.path === 'string') return image.path;
    if (Array.isArray(image)) {
      for (const entry of image) {
        const normalized = normalizeImageValue(entry);
        if (normalized) return normalized;
      }
    }
  }

  return null;
};

export const getImageSrc = (image, fallback = FALLBACK_IMAGE) => {
  const normalized = normalizeImageValue(image);

  if (!normalized) return fallback;

  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) return normalized;

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      if (url.pathname.startsWith('/uploads/')) {
        return `${API_BASE_URL}${url.pathname}`;
      }
    } catch {
      return fallback;
    }
    return normalized;
  }

  if (normalized.startsWith('/uploads') || normalized.startsWith('uploads/')) {
    return `${API_BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
  }

  return normalized;
};
