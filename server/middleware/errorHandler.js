function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    const duplicateFields = Object.keys(error.keyPattern || {});
    const message = duplicateFields.includes('email')
      ? 'Email already registered'
      : 'A record with these values already exists';
    return res.status(409).json({ message });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid request data' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }

  console.error('Request failed:', error.name || 'Error');
  return res.status(500).json({ message: 'Server error' });
}

module.exports = errorHandler;
