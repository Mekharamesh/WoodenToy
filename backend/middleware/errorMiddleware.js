const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const normalizeStatusCode = (err, res) => {
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 600) {
    return err.statusCode;
  }

  if (err.status && err.status >= 400 && err.status < 600) {
    return err.status;
  }

  if (res.statusCode && res.statusCode >= 400 && res.statusCode < 600) {
    return res.statusCode;
  }

  return 500;
};

const getClientMessage = (err, statusCode) => {
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    return 'Internal server error';
  }

  if (err.name === 'ValidationError') return err.message;
  if (err.name === 'CastError') return 'Invalid resource id';
  if (err.code === 11000) return 'Duplicate value entered';

  return err.message || 'Internal server error';
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = normalizeStatusCode(err, res);

  logger.error('Request failed', err, {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
  });

  const response = {
    success: false,
    message: getClientMessage(err, statusCode),
    requestId: req.id,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
