const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction ? 'Internal server error' : err.message,
    error: {
      code: err.code || err.name || 'Error',
      requestId: req.id,
    },
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
