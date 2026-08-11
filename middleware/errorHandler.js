const catchNotFound = (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
};

const globalErrorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

module.exports = { catchNotFound, globalErrorHandler };
