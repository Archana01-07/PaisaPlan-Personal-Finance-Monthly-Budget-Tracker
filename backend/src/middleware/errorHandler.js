function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An entry with this ${field} already exists.`,
      errors: [{ field, message: `${field} is already in use` }],
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: errors[0]?.message || 'Validation failed',
      errors,
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format for ${err.path}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.',
    });
  }

  // Generic fallback
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred',
  });
}

module.exports = {
  errorHandler,
};
