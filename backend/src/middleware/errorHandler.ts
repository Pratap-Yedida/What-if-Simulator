import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors: any;

  constructor(message: string, errors: any = null) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

// Main error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    
    if (error instanceof ValidationError) {
      errors = error.errors;
    }
  } else if (error.name === 'ValidationError') {
    // Mongoose/Joi validation errors
    statusCode = 400;
    message = 'Validation Error';
    errors = error.message;
  } else if (error.name === 'CastError') {
    // MongoDB cast errors
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate field value';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  }

  // Log error details
  const errorLog = {
    requestId: (req as any).id || 'unknown',
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: error.message,
    stack: error.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Internal Server Error', errorLog);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', errorLog);
  }

  // Prepare response - match frontend expectations
  const isDevelopment = process.env['NODE_ENV'] !== 'production';
  
  const response: any = {
    success: false,
    message: isDevelopment ? (error.message || message) : message, // Show actual error in dev
    ...(errors && { errors }),
    ...(isDevelopment && {
      error: error.message,
      stack: error.stack,
      details: {
        code: (error as any).code,
        name: error.name,
        ...errorLog,
      },
      requestId: (req as any).id || 'unknown',
    }),
  };

  // Log to console in development for immediate visibility
  if (isDevelopment) {
    console.error('=== ERROR DETAILS ===');
    console.error('Message:', error.message);
    console.error('Code:', (error as any).code);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    console.error('Request:', req.method, req.originalUrl);
    console.error('Body:', req.body);
    console.error('====================');
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create error response helper
export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  errors: any = null
) => {
  return {
    error: {
      message,
      statusCode,
      ...(errors && { errors }),
    },
  };
};
