import { Request, Response, NextFunction } from 'express';

export interface ErrorWithStatus extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, { message: string }>;
}

// 404 Not Found handler
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
};

// Global error handling middleware
export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error status and message
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error 💥', {
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    return handleJWTError(res);
  }
  
  if (err.name === 'TokenExpiredError') {
    return handleJWTExpiredError(res);
  }
  
  if (err.name === 'ValidationError') {
    return handleValidationError(err, res);
  }
  
  if (err.code === 11000) {
    return handleDuplicateFieldsDB(err, res);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return handlePrismaError(err, res);
  }

  // Handle other operational errors
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message,
    });
  }

  // Handle unknown errors in production
  if (process.env.NODE_ENV === 'production') {
    // Log the error
    console.error('ERROR 💥', err);
    
    // Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // In development, send detailed error
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Error handlers for specific error types
const handleJWTError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Invalid token. Please log in again!',
  });
};

const handleJWTExpiredError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Your token has expired! Please log in again.',
  });
};

const handleValidationError = (err: ErrorWithStatus, res: Response) => {
  const errors = Object.values(err.errors || {}).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  
  return res.status(400).json({
    status: 'error',
    message,
  });
};

const handleDuplicateFieldsDB = (err: ErrorWithStatus, res: Response) => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : 'field';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  
  return res.status(400).json({
    status: 'error',
    message,
  });
};

const handlePrismaError = (err: any, res: Response) => {
  let statusCode = 500;
  let message = 'Database error';
  
  // Handle specific Prisma error codes
  switch (err.code) {
    case 'P2002':
      statusCode = 400;
      message = `Duplicate field value: ${err.meta?.target?.join(', ')}`;
      break;
    case 'P2025':
      statusCode = 404;
      message = 'Record not found';
      break;
    case 'P2003':
      statusCode = 400;
      message = 'Invalid reference';
      break;
    // Add more Prisma error codes as needed
  }
  
  return res.status(statusCode).json({
    status: 'error',
    message,
  });
};

// Utility function to create custom error objects
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
