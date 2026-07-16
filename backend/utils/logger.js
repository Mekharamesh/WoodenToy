const LEVELS = ['debug', 'http', 'info', 'warn', 'error'];
const activeLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const shouldLog = (level) => LEVELS.indexOf(level) >= LEVELS.indexOf(activeLevel);

const serializeError = (error) => {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  };
};

const write = (level, message, meta = {}) => {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

module.exports = {
  debug: (message, meta) => write('debug', message, meta),
  http: (message, meta) => write('http', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  // Allow passing an Error object as the second argument, or just meta
  error: (message, errorOrMeta, meta = {}) => {
    if (errorOrMeta instanceof Error) {
      write('error', message, { ...meta, error: serializeError(errorOrMeta) });
    } else {
      write('error', message, errorOrMeta);
    }
  },
};
