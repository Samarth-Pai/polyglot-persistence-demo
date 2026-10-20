/**
 * Centralized error handler middleware
 */
export function errorHandler(err, req, res, _next) {
  console.error('Unhandled Application Error:', err);

  // Default to 500 internal server error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Route Not Found handler
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}
