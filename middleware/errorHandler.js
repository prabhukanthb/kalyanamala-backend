// ==========================================
// ERROR HANDLING MIDDLEWARE
// New Kalyanamala Matrimony
// ==========================================

const fs = require('fs');
const path = require('path');

// ==========================================
// CUSTOM ERROR CLASS
// ==========================================

class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==========================================
// VALIDATION ERROR CLASS
// ==========================================

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR', errors);
    this.errors = errors;
  }
}

// ==========================================
// AUTHENTICATION ERROR CLASS
// ==========================================

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// ==========================================
// AUTHORIZATION ERROR CLASS
// ==========================================

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// ==========================================
// NOT FOUND ERROR CLASS
// ==========================================

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

// ==========================================
// CONFLICT ERROR CLASS
// ==========================================

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

// ==========================================
// RATE LIMIT ERROR CLASS
// ==========================================

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfter;
  }
}

// ==========================================
// SERVER ERROR CLASS
// ==========================================

class ServerError extends AppError {
  constructor(message = 'Internal server error', originalError = null) {
    super(message, 500, 'SERVER_ERROR');
    this.originalError = originalError;
  }
}

// ==========================================
// ERROR LOGGER
// ==========================================

const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  
  const errorLog = {
    timestamp,
    message: error.message,
    statusCode: error.statusCode || 500,
    errorCode: error.errorCode,
    method: req?.method,
    url: req?.originalUrl,
    ip: req?.ip || req?.connection?.remoteAddress,
    userId: req?.userId,
    stack: error.stack,
    details: error.details
  };

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', {
      message: error.message,
      statusCode: error.statusCode || 500,
      url: req?.originalUrl,
      method: req?.method
    });
  }

  // Log to file
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, 'errors.log');
  fs.appendFileSync(
    logFile,
    JSON.stringify(errorLog) + '\n'
  );

  return errorLog;
};

// ==========================================
// ERROR RESPONSE FORMATTER
// ==========================================

const formatErrorResponse = (error, req = null) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.errorCode || 'ERROR',
      statusCode: error.statusCode || 500
    }
  };

  // Add details only in development or if explicitly allowed
  if (error.details && (isDevelopment || error.includeDetails)) {
    response.error.details = error.details;
  }

  // Add validation errors
  if (error.errors && error.errors.length > 0) {
    response.error.validationErrors = error.errors;
  }

  // Add stack trace only in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack.split('\n');
  }

  // Add request info for debugging (development only)
  if (isDevelopment && req) {
    response.debug = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    };
  }

  return response;
};

// ==========================================
// MAIN ERROR HANDLER MIDDLEWARE
// ==========================================

const errorHandler = (error, req, res, next) => {
  // Default to 500 server error
  error.statusCode = error.statusCode || 500;
  error.errorCode = error.errorCode || 'SERVER_ERROR';

  // Log the error
  logError(error, req);

  // Format error response
  const response = formatErrorResponse(error, req);

  // Set response headers
  res.status(error.statusCode);

  // Add retry-after header for rate limit errors
  if (error.statusCode === 429) {
    res.set('Retry-After', error.retryAfter || 60);
  }

  // Send response
  res.json(response);
};

// ==========================================
// ASYNC ERROR WRAPPER
// ==========================================

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==========================================
// VALIDATE REQUEST BODY
// ==========================================

const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    req.validatedBody = value;
    next();
  };
};

// ==========================================
// VALIDATE REQUEST PARAMS
// ==========================================

const validateRequestParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return next(new ValidationError('Parameter validation failed', errors));
    }

    req.validatedParams = value;
    next();
  };
};

// ==========================================
// VALIDATE REQUEST QUERY
// ==========================================

const validateRequestQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return next(new ValidationError('Query validation failed', errors));
    }

    req.validatedQuery = value;
    next();
  };
};

// ==========================================
// CATCH NOT FOUND
// ==========================================

const catchNotFound = (req, res, next) => {
  const error = new NotFoundError('Endpoint');
  error.details = `${req.method} ${req.originalUrl}`;
  next(error);
};

// ==========================================
// HANDLE MONGOOSE ERRORS
// ==========================================

const handleMongooseError = (error) => {
  // Validation error
  if (error.name === 'ValidationError') {
    const errors = Object.entries(error.errors).map(([field,err]) => ({
      field,
      message: err.message
    }));
    return new ValidationError('Database validation failed', errors);
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return new ValidationError('Invalid ID format', [
      { field: error.path, message: 'Invalid MongoDB ID' }
    ]);
  }

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new ConflictError(`${field} already exists`);
  }

  // Unknown mongoose error
  return new ServerError('Database error', error);
};

// ==========================================
// HANDLE JWT ERRORS
// ==========================================

const handleJwtError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  return error;
};

// ==========================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ==========================================

const globalErrorHandler = (error, req, res, next) => {
  // Handle specific error types
  if (error.name === 'ValidationError' || 
      error.name === 'CastError' || 
      error.code === 11000) {
    error = handleMongooseError(error);
  }

  if (error.name === 'JsonWebTokenError' || 
      error.name === 'TokenExpiredError') {
    error = handleJwtError(error);
  }

  // If it's not an AppError, convert it
  if (!(error instanceof AppError)) {
    console.error('Unhandled error:', error);
    error = new ServerError('An unexpected error occurred', error);
  }

  // Call the main error handler
  errorHandler(error, req, res, next);
};

// ==========================================
// SAFE ERROR HANDLER FOR JSON PARSING
// ==========================================

const jsonErrorHandler = (error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    const jsonError = new ValidationError('Invalid JSON in request body');
    return errorHandler(jsonError, req, res, next);
  }
  next(error);
};

// ==========================================
// HANDLE UNHANDLED REJECTIONS
// ==========================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Log to file
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, 'unhandled-rejections.log');
  fs.appendFileSync(
    logFile,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : null
    }) + '\n'
  );
});

// ==========================================
// HANDLE UNCAUGHT EXCEPTIONS
// ==========================================

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  
  // Log to file
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, 'uncaught-exceptions.log');
  fs.appendFileSync(
    logFile,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    }) + '\n'
  );

  // Exit process
  process.exit(1);
});

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,

  // Handlers
  errorHandler,
  globalErrorHandler,
  jsonErrorHandler,
  asyncHandler,

  // Validators
  validateRequestBody,
  validateRequestParams,
  validateRequestQuery,

  // Utilities
  logError,
  formatErrorResponse,
  handleMongooseError,
  handleJwtError,
  catchNotFound
};
