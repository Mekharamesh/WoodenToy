const LEVELS = ['debug', 'info', 'warn', 'error'];
const activeLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const shouldLog = (level) => LEVELS.indexOf(level) >= LEVELS.indexOf(activeLevel);

const serializeError = (error) => ({
  name: error?.name,
  message: error?.message,
  stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
});

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
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, error, meta = {}) => write('error', message, { ...meta, error: serializeError(error) }),
};
