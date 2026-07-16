const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const {
  connectDatabase,
  closeDatabase,
  getDBStatus,
  waitForDatabase,
} = require('./config/database');
const logger = require('./utils/logger');
const {
  requestId,
  securityHeaders,
  rateLimiter,
  requestLogger,
} = require('./middleware/securityMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const catalogV2Routes = require('./routes/catalogV2Routes');
const staffRoutes = require('./routes/staffRoutes');
const roleRoutes = require('./routes/roleRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const feeRoutes = require('./routes/feeRoutes');
const cancellationRoutes = require('./routes/cancellationRoutes');
const refundRoutes = require('./routes/refundRoutes');
const walletRoutes = require('./routes/walletRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const cmsRoutes = require('./routes/cmsRoutes');

const parseCsv = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isLocalDevelopmentOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const { hostname, protocol } = new URL(origin);
    const isHttp = protocol === 'http:' || protocol === 'https:';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateLan =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    return isHttp && (isLocalhost || isPrivateLan);
  } catch (err) {
    return false;
  }
};

const buildAllowedOrigins = () => new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://darkorange-louse-498272.hostingersite.com',
  'https://linen-finch-820225.hostingersite.com',
  process.env.FRONTEND_URL,
  ...parseCsv(process.env.FRONTEND_URLS),
  ...parseCsv(process.env.CORS_ORIGINS),
].filter(Boolean));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = buildAllowedOrigins();
    if (allowedOrigins.has(origin) || isLocalDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    logger.warn('CORS blocked request', { origin });
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  optionsSuccessStatus: 204,
};

const dbConnectionGuard = async (req, res, next) => {
  if (req.method === 'OPTIONS' || req.path === '/health') {
    return next();
  }

  const ready = await waitForDatabase(Number(process.env.DB_REQUEST_WAIT_MS || 2000));
  if (ready) return next();

  logger.warn('Request rejected because MongoDB is unavailable', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    db: getDBStatus(),
  });

  return res.status(503).json({
    success: false,
    message: 'Database unavailable. Please retry shortly.',
    requestId: req.id,
    db: getDBStatus(),
  });
};

const createHealthPayload = () => ({
  success: true,
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  cpu: process.cpuUsage(),
  db: getDBStatus(),
  pid: process.pid,
  version: process.version,
  env: process.env.NODE_ENV || 'development',
});

const registerProcessHandlers = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', err);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(
      'UNHANDLED REJECTION',
      reason instanceof Error ? reason : { reason }
    );
  });

  process.on('warning', (warning) => {
    logger.warn('PROCESS WARNING', {
      name: warning.name,
      message: warning.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : warning.stack,
    });
  });
};

const startResourceLogger = () => {
  const intervalMs = Number(process.env.RESOURCE_LOG_INTERVAL_MS || 5 * 60 * 1000);
  if (intervalMs <= 0) return null;

  const interval = setInterval(() => {
    logger.info('Process resource usage', {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      db: getDBStatus(),
    });
  }, intervalMs);

  interval.unref?.();
  return interval;
};

const mountRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/v2/catalog', catalogV2Routes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/fees', feeRoutes);
  app.use('/api/cancellation-rules', cancellationRoutes);
  app.use('/api/refunds', refundRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/cms', cmsRoutes);
};

const createApp = () => {
  const app = express();
  app.set('trust proxy', true);

  app.use(requestId);
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '2mb' }));
  app.use(rateLimiter());
  app.use(requestLogger);

  app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    immutable: true,
  }));

  app.use((req, res, next) => {
    if (!req.path.startsWith('/uploads')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  app.get('/', (req, res) => {
    res.json({ success: true, message: 'API is running...', requestId: req.id });
  });

  app.get(['/health', '/api/health'], (req, res) => {
    const payload = createHealthPayload();
    const statusCode = payload.db.readyState === 1 ? 200 : 503;
    res.status(statusCode).json(payload);
  });

  app.use('/api', dbConnectionGuard);
  mountRoutes(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const initializeServer = async () => {
  registerProcessHandlers();
  startResourceLogger();

  try {
    await connectDatabase();
  } catch (err) {
    logger.error('Server starting with MongoDB unavailable; API routes will return 503 until reconnect succeeds', err);
  }

  const app = createApp();
  const PORT = Number(process.env.PORT || 5000);
  let serverStarted = false;
  const server = app.listen(PORT, () => {
    serverStarted = true;
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  server.keepAliveTimeout = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 65000);
  server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 66000);
  server.requestTimeout = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 120000);

  server.on('error', (err) => {
    logger.error('HTTP server error', err);
    if (!serverStarted) {
      closeDatabase().finally(() => {
        process.exitCode = 1;
      });
    }
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

initializeServer().catch((err) => {
  logger.error('Fatal server initialization failure', err);
});
