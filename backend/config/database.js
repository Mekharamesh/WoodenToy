const mongoose = require('mongoose');
const logger = require('../utils/logger');

mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let isConnected = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let intentionalShutdown = false;
let lastError = null;

const MAX_RECONNECT_ATTEMPTS = Number(process.env.MONGO_MAX_RECONNECT_ATTEMPTS || 0);
const RECONNECT_INTERVAL_MS = Number(process.env.MONGO_RECONNECT_INTERVAL_MS || 5000);

const getConnectionOptions = () => ({
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000),
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
  heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_MS || 10000),
  bufferCommands: false,
  family: 4,
  autoIndex: process.env.NODE_ENV !== 'production',
});

const getMongoURI = () => {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.ATLAS_MONGO_URI ||
    '';

  if (!uri) {
    const useLocal =
      process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1';

    if (useLocal) {
      return process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/woodentoy';
    }
  }

  return uri;
};

const canAttemptReconnect = () => (
  !MAX_RECONNECT_ATTEMPTS || reconnectAttempts < MAX_RECONNECT_ATTEMPTS
);

const scheduleReconnect = () => {
  const state = mongoose.connection.readyState;

  if (intentionalShutdown || reconnectTimer || state === 1 || state === 2) {
    return;
  }

  if (!canAttemptReconnect()) {
    logger.error('MongoDB max reconnect attempts reached; server remains alive and health check is unhealthy');
    return;
  }

  reconnectAttempts += 1;
  logger.warn('Scheduling MongoDB reconnect', {
    reconnectAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS || 'unlimited',
    reconnectInMs: RECONNECT_INTERVAL_MS,
  });

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    try {
      const uri = getMongoURI();
      if (!uri) {
        throw new Error('No MongoDB URI configured for reconnect');
      }

      await mongoose.connect(uri, getConnectionOptions());
    } catch (err) {
      lastError = err;
      logger.error('MongoDB reconnect failed', err);
      scheduleReconnect();
    }
  }, RECONNECT_INTERVAL_MS);

  reconnectTimer.unref?.();
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  reconnectAttempts = 0;
  lastError = null;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  logger.info('MongoDB connected', {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    readyState: mongoose.connection.readyState,
  });
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
  scheduleReconnect();
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  reconnectAttempts = 0;
  lastError = null;
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  lastError = err;
  logger.error('MongoDB connection error', err);
});

mongoose.connection.on('close', () => {
  isConnected = false;
  logger.info('MongoDB connection closed');
  scheduleReconnect();
});

const connectDatabase = async () => {
  intentionalShutdown = false;

  const uri = getMongoURI();
  if (!uri) {
    throw new Error('No MongoDB URI configured. Set MONGODB_URI or MONGO_URI in backend/.env.');
  }

  const targetLabel = uri.includes('mongodb+srv') ? 'Atlas' : 'Local';
  logger.info(`Connecting to ${targetLabel} MongoDB...`);

  try {
    await mongoose.connect(uri, getConnectionOptions());
  } catch (err) {
    lastError = err;
    logger.error('Initial MongoDB connection failed', err);

    const useLocal =
      process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1';
    const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/woodentoy';

    if (targetLabel === 'Atlas' && useLocal) {
      logger.warn('Falling back to local MongoDB...');
      try {
        await mongoose.connect(localUri, getConnectionOptions());
        return;
      } catch (localErr) {
        lastError = localErr;
        logger.error('Local MongoDB fallback also failed', localErr);
      }
    }

    scheduleReconnect();
    throw new Error('No database available on startup');
  }
};

const closeDatabase = async () => {
  intentionalShutdown = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (err) {
    logger.error('Error closing MongoDB connection', err);
  }
};

const getDBStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: stateMap[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    isConnected,
    reconnectAttempts,
    lastError: lastError ? lastError.message : null,
  };
};

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const waitForDatabase = async (timeoutMs = 2000) => {
  if (isDatabaseReady()) return true;

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (isDatabaseReady()) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
};

module.exports = {
  connectDatabase,
  closeDatabase,
  getDBStatus,
  isDatabaseReady,
  waitForDatabase,
};
