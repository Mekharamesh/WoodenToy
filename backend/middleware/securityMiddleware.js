const crypto = require('crypto');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const DEFAULT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || (isProduction ? 1000 : 10000));
const SKIP_DEV_GET_RATE_LIMIT = process.env.RATE_LIMIT_SKIP_DEV_GETS !== 'false';

const requestId = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  req.id = typeof incomingId === 'string' && incomingId.trim()
    ? incomingId.trim()
    : crypto.randomUUID();

  res.setHeader('X-Request-Id', req.id);
  next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

const rateLimiter = (options = {}) => {
  const windowMs = Number(options.windowMs || DEFAULT_WINDOW_MS);
  const max = Number(options.max || DEFAULT_MAX_REQUESTS);
  const hits = new Map();

  const sweep = () => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  };

  const interval = setInterval(sweep, Math.min(windowMs, 60 * 1000));
  interval.unref?.();

  return (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (!isProduction && SKIP_DEV_GET_RATE_LIMIT && req.method === 'GET') return next();

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        requestId: req.id,
      });
    }

    return next();
  };
};

const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    logger[level]('HTTP request completed', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

module.exports = {
  requestId,
  securityHeaders,
  rateLimiter,
  requestLogger,
};
