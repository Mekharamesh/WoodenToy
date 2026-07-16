const crypto = require('crypto');

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 300;
const rateLimitStore = new Map();

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  next();
};

const requestId = (req, res, next) => {
  const inboundId = req.headers['x-request-id'];
  req.id = typeof inboundId === 'string' && inboundId.trim()
    ? inboundId.trim().slice(0, 128)
    : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

const rateLimiter = ({
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_WINDOW_MS),
  maxRequests = Number(process.env.RATE_LIMIT_MAX || DEFAULT_MAX_REQUESTS),
} = {}) => {
  const cleanupInterval = Math.max(windowMs, DEFAULT_WINDOW_MS);

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, cleanupInterval).unref();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = rateLimitStore.get(key);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        error: { code: 'RATE_LIMIT_EXCEEDED' },
      });
    }

    return next();
  };
};

module.exports = {
  requestId,
  securityHeaders,
  rateLimiter,
};
